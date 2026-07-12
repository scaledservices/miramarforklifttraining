# CRM Data Analysis — Alberto's 3 Datasets

**Prepared by:** Fable 5 (data architecture review)
**Date:** 2026-07-12
**Status:** For Peter's review before any schema changes or imports are approved

---

## Table of Contents
1. [Dataset Summaries](#1-dataset-summaries)
2. [Dataset 1: Clients (Contact-Centric)](#2-dataset-1-clients-contact-centric)
3. [Dataset 2: FLA Onsite List (Training-Event-Centric)](#3-dataset-2-fla-onsite-list-training-event-centric)
4. [Dataset 3: 2024-25-26 Onsite List](#4-dataset-3-2024-25-26-onsite-list)
5. [Cross-Dataset Analysis](#5-cross-dataset-analysis)
6. [EMPLOYEES Code System](#6-employees-code-system)
7. [Revenue Analysis](#7-revenue-analysis)
8. [Schema Gap Analysis](#8-schema-gap-analysis)
9. [Schema Expansion Recommendations](#9-schema-expansion-recommendations)
10. [Import Strategy](#10-import-strategy)
11. [Approval Checklist](#11-approval-checklist)

---

## 1. Dataset Summaries

| Property | Dataset 1 (Clients) | Dataset 2 (FLA) | Dataset 3 (2024-25-26) |
|---|---|---|---|
| **File** | `Clients_19092024_0810 v3.xlsx` | `MFT - ONSITE LIST - FLA.xlsx` | `MFT - ONSITE LIST - 2024-25-26.xlsx` |
| **Received** | Jul 8 | Jul 12 | Jul 12 |
| **Rows** | 1,376 | 246 | 116 |
| **Header row** | Row 6 (0-indexed) | Row 5 (0-indexed) | Row 5 (0-indexed) |
| **Data start** | Row 7 | Row 6 | Row 6 |
| **Era** | Pre-partnership (Alberto era) | FLA era (pre-MFT, 2019-2024) | MFT era (Oct 2024 - Nov 2025) |
| **Focus** | Contact-centric (people) | Training-event-centric | Training-event-centric |
| **Unique companies** | 1,345 | 173 | 51 |
| **Unique emails** | 1,334 | 192 | 52 |

---

## 2. Dataset 1: Clients (Contact-Centric)

### Columns
Position is relative to the "First Name" column (found dynamically):

| # | Column | Type | Notes |
|---|---|---|---|
| 0 | (row index) | integer | Sequential 1..N |
| 1 | First Name | text | Required for import |
| 2 | Last Name | text | Required for import |
| 3 | Email | text | 1,334 have email; 42 missing |
| 4 | Client Company | text | 1,369 have company; 7 missing |
| 5 | Type | text (enum) | See unique values below |
| 6 | Phone | text | "+1 NNN-NNN-NNNN" format; 23 missing |
| 7 | Cell Phone | text | Only 264 have cell phone; 1,112 missing |
| 8 | Custom Field | text | 214 rows have notes; 126 unique values |

### Sheet Legend (rows 0-4)
| Row | Text |
|---|---|
| 0 | New Customer — Mail already sent to customer |
| 1 | Customer answer and it's already set-up (certified) |
| 2 | Mail returned or rejected or failed |
| 3 | NOT Interested |
| 4 | Requested an Estimate or Training already scheduled |

### Unique Type Values
| Type | Count (approx) |
|---|---|
| Customer Regular | ~1,200+ |
| Net 15 customer | ~50 |
| Net 30 customer | ~80 |
| Net 60 customer | ~20 |

### Sample Rows (first 10)
| # | First Name | Last Name | Email | Company | Type | Phone | Cell | Custom Field |
|---|---|---|---|---|---|---|---|---|
| 1 | Justin | Mccabe | justin@117westspirits.com | 117 West Spirits | Customer Regular | +1 619-546-5106 | | |
| 2 | Oscar | Romero | Oscar.Romero@us.af.mil | 147th CBCCS ANG | Customer Regular | +1 203-962-4035 | | |
| 3 | Adam | Asleson | adam@1800bollards.com | 1800 Bollards | Customer Regular | +1 907-744-7961 | | |
| 4 | Joseph | Winsher | joseph.r.winsher.mil@army.mil | 315th EN BN (Army) | Customer Regular | +1 920-318-9397 | | |
| 5 | Erica | a | custom@357golfcarts.com | 357 Golf Carts | Customer Regular | +1 760-683-9667 | | |
| 6 | Marianne | Driscoll | mdriscoll@3dexhibits.com | 3D Exhibits c/o Arthrex 51427 | Customer Regular | +1 630-644-5154 | +1 847-293-5145 | |
| 7 | Steve | Burningham | sb@3pbsolutions.com | 3PB Solutions LLC | Customer Regular | +1 855-785-5660 | +1 858-437-2686 | Already set-up for now |
| 8 | Anthony | Alegrete | anthony@40tons.co | 40 Tons Foundation | Customer Regular | +1 702-703-9709 | | |
| 9 | Jin | Chen | jin.chen1.mil@army.mil | 416th CA BN, S4 | Customer Regular | +1 719-516-6033 | +1 510-364-5496 | |
| 10 | Jerry | Navarro | jerry.navarrojuarez@usmc.mil | 4th Med Bn H&S Co | Customer Regular | +1 619-980-8956 | | |

### Data Quality Issues
- **42 contacts missing email** — these will need special handling (import with null email? skip?)
- **7 contacts missing company name** — can import as unaffiliated contacts
- **1,112 contacts missing cell phone** — only ~19% have cell phones; most have only office phone
- **Phone format**: All use "+1 NNN-NNN-NNNN" format (consistent)
- **"Erica" with last name "a"** — data entry error (row 5); appears to be a truncated last name
- **Custom Field is free-text** with 126 unique values mixing statuses, notes, and action items
- **No addresses, no training dates, no revenue data** — this is a pure contact list

---

## 3. Dataset 2: FLA Onsite List (Training-Event-Centric)

### Columns
Header at row 5 (0-indexed). Column positions:

| # | Column | Type | Notes |
|---|---|---|---|
| 0 | # | integer | Sequential row number |
| 1 | DATE | Excel serial date | Range: 2019-03-26 to 2024-12-27 |
| 2 | COMPANY | text | 173 unique companies |
| 3 | EMPLOYEES | text (code) | e.g. F2P, F3P, F5P — see §6 |
| 4 | $ | number | Revenue; 234 of 246 rows have revenue |
| 5 | CONTACT PERSON | text | May contain multiple names separated by `/` |
| 6 | CITY | text | Format: "City, State ZIP" (e.g. "Camarillo, CA 93012") |
| 7 | EMAIL | text | 192 have email; 5 missing |
| 8 | PHONE | text | Format: "(NNN)NNN-NNNN"; 26 missing |
| 9 | MOBILE | text | Format: "(NNN)NNN-NNNN"; most missing |
| 10 | ADDRESS | text | Full street address |
| 11 | COMMENTS | text | Status notes, additional contacts, actions |

### Sheet Legend (rows 0-3)
| Row | Text | Interpretation |
|---|---|---|
| 0 | Not Interested / No longer exist | Disqualified |
| 1 | Already did Training or Responded | Completed/engaged |
| 2 | Pending to contact | New lead |
| 3 | Not Responding email or Call | Unresponsive |

### Sample Rows (first 10)
| # | DATE | COMPANY | EMP | $ | CONTACT | CITY | EMAIL | PHONE |
|---|---|---|---|---|---|---|---|---|
| 1 | 2019-03-26 | Advanced Machining Products, Inc | F2P | 700 | Bob Kennamer | Camarillo, CA 93012 | bkennamer.amp@verizon.net | (805)445-7176 |
| 2 | 2019-05-25 | Elyel Corporation | F3P | — | — | Carlsbad, CA 92008 | — | (800)618-6899 |
| 3 | 2019-06-27 | Kellstrom Defense | F5P | 1125 | Sophana Chhim / Jessica Calvillo | Taft, CA 93268 | Jessica.Calvillo@KellstromDefense.com | (661)745-4421 |
| 4 | 2019-07-24 | A1 Factory Direct Flooring | F3P | 600 | Casie Moon | San Marcos, CA 92069 | casie@a1factorydirect.com | (760)741-6470 |
| 5 | 2019-09-20 | Pirch | F3P | 600 | Jacob Smith | Oceanside, CA 92056 | Jacob.Smith@pirch.com | (858)966-3636 |
| 6 | 2019-11-15 | San Diego Solar & Roofing | F5P | 1100 | Kim Frisch | San Diego, CA 92126 | kimf@sandiegosolarandroofing.com | (844)276-5278 |
| 7 | 2020-03-06 | Hellmann Worldwide Logistics | F4P | 1200 | Ruben Baca | San Diego, CA 92154 | rubenbaj@us.hellmann.net | (619)210-1042 |
| 8 | 2020-03-13 | Palomar Technologies | F6P | 1350 | Amy Russo | Carlsbad, CA 92009 | arusso@bonders.com | (760)931-3690 |
| 9 | 2020-03-20 | Howmet (Arconic) | F1P + S4P | — | Christopher Landrus | Sylmar, CA 91342 | christopher.landrus@arconic.com | (818)367-2261 |
| 10 | 2020-06-27 | Express Med | F3P | 750 | Deia Dressman | Carlsbad, CA 92009 | ddressman@dhsmed.com | (760)579-7200 |

### Data Quality Issues
- **12 rows missing revenue** ($ column null)
- **5 rows missing email**
- **26 rows missing phone**
- **5 rows missing contact person**
- **4 rows missing city**
- **CONTACT PERSON field**: 4 rows contain multiple names separated by `/` (e.g. "Sophana Chhim / Jessica Calvillo")
- **COMMENTS field**: Rich free-text with additional email addresses, status updates, dates of last contact
- **CITY field**: Consistent "City, State ZIP" format; 300 of 305 parse cleanly with regex
- **Date format**: Excel serial numbers (need conversion to JS Date)
- **Some emails have trailing spaces** (e.g. "Jessica.Calvillo@KellstromDefense.com ")
- **COMMENTS contain additional contact info** — emails, phone numbers, names of new contacts

---

## 4. Dataset 3: 2024-25-26 Onsite List

### Columns
Same structure as Dataset 2. Header at row 5 (0-indexed).

| # | Column | Type | Notes |
|---|---|---|---|
| 0 | # | integer | Sequential row number |
| 1 | DATE | Excel serial date | Range: 2024-10-30 to 2025-11-21 |
| 2 | COMPANY | text | 51 unique companies |
| 3 | EMPLOYEES | text (code) | Same coding system as DS2 — see §6 |
| 4 | $ | number | Revenue; 63 of 116 rows have revenue |
| 5 | CONTACT PERSON | text | 59 rows have contact; 57 missing |
| 6 | CITY | text | Same "City, State ZIP" format |
| 7 | EMAIL | text | 52 have email; 53 missing (nearly half) |
| 8 | PHONE | text | 63 have phone; 53 missing |
| 9 | MOBILE | text | Most missing |
| 10 | ADDRESS | text | Full street address |
| 11 | COMMENTS | text | **Empty** — 0 rows have comments |

### Sample Rows (first 10)
| # | DATE | COMPANY | EMP | $ | CONTACT | CITY | EMAIL | PHONE |
|---|---|---|---|---|---|---|---|---|
| 1 | 2024-10-30 | Advanced Oxygen Therapy, Inc | F5P | 1000 | David Bennett | Oceanside, CA 92056 | david.bennett@aitinc.net | (760)845-1642 |
| 2 | 2024-10-30 | Babmar Corp | F3P | 750 | David Burnett | San Diego, CA 92126 | david@babmar.com | (858)232-6802 |
| 3 | 2024-10-31 | Granite Factory Direct | F2P | 300 | — | San Diego, CA 92121 | youngsunstone603@gmail.com | (858)597-0025 |
| 4 | 2024-11-07 | Granite Factory Direct | F2P | 300 | — | San Diego, CA 92121 | youngsunstone603@gmail.com | (858)597-0025 |
| 5 | 2024-11-13 | AE International | F4P | 1000 | Josh Anderson | Vista, CA 92084 | josh@aeinternationalgroup.com | (619)787-0456 |
| 6 | 2024-11-19 | Flora Greens LLC | F5P | 1000 | Lidia Escalona | Vista, CA 92081 | lidia@floragreens.com | (760)214-8378 |
| 7 | 2024-11-20 | Granite Factory Direct | F2P | 300 | — | San Diego, CA 92121 | youngsunstone603@gmail.com | (858)597-0025 |
| 8 | 2024-12-04 | WE Pack Services | F12P | 2400 | Don Fryer | San Diego, CA 92121 | dfryer@wepackservices.com | (619)985-6651 |
| 9 | 2024-12-11 | Hitec Group USA, Inc | F3P | 750 | Martin Prieto | Poway, CA 92064 | martinp@hitecrcd.com | (858)748-6948 |
| 10 | 2024-12-24 | Fulfillmate | F5P | 1125 | Steve Tabacchiera | San Diego, CA 92114 | steve@fulfillmate.us | (760)791-6597 |

### Data Quality Issues
- **53 rows missing revenue** (nearly half) — appears to be for pending/unconfirmed events
- **53 rows missing email** (nearly half) — same rows tend to be missing contact info
- **57 rows missing contact person** — significant gap
- **COMMENTS field is entirely empty** — unlike DS2, no status tracking
- **Granite Factory Direct appears 3 times** — repeat trainings on different dates, NOT duplicates
- **Some companies appear multiple times** for the same reason (repeat training events)
- **Missing contact info correlates with missing revenue** — likely pending leads not yet confirmed

### Repeat Companies (appear multiple times)
- Granite Factory Direct: 3 appearances (Oct 30, Nov 7, Nov 20)
- Other companies likely appear 2+ times — these represent repeat training events, NOT duplicates to merge

---

## 5. Cross-Dataset Analysis

### Company Overlap (fuzzy match on normalized company name)

Normalization strips `.,&`, suffixes (inc, llc, corp, co, ltd, the), and collapses whitespace.

| Comparison | Overlapping Companies |
|---|---|
| DS1 (Clients) ∩ DS2 (FLA) | 4 companies |
| DS1 (Clients) ∩ DS3 (2024-25-26) | 14 companies |
| DS2 (FLA) ∩ DS3 (2024-25-26) | 11 companies |
| All 3 datasets | 0 companies |

**Key finding:** Very low overlap between DS1 (contact list) and DS2/DS3 (onsite training lists). This makes sense — DS1 is Alberto's general customer contact list, while DS2/DS3 are specifically onsite training engagements. The 14 companies overlapping DS1∩DS3 represent customers who were in the contact list AND got an onsite training event in the MFT era.

### Email Overlap

| Comparison | Overlapping Emails |
|---|---|
| DS1 ∩ DS2 | 3 emails |
| DS1 ∩ DS3 | 16 emails |
| DS2 ∩ DS3 | 9 emails |

**DS2 ∩ DS3 email samples:** styrcha@cch2o.com, gmenchaca@vita-pakt.com, dadams@missiontrail.com, josh@aeinternationalgroup.com, david@babmar.com, lidia@floragreens.com, steve@fulfillmate.us, youngsunstone603@gmail.com

These represent companies that had training in both the FLA era and the MFT era — repeat customers.

### Companies in DS2 ∩ DS3 (repeat training customers)
Abbott, Look Stairchairs, Vita-Pakt, K2 Systems, Mission Trail Waste Systems, Krannich Solar, Qualstar, EMLinq/EmLinQ, David Barnes Co, Calpine Corp/Corporation, LACMA

**Import implication:** These companies should be merged into a single `companies` record with multiple training event records (one per dataset row).

### Date Range Analysis

| Dataset | Date Range | Era |
|---|---|---|
| DS2 (FLA) | 2019-03-26 to 2024-12-27 | FLA era (pre-MFT partnership) |
| DS3 (2024-25-26) | 2024-10-30 to 2025-11-21 | MFT era (post-partnership) |

**Note:** DS2 dates span 5+ years (2019-2024). DS3 dates span ~1 year (Oct 2024 - Nov 2025). There is a gap/overlap around Oct-Dec 2024 when the transition from FLA to MFT occurred.

### DS1 Custom Field (Status) Patterns

126 unique Custom Field values in DS1. Major categories:

| Category | Example Values | Approx Count |
|---|---|---|
| Already certified/setup | "Already Certified.", "Already set-up for now" | ~20 |
| Estimate sent | "Already sent an estimate #136", "Already sent Price." | ~45 |
| Not interested | "Not Interested.", "NOT Interested. Insurance provide this certification" | ~15 |
| Returned/bounced email | "Returned.", "Returned. Message could not be delivered" | ~10 |
| Contact no longer there | "No longer in the Co.", "No longer with the Company" | ~15 |
| Interested/pending | "Still thinking about it.", "Requested Price for 1 person" | ~5 |
| Training scheduled | "Already sent an estimate #150. Training on Feb/25" | ~10 |
| Other | Various notes | ~6 |

### DS2 COMMENTS Patterns

COMMENTS in DS2 are richer than DS1's Custom Field. They contain:
- **Status updates with dates**: "Not responding email 7/24/25"
- **Additional contact emails**: "Also Sophana.Chhim@KellstromDefense.com"
- **Contact changes**: "No longer in the Co. Coordinator Kathryn Mohorc"
- **Company status**: "No Longer exist", "Downsized to small operation"
- **Training notes**: "Already certified, We need to contact them in March, 2027"
- **Alternative options**: "Online option"

---

## 6. EMPLOYEES Code System

### Decoding

The EMPLOYEES field uses a structured code system. Analysis of 71 unique values across DS2+DS3:

**Code format:** `[EquipmentType][Number]P` — multiple codes joined by ` + `

| Prefix | Meaning | Full Name |
|---|---|---|
| `F` | Forklift | Forklift operators |
| `S` | Scissor lift | Scissor lift operators |
| `FTT` | Forklift Train-the-Trainer | Forklift instructor certification |
| `STT` | Scissor lift Train-the-Trainer | Scissor lift instructor certification |

**Number** = count of people being trained for that equipment type.
**`P`** = People (or Persons).

### Examples Decoded

| Code | Meaning |
|---|---|
| `F2P` | 2 forklift operators |
| `F3P` | 3 forklift operators |
| `F5P` | 5 forklift operators |
| `F10P` | 10 forklift operators |
| `FTT1` | 1 forklift train-the-trainer |
| `FTT5` | 5 forklift train-the-trainer |
| `S4P` | 4 scissor lift operators |
| `F1P + S4P` | 1 forklift operator + 4 scissor lift operators |
| `F5P + S5P` | 5 forklift + 5 scissor lift operators |
| `F20P + S20P` | 20 forklift + 20 scissor lift operators (40 total) |
| `F43P + S43P` | 43 forklift + 43 scissor lift (86 total) |
| `FTT1 + STT1` | 1 forklift TTT + 1 scissor lift TTT |
| `FTT5 + STT5` | 5 forklift TTT + 5 scissor lift TTT |

### Special Cases
- `F5p` — lowercase `p` (data entry inconsistency; treat same as `F5P`)
- `FTT15` — 15 forklift train-the-trainer (no `P` suffix; treat as people)
- Single `FTT` codes (FTT1, FTT2, FTT3, etc.) — no `P` suffix but same meaning

### Total Employee Count Calculation

To compute total people trained per event:
1. Split code by ` + `
2. For each segment, extract the number
3. Sum across all segments

Example: `F10P + S11P` = 10 + 11 = 21 total people

### Full Unique Values (71 total)

```
F1P + S4P, F2P, F3P, F3P + S3P, F3P + S6P, F4P, F5P, F5P + S15P, F5P + S2P,
F5P + S5P, F5P + S8P, F5p, F6P, F6P + S14P, F6P + S6P, F7P, F8P, F9P, F9P + S9P,
F10P, F10P + FTT1, F10P + S11P, F11P, F12P, F13P, F13P + FTT1, F13P + S3P,
F14P, F14P + FTT1, F15P, F16P, F16P + S3P, F17P + S4P, F18P, F20P, F20P + S20P,
F20P + S4P, F21P, F22P, F25P, F26P, F28P, F30P, F31P, F43P + S43P,
FTT1, FTT1 + F8P, FTT1 + STT1, FTT2, FTT3, FTT4, FTT5, FTT5 + STT2, FTT5 + STT5,
FTT6, FTT7, FTT11 + STT5, FTT15,
S4P, S5P, S6P, S9P, S10P, S11P, S19P, S24P,
STT1, STT3, STT4, STT7, STT10
```

---

## 7. Revenue Analysis

Combined revenue from DS2 + DS3 (297 data points with revenue):

| Metric | Value |
|---|---|
| Total entries with revenue | 297 |
| Missing revenue (DS2) | 12 of 246 (5%) |
| Missing revenue (DS3) | 53 of 116 (46%) |
| Min | $300 |
| Max | $12,100 |
| Average | $2,214 |
| Median | $1,800 |

### Revenue Distribution

| Range | Count |
|---|---|
| < $500 | 6 |
| $500 - $999 | 36 |
| $1,000 - $1,999 | 128 |
| $2,000 - $4,999 | 114 |
| $5,000+ | 13 |

**Observation:** The $300 minimum corresponds to F2P (2 forklift operators at ~$150/person). The $12,100 max likely represents a large combined forklift + scissor lift + TTT event. Revenue scales with employee count — each person costs approximately $150-$300 depending on training type.

### Revenue Per Person Analysis

Spot-checking the data:
- F2P @ $300 = $150/person
- F3P @ $600 = $200/person
- F3P @ $750 = $250/person
- F5P @ $1,000 = $200/person
- F5P @ $1,100 = $220/person
- F10P @ $1,800 = $180/person
- F12P @ $2,400 = $200/person

**Pattern:** Forklift training averages ~$150-$250 per person. Scissor lift and TTT may have different pricing. Volume discounts appear at higher counts.

---

## 8. Schema Gap Analysis

### Current Schema Tables Reviewed
- `companies` (line 502) — name, phone, email, website, billing address, industry, employeeCount, assignedRepId, leadSource, notes
- `contacts` (line 544) — companyId, firstName, lastName, email, phone, title, role, isPrimary, notes, tags
- `employeeRoster` (line 523) — companyId, name, email, phone, roleTitle, status
- `onsiteTrainingRequests` (line 578) — companyName, contactName, email, phone, address, city, state, zip, traineeCount, equipmentTypes, trainingType, status, companyId, contactId
- `trainingEvents` (line 795) — originatingLeadId, companyId, primaryContactId, title, status, locationType, location fields, scheduledStart/End, traineeCount, equipmentTypes, instructorId
- `certifications` (line 199) — issued certs with expiry dates

### Field Mapping: Dataset → Schema

#### Dataset 1 (Clients) — Contact-Centric

| DS1 Field | Maps To | Notes |
|---|---|---|
| First Name | `contacts.firstName` | Direct |
| Last Name | `contacts.lastName` | Direct |
| Email | `contacts.email` | Direct; 42 missing |
| Client Company | `companies.name` | Create company per unique name |
| Type | `contacts.tags[]` | "Customer Regular", "Net 15 customer", etc. |
| Phone | `companies.phone` | Goes to company, not contact |
| Cell Phone | `contacts.phone` | Goes to contact |
| Custom Field | `contacts.notes` | Free-text status notes |

**Gap:** No `importBatchId` column on companies or contacts for idempotency. The existing script references this column but it doesn't exist in schema yet.

#### Dataset 2 & 3 (Onsite Lists) — Training-Event-Centric

| DS2/3 Field | Maps To | Notes |
|---|---|---|
| DATE | `trainingEvents.scheduledStart` | Convert Excel serial to Date |
| COMPANY | `companies.name` | Create/find company |
| EMPLOYEES | `trainingEvents.traineeCount` + `equipmentTypes` | Needs decoding (see §6) |
| $ | **NO HOME** | No revenue field on trainingEvents or companies |
| CONTACT PERSON | `contacts.firstName`/`lastName` | May have multiple names separated by `/` |
| CITY | `companies.billingCity` + `billingState` + `billingZip` | Needs parsing from "City, State ZIP" |
| EMAIL | `contacts.email` | Direct |
| PHONE | `contacts.phone` | Direct |
| MOBILE | `contacts.phone` (fallback) | Store as alternate phone |
| ADDRESS | `companies.billingStreet` + `trainingEvents.onsiteStreet` | Goes to both company billing and training event location |
| COMMENTS | **NO HOME** | No status/comments field on trainingEvents or companies |

### Fields With No Home in Current Schema

| Field | Source | Why It's Missing | Impact |
|---|---|---|---|
| **Revenue ($)** | DS2, DS3 | No revenue/cost field on trainingEvents | Loss of historical pricing data |
| **EMPLOYEES raw code** | DS2, DS3 | employeeCount is integer on companies; traineeCount is integer on trainingEvents | Loss of equipment-type breakdown |
| **COMMENTS/status** | DS2 | No status field on trainingEvents (only fulfillment status) | Loss of contact history and notes |
| **Import batch tracking** | All | No importBatchId column | Cannot ensure idempotency or trace imports |
| **Source era (FLA vs MFT)** | DS2, DS3 | leadSource is free-text on companies | Cannot distinguish FLA-era from MFT-era training |
| **Custom Field (DS1)** | DS1 | Maps to notes, but status info is structured | Status info buried in free-text notes |

---

## 9. Schema Expansion Recommendations

> **IMPORTANT:** These are RECOMMENDATIONS ONLY. Do NOT modify `shared/schema.ts` until Peter approves. The import script is designed to work without these schema changes (it will store unresolved data in notes/tags).

### Recommendation 1: Add `revenue` to `trainingEvents`

```sql
ALTER TABLE training_events ADD COLUMN revenue integer;
```

**Why:** 297 training events in DS2+DS3 have revenue data ranging from $300 to $12,100. This is critical historical pricing data that would let Miramar analyze revenue trends, pricing per person, and customer lifetime value.

**Data it holds:** The `$` column from DS2/DS3, stored as integer (cents not needed — all values are whole dollars).

### Recommendation 2: Add `rawEmployeesCode` to `trainingEvents`

```sql
ALTER TABLE training_events ADD COLUMN raw_employees_code text;
```

**Why:** The EMPLOYEES field (e.g. "F5P + S3P") encodes both the count AND the equipment type breakdown. While `traineeCount` (integer) and `equipmentTypes` (text[]) can capture the decoded values, the raw code preserves Alberto's original notation for verification.

**Data it holds:** The original EMPLOYEES string from the spreadsheet.

### Recommendation 3: Add `importBatchId` to `companies` and `contacts`

```sql
ALTER TABLE companies ADD COLUMN import_batch_id text;
ALTER TABLE contacts ADD COLUMN import_batch_id text;
```

**Why:** Idempotency. Without this, running the import twice creates duplicate records. With it, we can detect and skip records from the same batch. Also enables traceability — "which records came from Alberto's data vs. organic CRM entries?"

**Data it holds:** A batch identifier like `"alberto_pre_partnership_2026-07-12"`.

### Recommendation 4: Add `sourceEra` to `companies` or `trainingEvents`

```sql
ALTER TABLE companies ADD COLUMN source_era text;  -- "fla_era" | "mft_era" | "pre_partnership"
ALTER TABLE training_events ADD COLUMN source_era text;
```

**Why:** DS2 is FLA-era (2019-2024), DS3 is MFT-era (2024-2025). The current `leadSource` field on companies is free-text and doesn't distinguish eras. A structured `sourceEra` field enables filtering and reporting by partnership period.

**Data it holds:** `"fla_era"`, `"mft_era"`, or `"pre_partnership"`.

### Recommendation 5: Add `statusNotes` to `trainingEvents`

```sql
ALTER TABLE training_events ADD COLUMN status_notes text;
```

**Why:** DS2's COMMENTS field contains rich status updates ("Not responding email 7/24/25", "No Longer exist", "Already certified"). The existing `adminNotes` field is for internal staff notes, not for importing Alberto's status tracking. A separate `statusNotes` preserves the source data without mixing it with operational notes.

**Data it holds:** The COMMENTS column from DS2. For DS1, the Custom Field value.

### Recommendation 6: Add `billingStreet` enhancement (minor — no schema change needed)

The `companies.billingStreet` field already exists. DS2/DS3 ADDRESS data maps directly. No change needed — just ensuring the import populates it.

### Recommendation 7: Consider a `historicalTrainingRecords` table (future)

```sql
CREATE TABLE historical_training_records (
  id serial PRIMARY KEY,
  company_id integer REFERENCES companies(id),
  contact_id integer REFERENCES contacts(id),
  training_date timestamp,
  employees_code text,       -- raw code like "F5P + S3P"
  trainee_count integer,     -- decoded total
  equipment_types text[],    -- decoded: ["forklift", "scissor_lift"]
  revenue integer,
  source_era text,            -- "fla_era" | "mft_era"
  source_file text,           -- which xlsx file
  comments text,
  import_batch_id text,
  created_at timestamp NOT NULL DEFAULT NOW()
);
```

**Why:** The existing `trainingEvents` table has a rich fulfillment workflow (status transitions, instructor assignment, etc.) that doesn't apply to historical data imported from spreadsheets. Creating a lighter-weight `historicalTrainingRecords` table would:
- Avoid polluting `trainingEvents` with records that lack full data
- Keep historical data clearly separated from future training events
- Preserve all source data without forcing it into the fulfillment workflow
- Enable reporting on "all training ever done for this company" via a UNION query

**Alternative:** If Peter prefers a single table, we can use `trainingEvents` with `status="completed"` and a `sourceEra` tag. But this risks mixing historical imports with live operational data.

### Recommendation Summary

| # | Change | Table | Priority | Complexity |
|---|---|---|---|---|
| 1 | Add `revenue` | trainingEvents | High | Low |
| 2 | Add `rawEmployeesCode` | trainingEvents | Medium | Low |
| 3 | Add `importBatchId` | companies, contacts | High | Low |
| 4 | Add `sourceEra` | companies | Medium | Low |
| 5 | Add `statusNotes` | trainingEvents | Medium | Low |
| 6 | (no change needed) | companies | — | — |
| 7 | New `historicalTrainingRecords` table | (new) | Low | Medium |

**Recommended approach for v1 import:** Implement recommendations 1-5 as schema additions. Defer recommendation 7 unless Peter wants strict separation of historical data. The import script (§10) is designed to work with OR without these changes — it will store data in notes/tags as fallback if schema changes are not yet applied.

---

## 10. Import Strategy

### Order of Import

**Step 1: Dataset 1 (Clients) — FIRST**
- Import 1,376 contacts and 1,345 companies first
- This establishes the company/contact base that DS2/DS3 will reference
- Each contact gets `tags=["pre-partnership", <Type>]` and `notes=<Custom Field>`
- Companies get `leadSource="alberto_pre_partnership"`

**Step 2: Dataset 2 (FLA) — SECOND**
- Import 246 training event rows
- For each row: find-or-create company (fuzzy match), find-or-create contact (email match), create training event
- Companies found in DS1 are reused; new companies are created with `leadSource="alberto_fla_era"`
- Training events get `status="completed"` (all are historical)
- `sourceEra="fla_era"` tag (stored in adminNotes until schema expanded)

**Step 3: Dataset 3 (2024-25-26) — THIRD**
- Import 116 training event rows
- Same logic as DS2 but with `sourceEra="mft_era"` and `leadSource="alberto_mft_era"`
- Companies appearing in both DS2 and DS3 are reused (single company record, multiple training events)

### Deduplication Strategy

#### Company Name Normalization
```
function normCompany(name):
  1. lowercase
  2. remove [.,&]
  3. remove suffixes: inc, llc, corp, corporation, ltd, co, the
  4. collapse whitespace
  5. trim
```

This normalization key is used for Map-based dedup within each dataset AND across datasets. For example:
- "Calpine Corp" and "Calpine Corporation" both normalize to "calpine"
- "EMLinq" and "EmLinQ" both normalize to "emlinq"
- "LACMA" and "Lacma" both normalize to "lacma"

#### Email Matching
- Normalize to lowercase, trim whitespace
- If email matches an existing contact, skip contact creation and link to existing
- If email is missing but company matches, create a new contact under that company

#### Cross-Dataset Matching Flow
1. Build company map from DS1 (1,345 normalized company keys)
2. For each DS2 row, check if company exists in the DS1 map
   - If yes: reuse company, check if contact email matches DS1 contact
   - If no: create new company
3. For each DS3 row, check against the combined DS1+DS2 company map
   - Same matching logic

### Handling Companies in Multiple Datasets

A company appearing in DS2 and DS3 (e.g. "Abbott", "Vita-Pakt") should:
1. Be created ONCE in the `companies` table (first occurrence wins)
2. Have MULTIPLE `trainingEvents` records (one per dataset row)
3. Have its `leadSource` updated to reflect the most recent era: `"alberto_mft_era"` if it appears in DS3

This preserves the training history while avoiding duplicate companies.

### Handling CONTACT PERSON with Multiple Names

The CONTACT PERSON field may contain multiple names separated by `/`:
- "Sophana Chhim / Jessica Calvillo" → 2 contacts
- "Sam / Nick Canavarro" → 2 contacts (first is informal name)

**Strategy:**
1. Split on `/`
2. For each name, attempt first/last name split (first word = first name, rest = last name)
3. Create a separate `contacts` record for each person
4. Mark the first person as `isPrimary=true`
5. If email is available, associate it with the first contact only
6. If no email, all contacts get null email

### Parsing CITY Field

Format: "City, State ZIP" (e.g. "Camarillo, CA 93012")

Regex: `^(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)`

**Edge cases found:**
- "Fresno, CA" — no ZIP (3 rows)
- "San Diego, CA 9211" — truncated ZIP (1 row)
- "Truckee, CA" — no ZIP (2 rows)
- "Hollywood, CA" — no ZIP (1 row)

For rows without ZIP: store city and state, leave zip null.
For truncated ZIP: store as-is (do not pad).

### Handling EMPLOYEES Code

**Decode strategy:**
```typescript
function decodeEmployeesCode(code: string): {
  traineeCount: number;
  equipmentTypes: string[];
  rawCode: string;
} {
  // Split by " + "
  const segments = code.toUpperCase().split(' + ');
  let total = 0;
  const equipment = new Set<string>();

  for (const seg of segments) {
    // Match: [F|S|FTT|STT][number][P?]
    const m = seg.match(/^(FTT|STT|F|S)(\d+)P?$/);
    if (m) {
      const type = m[1];
      const count = parseInt(m[2]);
      total += count;
      if (type === 'F' || type === 'FTT') equipment.add('forklift');
      if (type === 'S' || type === 'STT') equipment.add('scissor_lift');
      if (type === 'FTT') equipment.add('forklift_train_the_trainer');
      if (type === 'STT') equipment.add('scissor_lift_train_the_trainer');
    }
  }

  return { traineeCount: total, equipmentTypes: [...equipment], rawCode: code };
}
```

- `traineeCount` → `trainingEvents.traineeCount`
- `equipmentTypes` → `trainingEvents.equipmentTypes`
- `rawCode` → stored in `adminNotes` or `rawEmployeesCode` (if schema expanded)

### Pre-Partnership Labeling Strategy

All imported records are labeled as pre-partnership / Alberto-sourced:

| Entity | Field | Value |
|---|---|---|
| companies | `leadSource` | `"alberto_pre_partnership"` (DS1), `"alberto_fla_era"` (DS2), `"alberto_mft_era"` (DS3) |
| companies | `notes` | Prefix with `[Imported from Alberto CRM]` |
| contacts | `tags` | `["pre-partnership", <Type>]` (DS1), `["pre-partnership", "onsite-training"]` (DS2/3) |
| trainingEvents | `adminNotes` | `[Imported from Alberto <dataset> | ERA: <fla_era|mft_era> | EMP CODE: <raw>]` |

### Whether to Create trainingEvents Records for Historical Data

**YES** — create `trainingEvents` records for all DS2 and DS3 rows.

Rationale:
- These ARE training events that actually happened (DS2) or were scheduled (DS3)
- The `trainingEvents` table has a `status` field with "completed" as a valid value
- Creating these records gives Miramar a complete training history per company
- Future features (certification tracking, renewal reminders) benefit from this data

**Settings for historical training events:**
- `status` = `"completed"` (for DS2 — all are past events)
- `status` = `"completed"` for DS3 rows with revenue; `"unscheduled"` for DS3 rows without revenue/contact (likely pending leads)
- `locationType` = `"customer_onsite"`
- `scheduledStart` = DATE column (converted from Excel serial)
- `title` = `"Onsite Training - <Company Name>"`

### Idempotency

The import script must be safe to run multiple times without creating duplicates.

**Strategy (without schema changes):**
- Company dedup via normalized name Map (in-memory within a single run)
- Contact dedup via email Map (in-memory within a single run)
- The script prints a clear warning that idempotency is NOT guaranteed across multiple runs without the `importBatchId` schema column
- When `importBatchId` is added to the schema (Recommendation 3), the script can check for existing records with that batch ID before inserting

### What the Import Script Does NOT Do (Yet)

- **No database writes** — dry-run only. Prints full mapping summary.
- **No `--commit` mode** — the `--commit` flag is explicitly blocked until Peter approves.
- **No schema migrations** — the script works with the current schema. Fields that need new columns are stored in existing fields (notes, adminNotes, tags) as fallback.

---

## 11. Approval Checklist

Before proceeding with schema changes and live import, Peter should review and approve:

- [ ] **Schema recommendations (§9)** — which of the 7 recommendations to approve
- [ ] **Import order (§10)** — DS1 → DS2 → DS3 is the proposed order
- [ ] **Deduplication strategy (§10)** — company name normalization rules
- [ ] **CONTACT PERSON splitting (§10)** — split on `/` and create multiple contacts
- [ ] **CITY parsing (§10)** — handle missing/truncated ZIP codes as documented
- [ ] **EMPLOYEES code decoding (§10)** — the decode function and equipment type mapping
- [ ] **Pre-partnership labeling (§10)** — leadSource values and tag strategy
- [ ] **Historical training events (§10)** — create trainingEvents with status="completed" for past events
- [ ] **DS3 pending leads** — rows without revenue/contact info get status="unscheduled" (treat as pending leads, not completed events)
- [ ] **Enable --commit mode** — after approval, implement the actual DB writes

---

*End of analysis document.*

