/**
 * Alberto CRM Import — pre-partnership contacts & customers
 *
 * Reads Alberto's customer xlsx from LOCAL DISK ONLY and maps it onto the
 * existing `companies` + `contacts` schema.
 *
 * SAFETY:
 *   - Default mode is DRY-RUN: reads the file, computes the full mapping,
 *     prints counts + a 10-row sample, and writes NOTHING to the database.
 *   - Live writes require the explicit `--commit` flag (not implemented in v1;
 *     dry-run only until Peter approves the mapping).
 *
 * Usage:
 *   npx tsx scripts/import-alberto-crm.ts            # dry-run (default)
 *   npx tsx scripts/import-alberto-crm.ts --file "/path/to.xlsx"
 *
 * Source columns: First Name, Last Name, Email, Client Company, Type, Phone, Cell Phone, Custom Field
 */

import XLSX from "xlsx";
import * as fs from "fs";

// ---- Config -----------------------------------------------------------------

const DEFAULT_FILE =
  process.env.HOME + "/Downloads/Clients_19092024_0810 v3.xlsx";

const IMPORT_BATCH_ID = "alberto_pre_partnership_2026-07-11";
const LEAD_SOURCE = "alberto_pre_partnership";
const PRE_PARTNERSHIP_TAG = "pre-partnership";

// ---- CLI args ---------------------------------------------------------------

const args = process.argv.slice(2);
const COMMIT = args.includes("--commit");
const fileArgIdx = args.indexOf("--file");
const FILE = fileArgIdx >= 0 ? args[fileArgIdx + 1] : DEFAULT_FILE;

// ---- Helpers ----------------------------------------------------------------

function normEmail(v: unknown): string | null {
  if (!v) return null;
  const s = String(v).trim().toLowerCase();
  return s.length ? s : null;
}

function normPhone(v: unknown): string | null {
  if (!v) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function normText(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function companyKey(name: string | null): string {
  return (name ?? "").trim().toLowerCase();
}

// ---- Types ------------------------------------------------------------------

interface MappedContact {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null; // from Cell Phone
  tags: string[];
  notes: string | null;
  companyKey: string; // links to MappedCompany
}

interface MappedCompany {
  name: string;
  phone: string | null;
  leadSource: string;
  importBatchId: string;
  contactCount: number;
}

// ---- Main -------------------------------------------------------------------

function main() {
  console.log("=".repeat(70));
  console.log("Alberto CRM Import —", COMMIT ? "COMMIT MODE" : "DRY-RUN (no DB writes)");
  console.log("=".repeat(70));

  if (COMMIT) {
    console.error(
      "\n[ABORT] --commit is not enabled in v1. Dry-run only until the mapping is approved.\n"
    );
    process.exit(2);
  }

  if (!fs.existsSync(FILE)) {
    console.error(`\n[ERROR] File not found: ${FILE}\n`);
    process.exit(1);
  }
  console.log(`\nSource: ${FILE}`);
  console.log(`File size: ${(fs.statSync(FILE).size / 1024).toFixed(0)} KB`);

  const wb = XLSX.readFile(FILE);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  // The sheet has a 6-row legend/status preamble, and column A is a blank row-index
  // column. Read as array-of-arrays, locate the real "First Name" header row, then
  // map columns by position relative to it.
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });

  let headerIdx = -1;
  let colBase = -1;
  for (let i = 0; i < aoa.length; i++) {
    const row = aoa[i] || [];
    const fnCol = row.findIndex((c) => c && String(c).trim() === "First Name");
    if (fnCol >= 0) {
      headerIdx = i;
      colBase = fnCol; // column index where "First Name" sits
      break;
    }
  }
  if (headerIdx < 0) {
    console.error("\n[ERROR] Could not locate 'First Name' header row in sheet.\n");
    process.exit(1);
  }

  // Fixed column layout starting at colBase:
  // First Name, Last Name, Email, Client Company, Type, Phone, Cell Phone, Custom Field
  const C = {
    firstName: colBase,
    lastName: colBase + 1,
    email: colBase + 2,
    company: colBase + 3,
    type: colBase + 4,
    phone: colBase + 5,
    cell: colBase + 6,
    custom: colBase + 7,
  };

  const rows = aoa.slice(headerIdx + 1).map((r) => ({
    "First Name": r[C.firstName],
    "Last Name": r[C.lastName],
    Email: r[C.email],
    "Client Company": r[C.company],
    Type: r[C.type],
    Phone: r[C.phone],
    "Cell Phone": r[C.cell],
    "Custom Field": r[C.custom],
  })) as Record<string, unknown>[];

  console.log(`Sheet: "${wb.SheetNames[0]}" — ${rows.length} data rows\n`);

  const companies = new Map<string, MappedCompany>();
  const contacts: MappedContact[] = [];

  let skippedNoName = 0;
  let missingEmail = 0;
  let missingCompany = 0;

  for (const r of rows) {
    const firstName = normText(r["First Name"]);
    const lastName = normText(r["Last Name"]);
    const email = normEmail(r["Email"]);
    const companyName = normText(r["Client Company"]);
    const type = normText(r["Type"]);
    const phone = normPhone(r["Phone"]);
    const cell = normPhone(r["Cell Phone"]);
    const custom = normText(r["Custom Field"]);

    // Skip rows with no identifiable person
    if (!firstName && !lastName) {
      skippedNoName++;
      continue;
    }
    if (!email) missingEmail++;
    if (!companyName) missingCompany++;

    const cKey = companyKey(companyName);

    if (companyName) {
      const existing = companies.get(cKey);
      if (existing) {
        existing.contactCount++;
        if (!existing.phone && phone) existing.phone = phone;
      } else {
        companies.set(cKey, {
          name: companyName,
          phone: phone,
          leadSource: LEAD_SOURCE,
          importBatchId: IMPORT_BATCH_ID,
          contactCount: 1,
        });
      }
    }

    const tags = [PRE_PARTNERSHIP_TAG];
    if (type) tags.push(type);

    contacts.push({
      firstName: firstName ?? "",
      lastName: lastName ?? "",
      email,
      phone: cell ?? phone, // prefer cell, fall back to office phone
      tags,
      notes: custom,
      companyKey: cKey,
    });
  }

  // ---- Report ----
  console.log("-".repeat(70));
  console.log("MAPPING SUMMARY");
  console.log("-".repeat(70));
  console.log(`Total source rows:          ${rows.length}`);
  console.log(`Contacts to create:         ${contacts.length}`);
  console.log(`Distinct companies (deduped): ${companies.size}`);
  console.log(`Rows skipped (no name):     ${skippedNoName}`);
  console.log(`Contacts missing email:     ${missingEmail}`);
  console.log(`Contacts missing company:   ${missingCompany}`);

  // Type breakdown
  const typeCounts = new Map<string, number>();
  for (const c of contacts) {
    const t = c.tags.find((x) => x !== PRE_PARTNERSHIP_TAG) ?? "(no type)";
    typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
  }
  console.log("\nContact 'Type' breakdown:");
  for (const [t, n] of [...typeCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t.padEnd(24)} ${n}`);
  }

  // Tagging applied to every record
  console.log("\nEvery imported record will be tagged:");
  console.log(`  companies.leadSource   = "${LEAD_SOURCE}"`);
  console.log(`  companies.importBatchId = "${IMPORT_BATCH_ID}"  (NEW column)`);
  console.log(`  contacts.tags          += ["${PRE_PARTNERSHIP_TAG}", <Type>]`);
  console.log(`  contacts.importBatchId  = "${IMPORT_BATCH_ID}"  (NEW column)`);

  // ---- 10-row sample ----
  console.log("\n" + "-".repeat(70));
  console.log("SAMPLE — first 10 mapped contacts");
  console.log("-".repeat(70));
  for (const c of contacts.slice(0, 10)) {
    const company = companies.get(c.companyKey);
    console.log(
      `\n  ${c.firstName} ${c.lastName}`.trimEnd() +
        `\n    email:   ${c.email ?? "(none)"}` +
        `\n    phone:   ${c.phone ?? "(none)"}` +
        `\n    company: ${company?.name ?? "(none)"}` +
        `\n    tags:    [${c.tags.join(", ")}]` +
        `\n    notes:   ${c.notes ?? "(none)"}`
    );
  }

  console.log("\n" + "=".repeat(70));
  console.log("DRY-RUN COMPLETE — nothing was written to the database.");
  console.log("Review the mapping above. To proceed, we add the importBatchId");
  console.log("migration + enable --commit in a follow-up (with your approval).");
  console.log("=".repeat(70) + "\n");
}

main();
