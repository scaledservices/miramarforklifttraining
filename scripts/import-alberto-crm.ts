/**
 * Legacy customer list import (Alberto's customer lists).
 *
 * Loads Miramar's existing customers into companies + contacts + trainingEvents
 * so the site can tell NEW customers from EXISTING ones (see
 * server/customerClassification.ts). Imported rows are reference data only,
 * never the system of record. Labels are neutral ("legacy-customer"): nothing
 * here may describe any commission arrangement.
 *
 * DATASETS (local files only):
 *   1. Clients exports (contact-centric). Several files are merged by email,
 *      first file wins, so pass the newest first. Columns are mapped by header.
 *   2. MFT - ONSITE LIST - FLA.xlsx       (onsite training rows, FLA era)
 *   3. MFT - ONSITE LIST - 2024-25-26.xlsx (onsite training rows, MFT era)
 *
 * SAFETY:
 *   - Default is DRY-RUN: reads, maps and reports, writes nothing.
 *   - --commit writes inside ONE transaction: it first removes rows from this
 *     script's own import batches (and nothing else), then inserts. Any error
 *     rolls everything back.
 *
 * Usage:
 *   npx tsx scripts/import-alberto-crm.ts \
 *     --clients "~/Downloads/Clients_29102026_0829.xlsx,~/Downloads/Clients_19092024_0810 v3.xlsx" \
 *     --fla "~/Downloads/MFT - ONSITE LIST - FLA (2).xlsx" \
 *     --mft "~/Downloads/MFT - ONSITE LIST - 2024-25-26.xlsx" [--commit]
 *   --dataset 1|2|3 limits the run to one dataset.
 */

import XLSX from "xlsx";
import * as fs from "fs";
import { db, pool } from "../server/db";
import { companies, contacts, trainingEvents } from "../shared/schema";
import { inArray } from "drizzle-orm";

// ---- Config -----------------------------------------------------------------

const HOME = process.env.HOME || "";
const expandHome = (f: string) => f.trim().replace(/^~(?=\/)/, HOME);
const argVal = (name: string): string | null => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] ?? null : null;
};

const DS1_FILES = (argVal("--clients") ?? argVal("--file") ?? HOME + "/Downloads/Clients_19092024_0810 v3.xlsx")
  .split(",").map(expandHome).filter(Boolean);
const DS2_FILE = expandHome(argVal("--fla") ?? HOME + "/Downloads/MFT - ONSITE LIST - FLA.xlsx");
const DS3_FILE = expandHome(argVal("--mft") ?? HOME + "/Downloads/MFT - ONSITE LIST - 2024-25-26.xlsx");

const IMPORT_BATCH_ID = "legacy_customers_2026-11";
// Earlier batch ids written by this script; --commit replaces them too.
const PRIOR_BATCH_IDS = ["alberto_crm_2026-07-12"];
const LEAD_SOURCE_DS1 = "legacy_customer_list";
const LEAD_SOURCE_DS2 = "legacy_onsite_fla";
const LEAD_SOURCE_DS3 = "legacy_onsite_mft";
const PRE_PARTNERSHIP_TAG = "legacy-customer";

// ---- CLI args ---------------------------------------------------------------

const args = process.argv.slice(2);
const COMMIT = args.includes("--commit");
const datasetArgIdx = args.indexOf("--dataset");
const DATASET_FILTER = datasetArgIdx >= 0 ? args[datasetArgIdx + 1] : null;

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
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[.,&]/g, "")
    .replace(/\b(inc|llc|corp|corporation|ltd|co|the)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Convert Excel serial date number to JS Date */
function excelDateToDate(serial: number): Date | null {
  if (!serial || isNaN(serial)) return null;
  const excelEpoch = new Date(1899, 11, 30);
  return new Date(excelEpoch.getTime() + serial * 86400000);
}

/** Parse CITY field "City, State ZIP" into components */
function parseCityField(raw: string | null): {
  city: string | null;
  state: string | null;
  zip: string | null;
} {
  if (!raw) return { city: null, state: null, zip: null };
  const m = raw.match(/^(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
  if (m) return { city: m[1].trim(), state: m[2].trim(), zip: m[3].trim() };
  // Try without ZIP
  const m2 = raw.match(/^(.+?),\s*([A-Z]{2})\s*$/);
  if (m2) return { city: m2[1].trim(), state: m2[2].trim(), zip: null };
  // Truncated ZIP (e.g. "San Diego, CA 9211")
  const m3 = raw.match(/^(.+?),\s*([A-Z]{2})\s+(\d{3,4})$/);
  if (m3) return { city: m3[1].trim(), state: m3[2].trim(), zip: m3[3] };
  return { city: raw, state: null, zip: null };
}

/** Decode EMPLOYEES code like "F5P + S3P" into count + equipment types */
function decodeEmployeesCode(code: string | null): {
  traineeCount: number;
  equipmentTypes: string[];
  rawCode: string | null;
} {
  if (!code) return { traineeCount: 0, equipmentTypes: [], rawCode: null };
  const segments = code.toUpperCase().split(" + ");
  let total = 0;
  const equipment = new Set<string>();
  for (const seg of segments) {
    const m = seg.match(/^(FTT|STT|F|S)(\d+)P?$/);
    if (m) {
      const type = m[1];
      const count = parseInt(m[2], 10);
      total += count;
      if (type === "F" || type === "FTT") equipment.add("forklift");
      if (type === "S" || type === "STT") equipment.add("scissor_lift");
      if (type === "FTT") equipment.add("forklift_train_the_trainer");
      if (type === "STT") equipment.add("scissor_lift_train_the_trainer");
    }
  }
  return { traineeCount: total, equipmentTypes: [...equipment], rawCode: code };
}

/** Split CONTACT PERSON on "/" and return array of name parts */
function splitContactPerson(raw: string | null): { firstName: string; lastName: string }[] {
  if (!raw) return [];
  const parts = raw.split("/").map((s) => s.trim()).filter(Boolean);
  return parts.map((p) => {
    const tokens = p.split(/\s+/);
    if (tokens.length === 1) return { firstName: tokens[0], lastName: "" };
    return { firstName: tokens[0], lastName: tokens.slice(1).join(" ") };
  });
}

// ---- Types ------------------------------------------------------------------

interface MappedContact {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  tags: string[];
  notes: string | null;
  isPrimary: boolean;
  companyKey: string;
  sourceDataset: number;
}

interface MappedCompany {
  name: string;
  phone: string | null;
  email: string | null;
  billingStreet: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingZip: string | null;
  leadSource: string;
  importBatchId: string;
  sourceEra: string;
  notes: string | null;
  contactCount: number;
}

interface MappedTrainingEvent {
  companyKey: string;
  contactEmail: string | null;
  title: string;
  status: string;
  locationType: string;
  onsiteStreet: string | null;
  onsiteCity: string | null;
  onsiteState: string | null;
  onsiteZip: string | null;
  scheduledStart: Date | null;
  traineeCount: number;
  equipmentTypes: string[];
  revenue: number | null;
  rawEmployeesCode: string | null;
  sourceEra: string;
  sourceDataset: number;
  comments: string | null;
  adminNotes: string;
}

// ---- Dataset Readers --------------------------------------------------------

function readDataset1(filePath: string): {
  companies: Map<string, MappedCompany>;
  contacts: MappedContact[];
  stats: Record<string, number>;
} {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });

  let headerIdx = -1;
  for (let i = 0; i < aoa.length; i++) {
    const row = aoa[i] || [];
    if (row.some((c) => c && String(c).trim() === "First Name")) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) {
    console.error("\n[ERROR] Could not locate 'First Name' header row in DS1.\n");
    process.exit(1);
  }

  const rows = aoa.slice(headerIdx + 1).filter((r) =>
    r.some((c) => c !== null && c !== undefined && String(c).trim() !== "")
  );

  const companies = new Map<string, MappedCompany>();
  const contacts: MappedContact[] = [];
  let skippedNoName = 0;
  let missingEmail = 0;
  let missingCompany = 0;

  // Columns are located by header text: Alberto's exports have moved columns
  // between versions (Nov 2026 added Referred By / Store Credit / Client due).
  const header = (aoa[headerIdx] as unknown[]).map((c) => (c === null || c === undefined ? "" : String(c).trim()));
  const col = (name: string) => header.indexOf(name);
  const C = {
    first: col("First Name"), last: col("Last Name"), email: col("Email"), company: col("Client Company"),
    type: col("Type"), phone: col("Phone"), cell: col("Cell Phone"), custom: col("Custom Field"),
  };
  for (const [k, v] of Object.entries(C)) {
    if (v < 0 && k !== "custom") {
      console.error(`\n[ERROR] DS1 column not found: ${k} in ${filePath}\n`);
      process.exit(1);
    }
  }
  const cell = (r: unknown[], i: number) => (i >= 0 ? r[i] : null);

  for (const r of rows) {
    const firstName = normText(cell(r, C.first));
    const lastName = normText(cell(r, C.last));
    const email = normEmail(cell(r, C.email));
    const companyName = normText(cell(r, C.company));
    const type = normText(cell(r, C.type));
    const phone = normPhone(cell(r, C.phone));
    const cellPhone = normPhone(cell(r, C.cell));
    const custom = normText(cell(r, C.custom));

    // Keep email-only rows: the email is what new/existing matching needs.
    if (!firstName && !lastName && !email) {
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
          email: null,
          billingStreet: null,
          billingCity: null,
          billingState: null,
          billingZip: null,
          leadSource: LEAD_SOURCE_DS1,
          importBatchId: IMPORT_BATCH_ID,
          sourceEra: "legacy_clients",
          notes: "[Imported from the customer list]",
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
      phone: cellPhone ?? phone,
      tags,
      notes: custom,
      isPrimary: true,
      companyKey: cKey,
      sourceDataset: 1,
    });
  }

  return {
    companies,
    contacts,
    stats: {
      totalRows: rows.length,
      skippedNoName,
      missingEmail,
      missingCompany,
      contactsCreated: contacts.length,
      companiesCreated: companies.size,
    },
  };
}

function readOnsiteDataset(
  filePath: string,
  sourceDataset: number,
  leadSource: string,
  sourceEra: string
): {
  companies: Map<string, MappedCompany>;
  contacts: MappedContact[];
  events: MappedTrainingEvent[];
  stats: Record<string, number>;
} {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });

  let headerIdx = -1;
  for (let i = 0; i < aoa.length; i++) {
    const row = aoa[i] || [];
    if (row.some((c) => c && String(c).trim() === "COMPANY")) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) {
    console.error(`\n[ERROR] Could not locate 'COMPANY' header row in ${filePath}.\n`);
    process.exit(1);
  }

  const headerRow = aoa[headerIdx] as unknown[];
  const findCol = (name: string) =>
    headerRow.findIndex((c) => c && String(c).trim() === name);

  const dateCol = findCol("DATE");
  const compCol = findCol("COMPANY");
  const empCol = findCol("EMPLOYEES");
  const dollarCol = findCol("$");
  const contactCol = findCol("CONTACT PERSON");
  const cityCol = findCol("CITY");
  const emailCol = findCol("EMAIL");
  const phoneCol = findCol("PHONE");
  const mobileCol = findCol("MOBILE");
  const addrCol = findCol("ADDRESS");
  const commentCol = findCol("COMMENTS");

  const rows = aoa.slice(headerIdx + 1).filter((r) =>
    r.some((c) => c !== null && c !== undefined && String(c).trim() !== "")
  );

  const companies = new Map<string, MappedCompany>();
  const contacts: MappedContact[] = [];
  const events: MappedTrainingEvent[] = [];
  let missingEmail = 0;
  let missingPhone = 0;
  let missingContact = 0;
  let missingRevenue = 0;

  for (const r of rows) {
    const dateRaw = r[dateCol];
    const companyName = normText(r[compCol]);
    const empCode = normText(r[empCol]);
    const revenue = r[dollarCol] !== null && r[dollarCol] !== undefined
      ? Number(r[dollarCol])
      : null;
    const contactRaw = normText(r[contactCol]);
    const cityRaw = normText(r[cityCol]);
    const email = normEmail(r[emailCol]);
    const phone = normPhone(r[phoneCol]);
    const mobile = normPhone(r[mobileCol]);
    const address = normText(r[addrCol]);
    const comments = normText(r[commentCol]);

    if (!email) missingEmail++;
    if (!phone) missingPhone++;
    if (!contactRaw) missingContact++;
    if (revenue === null || isNaN(revenue)) missingRevenue++;

    const cKey = companyKey(companyName);
    const { city, state, zip } = parseCityField(cityRaw);
    const { traineeCount, equipmentTypes, rawCode } = decodeEmployeesCode(empCode);

    // Create/find company
    if (companyName) {
      const existing = companies.get(cKey);
      if (!existing) {
        companies.set(cKey, {
          name: companyName,
          phone: phone ?? mobile,
          email,
          billingStreet: address,
          billingCity: city,
          billingState: state,
          billingZip: zip,
          leadSource,
          importBatchId: IMPORT_BATCH_ID,
          sourceEra,
          notes: `[Imported from the onsite training list - ${sourceEra}]`,
          contactCount: 0,
        });
      } else {
        if (!existing.phone && phone) existing.phone = phone;
        if (!existing.email && email) existing.email = email;
        if (!existing.billingStreet && address) existing.billingStreet = address;
        if (!existing.billingCity && city) existing.billingCity = city;
        if (!existing.billingState && state) existing.billingState = state;
        if (!existing.billingZip && zip) existing.billingZip = zip;
      }
    }

    // Create contacts (split on "/")
    const contactPersons = splitContactPerson(contactRaw);
    if (contactPersons.length === 0 && email) {
      // No contact name but we have email - create a placeholder
      contactPersons.push({ firstName: "", lastName: "" });
    }
    for (let i = 0; i < contactPersons.length; i++) {
      contacts.push({
        firstName: contactPersons[i].firstName,
        lastName: contactPersons[i].lastName,
        email: i === 0 ? email : null,
        phone: i === 0 ? (mobile ?? phone) : null,
        tags: [PRE_PARTNERSHIP_TAG, "onsite-training"],
        notes: comments,
        isPrimary: i === 0,
        companyKey: cKey,
        sourceDataset,
      });
    }

    // Create training event
    const hasRevenue = revenue !== null && !isNaN(revenue);
    const eventStatus = hasRevenue && contactRaw ? "completed" : "unscheduled";
    const dateObj = dateRaw !== null && dateRaw !== undefined
      ? excelDateToDate(Number(dateRaw))
      : null;

    events.push({
      companyKey: cKey,
      contactEmail: email,
      title: `Onsite Training - ${companyName ?? "Unknown"}`,
      status: eventStatus,
      locationType: "customer_onsite",
      onsiteStreet: address,
      onsiteCity: city,
      onsiteState: state,
      onsiteZip: zip,
      scheduledStart: dateObj,
      traineeCount,
      equipmentTypes,
      revenue: hasRevenue ? revenue : null,
      rawEmployeesCode: rawCode,
      sourceEra,
      sourceDataset,
      comments,
      adminNotes: `[Imported onsite training history | ${sourceEra} | EMP CODE: ${rawCode ?? "N/A"}]`,
    });
  }

  // Update company contact counts
  for (const [key, comp] of companies) {
    comp.contactCount = contacts.filter((c) => c.companyKey === key).length;
  }

  return {
    companies,
    contacts,
    events,
    stats: {
      totalRows: rows.length,
      missingEmail,
      missingPhone,
      missingContact,
      missingRevenue,
      contactsCreated: contacts.length,
      companiesCreated: companies.size,
      eventsCreated: events.length,
    },
  };
}

// ---- Cross-Dataset Merge ----------------------------------------------------

function mergeCompanies(
  ...maps: Map<string, MappedCompany>[]
): Map<string, MappedCompany> {
  const merged = new Map<string, MappedCompany>();
  for (const map of maps) {
    for (const [key, comp] of map) {
      const existing = merged.get(key);
      if (existing) {
        existing.contactCount += comp.contactCount;
        if (!existing.phone && comp.phone) existing.phone = comp.phone;
        if (!existing.email && comp.email) existing.email = comp.email;
        if (!existing.billingStreet && comp.billingStreet)
          existing.billingStreet = comp.billingStreet;
        if (!existing.billingCity && comp.billingCity)
          existing.billingCity = comp.billingCity;
        if (!existing.billingState && comp.billingState)
          existing.billingState = comp.billingState;
        if (!existing.billingZip && comp.billingZip)
          existing.billingZip = comp.billingZip;
      } else {
        merged.set(key, { ...comp });
      }
    }
  }
  return merged;
}

// ---- Commit: DB write path --------------------------------------------------
// Idempotent via importBatchId: re-running wipes this batch's rows and
// re-imports, so a partial/failed run can be safely retried. Imported data is
// reference/attribution only (per Tally gate) - never the system of record.

interface CommitResult {
  companiesInserted: number;
  contactsInserted: number;
  eventsInserted: number;
}

type Tx = any; // drizzle transaction handle (same API as db)

async function wipeBatch(tx: Tx): Promise<void> {
  const ids = [IMPORT_BATCH_ID, ...PRIOR_BATCH_IDS];
  await tx.delete(trainingEvents).where(inArray(trainingEvents.importBatchId, ids));
  await tx.delete(contacts).where(inArray(contacts.importBatchId, ids));
  await tx.delete(companies).where(inArray(companies.importBatchId, ids));
}

/** Merge several Clients exports: first file wins per email; email-less rows dedupe by company+name. */
function mergeDataset1(results: ReturnType<typeof readDataset1>[]): ReturnType<typeof readDataset1> {
  const companiesMerged = mergeCompanies(...results.map((r) => r.companies));
  const seen = new Set<string>();
  const merged: MappedContact[] = [];
  let dupes = 0;
  for (const r of results) {
    for (const c of r.contacts) {
      const key = c.email ?? `${c.companyKey}|${c.firstName}|${c.lastName}`.toLowerCase();
      if (seen.has(key)) { dupes++; continue; }
      seen.add(key);
      merged.push(c);
    }
  }
  const stats: Record<string, number> = {
    filesMerged: results.length,
    totalRows: results.reduce((n, r) => n + (r.stats.totalRows ?? 0), 0),
    duplicateContactsAcrossFiles: dupes,
    contactsCreated: merged.length,
    companiesCreated: companiesMerged.size,
    missingEmail: merged.filter((c) => !c.email).length,
  };
  return { companies: companiesMerged, contacts: merged, stats };
}

async function writeDataset(
  tx: Tx,
  companiesMap: Map<string, MappedCompany>,
  contactsList: MappedContact[],
  eventsList: MappedTrainingEvent[],
  companyIdByKey: Map<string, number>,
  contactIdByEmail: Map<string, number>,
  contactSeen: Set<string>
): Promise<CommitResult> {
  const result: CommitResult = { companiesInserted: 0, contactsInserted: 0, eventsInserted: 0 };

  // Companies: insert only keys not already created by an earlier dataset.
  for (const [key, comp] of companiesMap) {
    if (companyIdByKey.has(key)) continue;
    const [row] = await tx.insert(companies).values({
      name: comp.name,
      phone: comp.phone,
      email: comp.email,
      billingStreet: comp.billingStreet,
      billingCity: comp.billingCity,
      billingState: comp.billingState,
      billingZip: comp.billingZip,
      leadSource: comp.leadSource,
      importBatchId: IMPORT_BATCH_ID,
      sourceEra: comp.sourceEra,
      notes: comp.notes,
    }).returning({ id: companies.id });
    companyIdByKey.set(key, row.id);
    result.companiesInserted++;
  }

  // Contacts: link to their company; track email -> id for event linkage.
  for (const c of contactsList) {
    // One contact per person across datasets: the onsite lists repeat the
    // same contact on every training row.
    const dedupeKey = c.email ?? `${c.companyKey}|${c.firstName}|${c.lastName}`.toLowerCase();
    if (contactSeen.has(dedupeKey)) continue;
    contactSeen.add(dedupeKey);
    if (!c.email && !c.firstName && !c.lastName) continue;
    const companyId = companyIdByKey.get(c.companyKey) ?? null;
    const [row] = await tx.insert(contacts).values({
      companyId,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      tags: c.tags,
      notes: c.notes,
      isPrimary: c.isPrimary,
      importBatchId: IMPORT_BATCH_ID,
    }).returning({ id: contacts.id });
    if (c.email && !contactIdByEmail.has(c.email)) contactIdByEmail.set(c.email, row.id);
    result.contactsInserted++;
  }

  // Training events: revenue is dollars in the mapper -> integer cents column.
  for (const e of eventsList) {
    const companyId = companyIdByKey.get(e.companyKey) ?? null;
    const primaryContactId = e.contactEmail ? (contactIdByEmail.get(e.contactEmail) ?? null) : null;
    await tx.insert(trainingEvents).values({
      companyId,
      primaryContactId,
      title: e.title,
      status: e.status as any,
      locationType: e.locationType as any,
      onsiteStreet: e.onsiteStreet,
      onsiteCity: e.onsiteCity,
      onsiteState: e.onsiteState,
      onsiteZip: e.onsiteZip,
      scheduledStart: e.scheduledStart,
      traineeCount: e.traineeCount,
      equipmentTypes: e.equipmentTypes,
      revenue: e.revenue !== null ? Math.round(e.revenue * 100) : null,
      rawEmployeesCode: e.rawEmployeesCode,
      sourceEra: e.sourceEra,
      adminNotes: e.adminNotes,
      importBatchId: IMPORT_BATCH_ID,
    });
    result.eventsInserted++;
  }

  return result;
}

// ---- Report Helpers ---------------------------------------------------------

function printDataset1Stats(
  companies: Map<string, MappedCompany>,
  contacts: MappedContact[],
  stats: Record<string, number>
): void {
  console.log("\n" + "-".repeat(70));
  console.log("DATASET 1: Clients (Contact-Centric)");
  console.log("-".repeat(70));
  console.log(`  Source files:        ${DS1_FILES.join(" + ")}`);
  console.log(`  Total source rows:   ${stats.totalRows}`);
  console.log(`  Contacts mapped:     ${stats.contactsCreated}`);
  console.log(`  Companies (deduped): ${stats.companiesCreated}`);
  console.log(`  Skipped (no name):   ${stats.skippedNoName}`);
  console.log(`  Missing email:       ${stats.missingEmail}`);
  console.log(`  Missing company:     ${stats.missingCompany}`);

  // Type breakdown
  const typeCounts = new Map<string, number>();
  for (const c of contacts) {
    const t = c.tags.find((x) => x !== PRE_PARTNERSHIP_TAG) ?? "(no type)";
    typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
  }
  console.log("\n  Type breakdown:");
  for (const [t, n] of Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${t.padEnd(24)} ${n}`);
  }

  // Sample
  console.log("\n  Sample — first 5 contacts:");
  for (const c of contacts.slice(0, 5)) {
    const company = companies.get(c.companyKey);
    console.log(
      `    ${c.firstName} ${c.lastName}`.trimEnd() +
        ` | email: ${c.email ?? "(none)"}` +
        ` | company: ${company?.name ?? "(none)"}` +
        ` | tags: [${c.tags.join(", ")}]`
    );
  }
}

function printOnsiteStats(
  label: string,
  companies: Map<string, MappedCompany>,
  contacts: MappedContact[],
  events: MappedTrainingEvent[],
  stats: Record<string, number>
): void {
  console.log("\n" + "-".repeat(70));
  console.log(`${label}`);
  console.log("-".repeat(70));
  console.log(`  Total source rows:   ${stats.totalRows}`);
  console.log(`  Training events:     ${stats.eventsCreated}`);
  console.log(`  Contacts mapped:     ${stats.contactsCreated}`);
  console.log(`  Companies (deduped): ${stats.companiesCreated}`);
  console.log(`  Missing email:       ${stats.missingEmail}`);
  console.log(`  Missing phone:       ${stats.missingPhone}`);
  console.log(`  Missing contact:     ${stats.missingContact}`);
  console.log(`  Missing revenue:     ${stats.missingRevenue}`);

  const completed = events.filter((e) => e.status === "completed").length;
  const unscheduled = events.filter((e) => e.status === "unscheduled").length;
  console.log(`  Events (completed):  ${completed}`);
  console.log(`  Events (unscheduled):${unscheduled}`);

  // Revenue stats
  const revs = events.filter((e) => e.revenue !== null).map((e) => e.revenue!);
  if (revs.length > 0) {
    const min = Math.min(...revs);
    const max = Math.max(...revs);
    const avg = Math.round(revs.reduce((a, b) => a + b, 0) / revs.length);
    console.log(`  Revenue range:       $${min} - $${max} (avg $${avg})`);
  }

  // Sample events
  console.log("\n  Sample — first 5 events:");
  for (const e of events.slice(0, 5)) {
    const comp = companies.get(e.companyKey);
    console.log(
      `    ${e.scheduledStart?.toISOString().split("T")[0] ?? "????"}` +
        ` | ${comp?.name ?? "Unknown"}` +
        ` | ${e.rawEmployeesCode ?? "N/A"}` +
        ` | $${e.revenue ?? "N/A"}` +
        ` | ${e.status}`
    );
  }
}

// ---- Main -------------------------------------------------------------------

async function main() {
  console.log("=".repeat(70));
  console.log("Alberto CRM Import —", COMMIT ? "COMMIT MODE" : "DRY-RUN (no DB writes)");
  console.log("=".repeat(70));

  console.log(`\nImport batch ID: ${IMPORT_BATCH_ID}`);
  console.log(`Dataset filter:  ${DATASET_FILTER ?? "ALL (1+2+3)"}`);

  const runDS1 = !DATASET_FILTER || DATASET_FILTER === "1";
  const runDS2 = !DATASET_FILTER || DATASET_FILTER === "2";
  const runDS3 = !DATASET_FILTER || DATASET_FILTER === "3";

  let ds1Result: ReturnType<typeof readDataset1> | null = null;
  let ds2Result: ReturnType<typeof readOnsiteDataset> | null = null;
  let ds3Result: ReturnType<typeof readOnsiteDataset> | null = null;

  // ---- DS1 ----
  if (runDS1) {
    const parts: ReturnType<typeof readDataset1>[] = [];
    for (const f of DS1_FILES) {
      if (!fs.existsSync(f)) {
        console.error(`\n[ERROR] DS1 file not found: ${f}\n`);
        process.exit(1);
      }
      console.log(`\nReading DS1: ${f}`);
      const r = readDataset1(f);
      console.log(`  rows ${r.stats.totalRows}, contacts ${r.contacts.length}, companies ${r.companies.size}`);
      parts.push(r);
    }
    ds1Result = parts.length === 1 ? parts[0] : mergeDataset1(parts);
    printDataset1Stats(ds1Result.companies, ds1Result.contacts, ds1Result.stats);
  }

  // ---- DS2 ----
  if (runDS2) {
    if (!fs.existsSync(DS2_FILE)) {
      console.error(`\n[ERROR] DS2 file not found: ${DS2_FILE}\n`);
      process.exit(1);
    }
    console.log(`\nReading DS2: ${DS2_FILE}`);
    ds2Result = readOnsiteDataset(DS2_FILE, 2, LEAD_SOURCE_DS2, "fla_era");
    printOnsiteStats(
      "DATASET 2: FLA Onsite List (FLA era 2019-2024)",
      ds2Result.companies,
      ds2Result.contacts,
      ds2Result.events,
      ds2Result.stats
    );
  }

  // ---- DS3 ----
  if (runDS3) {
    if (!fs.existsSync(DS3_FILE)) {
      console.error(`\n[ERROR] DS3 file not found: ${DS3_FILE}\n`);
      process.exit(1);
    }
    console.log(`\nReading DS3: ${DS3_FILE}`);
    ds3Result = readOnsiteDataset(DS3_FILE, 3, LEAD_SOURCE_DS3, "mft_era");
    printOnsiteStats(
      "DATASET 3: MFT Onsite List (MFT era 2024-2025)",
      ds3Result.companies,
      ds3Result.contacts,
      ds3Result.events,
      ds3Result.stats
    );
  }

  // ---- Guard: customers the SITE brought in stay new customers ----
  // A later export of Alberto's old system can include people who first bought
  // on the new site. Importing them would flip them to "existing" and stop the
  // new-customer split. Drop any email that already has a paid order on the
  // site and was not on a previous import of this list.
  {
    const siteBuyers = await pool.query(
      `select distinct lower(u.email) email from orders o join users u on u.id = o.user_id
        where o.status = 'paid' and u.email is not null`
    ).catch(() => ({ rows: [] as { email: string }[] }));
    const prior = await pool.query(
      `select distinct lower(email) email from contacts where import_batch_id is not null and email is not null`
    ).catch(() => ({ rows: [] as { email: string }[] }));
    const priorSet = new Set(prior.rows.map((r: { email: string }) => r.email));
    const protectedEmails = new Set(
      siteBuyers.rows.map((r: { email: string }) => r.email).filter((e: string) => !priorSet.has(e))
    );
    const dropped: string[] = [];
    for (const res of [ds1Result, ds2Result, ds3Result]) {
      if (!res) continue;
      res.contacts = res.contacts.filter((c) => {
        if (c.email && protectedEmails.has(c.email)) { dropped.push(c.email); return false; }
        return true;
      });
      for (const comp of res.companies.values()) {
        if (comp.email && protectedEmails.has(comp.email)) { dropped.push(comp.email); comp.email = null; }
      }
    }
    console.log(`\n  Site-customer guard: ${protectedEmails.size} site buyers checked, ${new Set(dropped).size} kept OFF the legacy list${dropped.length ? ": " + [...new Set(dropped)].join(", ") : ""}`);
  }

  // ---- Cross-dataset summary ----
  console.log("\n" + "=".repeat(70));
  console.log("CROSS-DATASET SUMMARY");
  console.log("=".repeat(70));

  const allCompanyMaps: Map<string, MappedCompany>[] = [];
  if (ds1Result) allCompanyMaps.push(ds1Result.companies);
  if (ds2Result) allCompanyMaps.push(ds2Result.companies);
  if (ds3Result) allCompanyMaps.push(ds3Result.companies);

  if (allCompanyMaps.length > 0) {
    const merged = mergeCompanies(...allCompanyMaps);
    console.log(`  Total companies (merged): ${merged.size}`);

    if (ds1Result && ds2Result) {
      let overlap12 = 0;
      for (const key of ds1Result.companies.keys()) {
        if (ds2Result.companies.has(key)) overlap12++;
      }
      console.log(`  DS1 ∩ DS2 companies:     ${overlap12}`);
    }
    if (ds1Result && ds3Result) {
      let overlap13 = 0;
      for (const key of ds1Result.companies.keys()) {
        if (ds3Result.companies.has(key)) overlap13++;
      }
      console.log(`  DS1 ∩ DS3 companies:     ${overlap13}`);
    }
    if (ds2Result && ds3Result) {
      let overlap23 = 0;
      for (const key of ds2Result.companies.keys()) {
        if (ds3Result.companies.has(key)) overlap23++;
      }
      console.log(`  DS2 ∩ DS3 companies:     ${overlap23}`);
    }
  }

  const totalContacts =
    (ds1Result?.contacts.length ?? 0) +
    (ds2Result?.contacts.length ?? 0) +
    (ds3Result?.contacts.length ?? 0);
  const totalEvents =
    (ds2Result?.events.length ?? 0) + (ds3Result?.events.length ?? 0);

  console.log(`  Total contacts (all DS):  ${totalContacts}`);
  console.log(`  Total training events:     ${totalEvents}`);

  console.log("\n  Labeling applied:");
  console.log(`    companies.leadSource:   "${LEAD_SOURCE_DS1}" (DS1), "${LEAD_SOURCE_DS2}" (DS2), "${LEAD_SOURCE_DS3}" (DS3)`);
  console.log(`    companies.importBatchId: "${IMPORT_BATCH_ID}"  (NEW column)`);
  console.log(`    contacts.tags:          += ["${PRE_PARTNERSHIP_TAG}", <type>]`);
  console.log(`    trainingEvents.status:  "completed" (has revenue+contact) | "unscheduled" (missing data)`);

  console.log("\n" + "=".repeat(70));
  if (!COMMIT) {
    console.log("DRY-RUN COMPLETE — nothing was written to the database.");
    console.log("Review the mapping above. See CRM_DATA_ANALYSIS.md for full analysis.");
    console.log("To proceed, run with --commit (writes to the database).");
    console.log("=".repeat(70) + "\n");
    return;
  }

  // ---- COMMIT: one transaction: wipe this script's batches, write DS1 -> DS2 -> DS3 ----
  console.log("COMMIT MODE — writing to the database in one transaction...");
  console.log("=".repeat(70));
  const totals: CommitResult = { companiesInserted: 0, contactsInserted: 0, eventsInserted: 0 };
  const accumulate = (r: CommitResult) => {
    totals.companiesInserted += r.companiesInserted;
    totals.contactsInserted += r.contactsInserted;
    totals.eventsInserted += r.eventsInserted;
  };

  await db.transaction(async (tx: Tx) => {
    await wipeBatch(tx);
    const companyIdByKey = new Map<string, number>();
    const contactIdByEmail = new Map<string, number>();
    const contactSeen = new Set<string>();
    if (ds1Result) {
      const r = await writeDataset(tx, ds1Result.companies, ds1Result.contacts, [], companyIdByKey, contactIdByEmail, contactSeen);
      accumulate(r);
      console.log(`  DS1 written: ${r.companiesInserted} companies, ${r.contactsInserted} contacts`);
    }
    if (ds2Result) {
      const r = await writeDataset(tx, ds2Result.companies, ds2Result.contacts, ds2Result.events, companyIdByKey, contactIdByEmail, contactSeen);
      accumulate(r);
      console.log(`  DS2 written: ${r.companiesInserted} companies, ${r.contactsInserted} contacts, ${r.eventsInserted} events`);
    }
    if (ds3Result) {
      const r = await writeDataset(tx, ds3Result.companies, ds3Result.contacts, ds3Result.events, companyIdByKey, contactIdByEmail, contactSeen);
      accumulate(r);
      console.log(`  DS3 written: ${r.companiesInserted} companies, ${r.contactsInserted} contacts, ${r.eventsInserted} events`);
    }
  });

  console.log("\n  TOTAL inserted:");
  console.log(`    companies:       ${totals.companiesInserted}`);
  console.log(`    contacts:        ${totals.contactsInserted}`);
  console.log(`    training events: ${totals.eventsInserted}`);
  console.log("=".repeat(70) + "\n");
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error("\n[FATAL] Import failed:", err);
    pool.end().finally(() => process.exit(1));
  });
