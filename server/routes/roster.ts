import type { Express, Request, Response } from "express";
import { eq, and, inArray } from "drizzle-orm";
import multer from "multer";
import { db } from "../db";
import {
  employeeRoster,
  type EmployeeRoster,
  type InsertEmployeeRoster,
} from "@shared/schema";
import { storage } from "../storage";
import { requireAuth } from "./middleware";
import { hasAnyRole } from "@shared/roles";

/* ── File upload parser ─────────────────────────────────────── */

/**
 * Parse a single delimiter-separated line, respecting quoted fields.
 * Handles CSV (comma) and TSV (tab) formats.
 */
function parseDelimitedLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          // Escaped quote inside quoted field
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

/** Detect whether the delimiter is comma, tab, or semicolon */
function detectDelimiter(sample: string): string {
  const tabCount = (sample.match(/\t/g) || []).length;
  const semicolonCount = (sample.match(/;/g) || []).length;
  const commaCount = (sample.match(/,/g) || []).length;
  if (tabCount >= semicolonCount && tabCount >= commaCount && tabCount > 0)
    return "\t";
  if (semicolonCount > commaCount && semicolonCount > 0) return ";";
  return ",";
}

/** Header aliases → field key */
const HEADER_ALIASES: Record<string, keyof ParsedEmployee> = {
  name: "name",
  employee: "name",
  employeename: "name",
  full_name: "name",
  fullname: "name",
  worker: "name",
  operator: "name",
  email: "email",
  emailaddress: "email",
  e_mail: "email",
  mail: "email",
  phone: "phone",
  telephone: "phone",
  tel: "phone",
  mobile: "phone",
  cellphone: "phone",
  role: "roleTitle",
  roletitle: "roleTitle",
  title: "roleTitle",
  jobtitle: "roleTitle",
  position: "roleTitle",
  job: "roleTitle",
};

interface ParsedEmployee {
  name?: string;
  email?: string;
  phone?: string;
  roleTitle?: string;
}

/**
 * Smart file parser: detects delimiter, header row, and maps columns
 * by header name. Falls back to positional (name, email, phone, roleTitle)
 * if no recognizable headers are found.
 */
function parseFileContent(content: string): {
  employees: ParsedEmployee[];
  headers: string[] | null;
  columnMapping: Record<string, string> | null;
} {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return { employees: [], headers: null, columnMapping: null };

  const delimiter = detectDelimiter(lines[0]);
  const firstRow = parseDelimitedLine(lines[0], delimiter);

  // Check if first row looks like headers (contains known header names)
  const headerMatchCount = firstRow.filter((h) => {
    const normalized = h.toLowerCase().replace(/[\s_-]+/g, "");
    return normalized in HEADER_ALIASES;
  }).length;

  const isHeaderRow = headerMatchCount >= 2;

  if (isHeaderRow) {
    const headers = firstRow;
    const columnMapping: Record<string, string> = {};
    const fieldIndices: Record<string, number> = {};
    headers.forEach((header, idx) => {
      const normalized = header.toLowerCase().replace(/[\s_-]+/g, "");
      const field = HEADER_ALIASES[normalized];
      if (field && !(field in fieldIndices)) {
        fieldIndices[field] = idx;
        columnMapping[header] = field;
      }
    });
    // Parse data rows
    const employees: ParsedEmployee[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = parseDelimitedLine(lines[i], delimiter);
      const emp: ParsedEmployee = {};
      for (const [field, idx] of Object.entries(fieldIndices)) {
        const val = parts[idx];
        if (val) (emp as any)[field] = val;
      }
      if (emp.name) employees.push(emp);
    }
    return { employees, headers, columnMapping };
  } else {
    // No headers — use positional: name, email, phone, roleTitle
    const employees: ParsedEmployee[] = [];
    for (const line of lines) {
      const parts = parseDelimitedLine(line, delimiter);
      if (parts.length > 0 && parts[0]) {
        employees.push({
          name: parts[0],
          email: parts[1] || undefined,
          phone: parts[2] || undefined,
          roleTitle: parts[3] || undefined,
        });
      }
    }
    return { employees, headers: null, columnMapping: null };
  }
}

// Multer config for file uploads (in-memory, no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "text/csv",
      "application/csv",
      "text/tab-separated-values",
      "text/plain",
      "application/vnd.ms-excel",
      "application/octet-stream",
    ];
    // Also allow by file extension
    const ext = (file.originalname || "").toLowerCase();
    const allowedExt = [".csv", ".tsv", ".txt"];
    if (
      allowed.includes(file.mimetype) ||
      allowedExt.some((e) => ext.endsWith(e))
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV, TSV, or TXT files are allowed"));
    }
  },
});

/**
 * Resolve the companyId for the current user.
 * - group_admin: finds the company via their group members' certifications
 *   (same approach as audit-binder's verifyGroupAdminCompanyAccess).
 * - admin / super_admin: returns null (caller should pass companyId in body/query).
 */
async function resolveCompanyIdForUser(
  userId: number,
  role: string,
): Promise<number | null> {
  if (role === "admin" || role === "super_admin") {
    return null; // admin can operate on any company; expects companyId in request
  }
  // group_admin: find a company they manage
  const groups = await storage.getGroupsByAdmin(userId);
  for (const group of groups) {
    const members = await storage.listGroupMembers(group.id);
    for (const member of members) {
      if (member.userId) {
        const certs = await storage.getCertificationsByUser(member.userId);
        const companyCerts = certs.filter((c) => c.companyId !== null);
        if (companyCerts.length > 0) {
          return companyCerts[0].companyId!;
        }
      }
    }
  }
  // fallback: check own certs
  const ownCerts = await storage.getCertificationsByUser(userId);
  const ownCompanyCerts = ownCerts.filter((c) => c.companyId !== null);
  if (ownCompanyCerts.length > 0) {
    return ownCompanyCerts[0].companyId!;
  }
  return null;
}

function parseCsvLine(line: string): Partial<InsertEmployeeRoster> | null {
  const parts = line.split(",").map((p) => p.trim());
  if (parts.length < 1 || !parts[0]) return null;
  return {
    name: parts[0],
    email: parts[1] || undefined,
    phone: parts[2] || undefined,
    roleTitle: parts[3] || undefined,
  };
}

export function registerRosterRoutes(app: Express) {
  // GET /api/roster — list employees for the caller's company
  app.get("/api/roster", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) return res.status(401).json({ error: "Authentication required" });

      if (!hasAnyRole(currentUser.role, ["group_admin", "admin", "super_admin"])) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      let companyId: number | null;
      if (currentUser.role === "admin" || currentUser.role === "super_admin") {
        // admin can optionally filter by companyId query param, otherwise return all
        const queryCompanyId = req.query.companyId
          ? parseInt(String(req.query.companyId))
          : null;
        if (queryCompanyId) {
          const rows = await db
            .select()
            .from(employeeRoster)
            .where(eq(employeeRoster.companyId, queryCompanyId));
          return res.json({ employees: rows });
        }
        const rows = await db.select().from(employeeRoster);
        return res.json({ employees: rows });
      }

      // group_admin
      companyId = await resolveCompanyIdForUser(currentUser.id, currentUser.role);
      if (!companyId) {
        return res.json({ employees: [] });
      }
      const rows = await db
        .select()
        .from(employeeRoster)
        .where(eq(employeeRoster.companyId, companyId));
      return res.json({ employees: rows });
    } catch (error) {
      console.error("[Roster] GET /api/roster error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST /api/roster — add a single employee
  app.post("/api/roster", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) return res.status(401).json({ error: "Authentication required" });

      if (!hasAnyRole(currentUser.role, ["group_admin", "admin", "super_admin"])) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      const { name, email, phone, roleTitle, companyId: bodyCompanyId } = req.body;
      if (!name) return res.status(400).json({ error: "Name is required" });

      let companyId: number | null;
      if (currentUser.role === "admin" || currentUser.role === "super_admin") {
        companyId = bodyCompanyId ? parseInt(bodyCompanyId) : null;
        if (!companyId) {
          return res.status(400).json({ error: "companyId is required for admin users" });
        }
      } else {
        companyId = await resolveCompanyIdForUser(currentUser.id, currentUser.role);
        if (!companyId) {
          return res.status(400).json({ error: "No company associated with your account" });
        }
      }

      const [row] = await db
        .insert(employeeRoster)
        .values({
          companyId,
          name,
          email: email || undefined,
          phone: phone || undefined,
          roleTitle: roleTitle || undefined,
          addedById: currentUser.id,
        })
        .returning();

      return res.status(201).json({ employee: row });
    } catch (error) {
      console.error("[Roster] POST /api/roster error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST /api/roster/upload-file — file upload with smart parsing (CSV/TSV)
  app.post("/api/roster/upload-file", requireAuth, upload.single("file"), async (req: Request, res: Response) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) return res.status(401).json({ error: "Authentication required" });
      if (!hasAnyRole(currentUser.role, ["group_admin", "admin", "super_admin"])) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const content = req.file.buffer.toString("utf-8");
      const parsed = parseFileContent(content);
      return res.json({ employees: parsed.employees, headers: parsed.headers, columnMapping: parsed.columnMapping });
    } catch (error) {
      console.error("[Roster] Upload file error:", error);
      return res.status(500).json({ error: "Failed to parse file" });
    }
  });

  // POST /api/roster/bulk — CSV/paste import
  app.post("/api/roster/bulk", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) return res.status(401).json({ error: "Authentication required" });

      if (!hasAnyRole(currentUser.role, ["group_admin", "admin", "super_admin"])) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      const { text, companyId: bodyCompanyId } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text body is required" });
      }

      let companyId: number | null;
      if (currentUser.role === "admin" || currentUser.role === "super_admin") {
        companyId = bodyCompanyId ? parseInt(bodyCompanyId) : null;
        if (!companyId) {
          return res.status(400).json({ error: "companyId is required for admin users" });
        }
      } else {
        companyId = await resolveCompanyIdForUser(currentUser.id, currentUser.role);
        if (!companyId) {
          return res.status(400).json({ error: "No company associated with your account" });
        }
      }

      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.toLowerCase().startsWith("name,email"));

      const parsed: InsertEmployeeRoster[] = [];
      for (const line of lines) {
        const entry = parseCsvLine(line);
        if (entry && entry.name) {
          parsed.push({
            companyId,
            name: entry.name,
            email: entry.email || undefined,
            phone: entry.phone || undefined,
            roleTitle: entry.roleTitle || undefined,
            addedById: currentUser.id,
          } as InsertEmployeeRoster);
        }
      }

      if (parsed.length === 0) {
        return res.status(400).json({ error: "No valid rows found in import" });
      }

      const inserted = await db.insert(employeeRoster).values(parsed).returning();

      return res.status(201).json({ imported: inserted.length, employees: inserted });
    } catch (error) {
      console.error("[Roster] POST /api/roster/bulk error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // PATCH /api/roster/:id — update employee info
  app.patch("/api/roster/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) return res.status(401).json({ error: "Authentication required" });

      if (!hasAnyRole(currentUser.role, ["group_admin", "admin", "super_admin"])) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      const id = parseInt(String(req.params.id));
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

      const { name, email, phone, roleTitle } = req.body;
      const updates: Partial<InsertEmployeeRoster> = {};
      if (name !== undefined) updates.name = name;
      if (email !== undefined) updates.email = email;
      if (phone !== undefined) updates.phone = phone;
      if (roleTitle !== undefined) updates.roleTitle = roleTitle;

      const [row] = await db
        .update(employeeRoster)
        .set(updates)
        .where(eq(employeeRoster.id, id))
        .returning();

      if (!row) return res.status(404).json({ error: "Employee not found" });
      return res.json({ employee: row });
    } catch (error) {
      console.error("[Roster] PATCH /api/roster/:id error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // PATCH /api/roster/:id/archive — soft-delete (archive)
  app.patch(
    "/api/roster/:id/archive",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const currentUser = await storage.getUser(req.session.userId!);
        if (!currentUser)
          return res.status(401).json({ error: "Authentication required" });

        if (
          !hasAnyRole(currentUser.role, ["group_admin", "admin", "super_admin"])
        ) {
          return res.status(403).json({ error: "Insufficient permissions" });
        }

        const id = parseInt(String(req.params.id));
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        const [row] = await db
          .update(employeeRoster)
          .set({ status: "archived" })
          .where(eq(employeeRoster.id, id))
          .returning();

        if (!row) return res.status(404).json({ error: "Employee not found" });
        return res.json({ employee: row });
      } catch (error) {
        console.error("[Roster] PATCH /api/roster/:id/archive error:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    },
  );

  // PATCH /api/roster/bulk/archive — archive multiple employees
  app.patch(
    "/api/roster/bulk/archive",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const currentUser = await storage.getUser(req.session.userId!);
        if (!currentUser)
          return res.status(401).json({ error: "Authentication required" });

        if (
          !hasAnyRole(currentUser.role, ["group_admin", "admin", "super_admin"])
        ) {
          return res.status(403).json({ error: "Insufficient permissions" });
        }

        const { ids } = req.body as { ids: number[] };
        if (!Array.isArray(ids) || ids.length === 0) {
          return res.status(400).json({ error: "ids array is required" });
        }

        const updated = await db
          .update(employeeRoster)
          .set({ status: "archived" })
          .where(inArray(employeeRoster.id, ids))
          .returning();

        return res.json({ archived: updated.length });
      } catch (error) {
        console.error("[Roster] PATCH /api/roster/bulk/archive error:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    },
  );

  // DELETE /api/roster/:id — permanently remove (admin only)
  app.delete("/api/roster/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) return res.status(401).json({ error: "Authentication required" });

      if (!hasAnyRole(currentUser.role, ["admin", "super_admin"])) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const id = parseInt(String(req.params.id));
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

      const [row] = await db
        .delete(employeeRoster)
        .where(eq(employeeRoster.id, id))
        .returning();

      if (!row) return res.status(404).json({ error: "Employee not found" });
      return res.json({ deleted: true });
    } catch (error) {
      console.error("[Roster] DELETE /api/roster/:id error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
