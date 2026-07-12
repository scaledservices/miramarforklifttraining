/**
 * Alberto CRM Import — 3 datasets (Clients + FLA Onsite + MFT Onsite)
 *
 * Reads Alberto's 3 xlsx files from LOCAL DISK ONLY and maps them onto the
 * existing companies + contacts + trainingEvents schema.
 *
 * DATASETS:
 *   1. Clients_19092024_0810 v3.xlsx         — 1,376 contact-centric rows
 *   2. MFT - ONSITE LIST - FLA.xlsx           — 246 training-event rows (FLA era 2019-2024)
 *   3. MFT - ONSITE LIST - 2024-25-26.xlsx    — 116 training-event rows (MFT era 2024-2025)
 *
 * SAFETY:
 *   - Default mode is DRY-RUN: reads all files, computes the full mapping,
 *     prints counts + samples, and writes NOTHING to the database.
 *   - Live writes require the explicit `--commit` flag (not implemented yet).
 *
 * Usage:
 *   npx tsx scripts/import-alberto-crm.ts             # dry-run all 3 datasets
 *   npx tsx scripts/import-alberto-crm.ts --dataset 1  # dry-run DS1 only
 *   npx tsx scripts/import-alberto-crm.ts --dataset 2  # dry-run DS2 only
 *   npx tsx scripts/import-alberto-crm.ts --dataset 3  # dry-run DS3 only
 *   npx tsx scripts/import-alberto-crm.ts --file "/path/to.xlsx"  # custom DS1 file
 *
 * See CRM_DATA_ANALYSIS.md for full analysis, schema recommendations, and import strategy.
 */

import XLSX from "xlsx";
import * as fs from "fs";

// ---- Config -----------------------------------------------------------------

const HOME = process.env.HOME || "";
const DS1_FILE = HOME + "/Downloads/Clients_19092024_0810 v3.xlsx";
const DS2_FILE = HOME + "/Downloads/MFT - ONSITE LIST - FLA.xlsx";
const DS3_FILE = HOME + "/Downloads/MFT - ONSITE LIST - 2024-25-26.xlsx";

const IMPORT_BATCH_ID = "alberto_crm_2026-07-12";
const LEAD_SOURCE_DS1 = "alberto_pre_partnership";
const LEAD_SOURCE_DS2 = "alberto_fla_era";
const LEAD_SOURCE_DS3 = "alberto_mft_era";
const PRE_PARTNERSHIP_TAG = "pre-partnership";

// ---- CLI args ---------------------------------------------------------------

const args = process.argv.slice(2);
const COMMIT = args.includes("--commit");
const datasetArgIdx = args.indexOf("--dataset");
const DATASET_FILTER = datasetArgIdx >= 0 ? args[datasetArgIdx + 1] : null;
const fileArgIdx = args.indexOf("--file");
const CUSTOM_DS1_FILE = fileArgIdx >= 0 ? args[fileArgIdx + 1] : null;

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
  let colBase = -1;
  for (let i = 0; i < aoa.length; i++) {
    const row = aoa[i] || [];
    const fnCol = row.findIndex((c) => c && String(c).trim() === "First Name");
    if (fnCol >= 0) {
      headerIdx = i;
      colBase = fnCol;
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

  for (const r of rows) {
    const firstName = normText(r[colBase]);
    const lastName = normText(r[colBase + 1]);
    const email = normEmail(r[colBase + 2]);
    const companyName = normText(r[colBase + 3]);
    const type = normText(r[colBase + 4]);
    const phone = normPhone(r[colBase + 5]);
    const cell = normPhone(r[colBase + 6]);
    const custom = normText(r[colBase + 7]);

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
          email: null,
          billingStreet: null,
          billingCity: null,
          billingState: null,
          billingZip: null,
          leadSource: LEAD_SOURCE_DS1,
          importBatchId: IMPORT_BATCH_ID,
          sourceEra: "pre_partnership",
          notes: "[Imported from Alberto CRM - Clients dataset]",
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
      phone: cell ?? phone,
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
          notes: `[Imported from Alberto CRM - ${sourceEra}]`,
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
      adminNotes: `[Imported from Alberto DS${sourceDataset} | ERA: ${sourceEra} | EMP CODE: ${rawCode ?? "N/A"}]`,
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

// ---- Report Helpers ---------------------------------------------------------

function printDataset1Stats(
  companies: Map<string, MappedCompany>,
  contacts: MappedContact[],
  stats: Record<string, number>
): void {
  console.log("\n" + "-".repeat(70));
  console.log("DATASET 1: Clients (Contact-Centric)");
  console.log("-".repeat(70));
  console.log(`  Source file:         ${CUSTOM_DS1_FILE ?? DS1_FILE}`);
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

function main() {
  console.log("=".repeat(70));
  console.log("Alberto CRM Import —", COMMIT ? "COMMIT MODE" : "DRY-RUN (no DB writes)");
  console.log("=".repeat(70));

  if (COMMIT) {
    console.error(
      "\n[ABORT] --commit is not enabled. Dry-run only until Peter approves the mapping.\n"
    );
    process.exit(2);
  }

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
    const ds1File = CUSTOM_DS1_FILE ?? DS1_FILE;
    if (!fs.existsSync(ds1File)) {
      console.error(`\n[ERROR] DS1 file not found: ${ds1File}\n`);
      process.exit(1);
    }
    console.log(`\nReading DS1: ${ds1File}`);
    ds1Result = readDataset1(ds1File);
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
  console.log("DRY-RUN COMPLETE — nothing was written to the database.");
  console.log("Review the mapping above. See CRM_DATA_ANALYSIS.md for full analysis.");
  console.log("To proceed, add importBatchId migration + enable --commit (with Peter's approval).");
  console.log("=".repeat(70) + "\n");
}

main();
