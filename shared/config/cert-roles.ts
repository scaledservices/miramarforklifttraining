// Role-to-certification recommendation mapping.
//
// Curated mapping of common warehouse / industrial job roles to the
// certification slugs we recommend for that role. Powers the compliance
// dashboard's "who needs what" suggestions and the onsite group booking
// recommendation engine.
//
// Cert slugs intentionally mirror course slugs used elsewhere in the app
// (e.g. bookingPricing.ts) so the UI can cross-reference pricing and
// course pages without translation.

export interface RoleCertMapping {
  /** Stable machine key — never changes, used in URLs and DB lookups. */
  key: string;
  /** Human-readable display name keys for i18n lookup. */
  nameKey: string;
  /** Description key for i18n lookup explaining why these certs. */
  descriptionKey: string;
  /** Cert slugs recommended for this role. */
  recommendedCerts: string[];
}

/**
 * Curated role → cert mappings.
 *
 * Cert slug glossary:
 * - forklift               → standard-forklift-certification
 * - electric-pallet-jack   → electric pallet jack (EPJ) training
 * - scissor-lift           → scissor lift certification
 * - aerial-boom-lift       → aerial boom lift certification
 */
export const ROLE_CERT_MAPPINGS: RoleCertMapping[] = [
  {
    key: "warehouse_associate",
    nameKey: "roleCerts.roles.warehouse_associate.name",
    descriptionKey: "roleCerts.roles.warehouse_associate.description",
    recommendedCerts: ["forklift", "electric-pallet-jack"],
  },
  {
    key: "warehouse_lead",
    nameKey: "roleCerts.roles.warehouse_lead.name",
    descriptionKey: "roleCerts.roles.warehouse_lead.description",
    recommendedCerts: ["forklift", "scissor-lift", "aerial-boom-lift"],
  },
  {
    key: "forklift_operator",
    nameKey: "roleCerts.roles.forklift_operator.name",
    descriptionKey: "roleCerts.roles.forklift_operator.description",
    recommendedCerts: ["forklift"],
  },
  {
    key: "warehouse_manager",
    nameKey: "roleCerts.roles.warehouse_manager.name",
    descriptionKey: "roleCerts.roles.warehouse_manager.description",
    recommendedCerts: ["forklift", "scissor-lift", "aerial-boom-lift"],
  },
  {
    key: "delivery_driver",
    nameKey: "roleCerts.roles.delivery_driver.name",
    descriptionKey: "roleCerts.roles.delivery_driver.description",
    recommendedCerts: ["electric-pallet-jack"],
  },
  {
    key: "maintenance_technician",
    nameKey: "roleCerts.roles.maintenance_technician.name",
    descriptionKey: "roleCerts.roles.maintenance_technician.description",
    recommendedCerts: ["forklift", "scissor-lift"],
  },
  {
    key: "production_worker",
    nameKey: "roleCerts.roles.production_worker.name",
    descriptionKey: "roleCerts.roles.production_worker.description",
    recommendedCerts: ["forklift", "electric-pallet-jack"],
  },
  {
    key: "construction_worker",
    nameKey: "roleCerts.roles.construction_worker.name",
    descriptionKey: "roleCerts.roles.construction_worker.description",
    recommendedCerts: ["forklift", "aerial-boom-lift"],
  },
  {
    key: "yard_worker",
    nameKey: "roleCerts.roles.yard_worker.name",
    descriptionKey: "roleCerts.roles.yard_worker.description",
    recommendedCerts: ["forklift"],
  },
  {
    key: "logistics_coordinator",
    nameKey: "roleCerts.roles.logistics_coordinator.name",
    descriptionKey: "roleCerts.roles.logistics_coordinator.description",
    recommendedCerts: ["forklift", "electric-pallet-jack"],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Returns the list of recommended cert slugs for a given role key.
 * Returns an empty array if the role is not found.
 */
export function getRecommendedCerts(roleKey: string): string[] {
  const role = ROLE_CERT_MAPPINGS.find(
    (r) => r.key === roleKey || r.key === roleKey.replace(/[-\s]/g, "_"),
  );
  return role?.recommendedCerts ?? [];
}

/**
 * Reverse lookup: returns the role keys that recommend the given cert slug.
 * Useful for answering "which roles need forklift certification?".
 */
export function getRolesForCert(certSlug: string): string[] {
  return ROLE_CERT_MAPPINGS.filter((r) =>
    r.recommendedCerts.includes(certSlug),
  ).map((r) => r.key);
}

/**
 * Returns the full RoleCertMapping for a role key, or undefined.
 */
export function getRoleMapping(roleKey: string): RoleCertMapping | undefined {
  return ROLE_CERT_MAPPINGS.find(
    (r) => r.key === roleKey || r.key === roleKey.replace(/[-\s]/g, "_"),
  );
}
