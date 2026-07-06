import type { Express, Request, Response } from "express";
import {
  ROLE_CERT_MAPPINGS,
  getRecommendedCerts,
  getRoleMapping,
} from "@shared/config/cert-roles";
import { requireAuth } from "./middleware";

/**
 * Role-to-certification recommendation endpoints.
 *
 * These endpoints expose the curated role → cert mapping defined in
 * shared/config/cert-roles.ts. They are read-only — no DB writes.
 *
 * Routes:
 *  GET /api/role-certs                         — all role mappings
 *  GET /api/role-certs/:roleKey                 — recommended certs for a role
 *  GET /api/role-certs/recommend/:employeeId    — (future) certs for an employee
 */
export function registerRoleCertRoutes(app: Express) {
  // ── All role mappings ──────────────────────────────────────────────
  app.get("/api/role-certs", requireAuth, (_req: Request, res: Response) => {
    return res.json({ roles: ROLE_CERT_MAPPINGS });
  });

  // ── Recommended certs for a specific role ──────────────────────────
  app.get(
    "/api/role-certs/:roleKey",
    requireAuth,
    (req: Request, res: Response) => {
      const roleKey = req.params.roleKey as string;
      const mapping = getRoleMapping(roleKey);

      if (!mapping) {
        return res.status(404).json({ error: "Role not found" });
      }

      return res.json({ role: mapping, recommendedCerts: mapping.recommendedCerts });
    },
  );

  // ── Recommended certs for a specific employee (future) ────────────
  // Once the employeeRoster table is available, this endpoint will look up
  // the employee's roleTitle, map it to a role key, and return recommended
  // certs. For now it returns a 501 placeholder so the contract is stable.
  app.get(
    "/api/role-certs/recommend/:employeeId",
    requireAuth,
    (req: Request, res: Response) => {
      const employeeId = req.params.employeeId as string;

      // Placeholder: when employeeRoster is wired, resolve employee → roleTitle
      // → role key → getRecommendedCerts(). For now, return not-implemented.
      void employeeId;
      return res.status(501).json({
        error: "Employee recommendation not yet implemented",
        employeeId,
      });
    },
  );
}
