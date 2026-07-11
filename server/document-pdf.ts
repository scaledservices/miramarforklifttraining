import path from "path";
import fs from "fs";
import { industry } from "@shared/config/industry";

export interface DocumentDef {
  id: string;
  title: string;
  description: string;
  filename: string;
  category: "compliance" | "forms" | "training";
}

export const documentCatalog: DocumentDef[] = [
  {
    id: "osha-rules-regulations",
    title: `${industry.regulatory.body} Guidelines for Safe Operation of PITs`,
    description: `Complete ${industry.regulatory.body} operating rules and safety standards for Powered Industrial Truck operators, issued in accordance with ${industry.regulatory.standard}.`,
    filename: "OSHA-Guidelines-for-the-Safe-Operation-of-Powered-Industrial-Trucks.pdf",
    category: "compliance",
  },
  {
    id: "sample-test",
    title: "PIT Sample Test",
    description: `True/false and multiple choice sample test covering forklift safety, operation procedures, and ${industry.regulatory.body} compliance knowledge.`,
    filename: "Powered-Industrial-Truck-PIT-SAMPLE-TEST.pdf",
    category: "training",
  },
  {
    id: "pre-operation-checklist",
    title: "PIT Inspection Checklists",
    description: "Pre-use inspection checklists for all powered industrial truck types including electric forklifts, propane forklifts, yard forklifts, reach trucks, order pickers, tow tractors, and pallet trucks.",
    filename: "Powered-Industrial-Truck-Inspection-Checklists.pdf",
    category: "forms",
  },
  {
    id: "performance-evaluation",
    title: "Performance Test",
    description: "Supervisor-conducted performance test to evaluate operator proficiency, safety knowledge, and equipment handling before, during, and after operation.",
    filename: "PERFORMANCE-TEST.pdf",
    category: "forms",
  },
  {
    id: "operator-permit",
    title: "PIT Permit to Operate",
    description: `Permit to operate form for documenting forklift operator authorization, certification details, and employer/employee information per ${industry.regulatory.body} regulations.`,
    filename: "Powered-Industrial-Truck-PIT-PERMIT-TO-OPERATE.pdf",
    category: "forms",
  },
  {
    id: "attendance-sheet",
    title: "Attendance Form & Scheduling",
    description: "Safety training session attendance form for recording employee names, dates, times, and signatures.",
    filename: "ATTENDANCE-FORM-AND-SCHEDULING.pdf",
    category: "forms",
  },
  {
    id: "site-presentation",
    title: "Miramar Forklift Training Presentation",
    description: `Comprehensive ${industry.regulatory.body}-compliant PIT operator certification training presentation covering all 7 equipment classes, tire types, fuel types, attachments, regulatory framework, safe operating procedures, and certification process.`,
    filename: "Miramar-Forklift-Training.pdf",
    category: "training",
  },
];

function getStaticAssetPath(docId: string, locale?: string): string {
  if (locale && locale !== "en") {
    const localePath = path.join(process.cwd(), "server", "assets", `${docId}-${locale}.pdf`);
    if (fs.existsSync(localePath)) return localePath;
  }
  return path.join(process.cwd(), "server", "assets", `${docId}.pdf`);
}

export async function generateDocumentPdf(docId: string, locale?: string): Promise<{ buffer: Buffer; resolvedLocale: string }> {
  const docDef = documentCatalog.find(d => d.id === docId);
  if (!docDef) throw new Error(`Unknown document: ${docId}`);

  if (locale && locale !== "en") {
    const localePath = path.join(process.cwd(), "server", "assets", `${docId}-${locale}.pdf`);
    if (fs.existsSync(localePath)) {
      const buffer = await fs.promises.readFile(localePath);
      return { buffer, resolvedLocale: locale };
    }
  }

  const staticPath = getStaticAssetPath(docId);
  if (fs.existsSync(staticPath)) {
    const buffer = await fs.promises.readFile(staticPath);
    return { buffer, resolvedLocale: "en" };
  }

  throw new Error(`Document PDF not found: ${staticPath}`);
}

export function getDocumentDef(docId: string): DocumentDef | undefined {
  return documentCatalog.find(d => d.id === docId);
}
