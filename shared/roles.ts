export const ALL_ROLES = [
  "individual",
  "certified_student",
  "instructor_applicant",
  "instructor",
  "group_admin",
  "admin",
  "super_admin",
] as const;

export type UserRole = typeof ALL_ROLES[number];

const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  individual: [],
  certified_student: ["individual"],
  instructor_applicant: ["individual"],
  instructor: ["individual"],
  group_admin: ["individual"],
  admin: ["individual", "group_admin"],
  super_admin: ["individual", "group_admin", "admin"],
};

export function roleIncludes(userRole: string, requiredRole: string): boolean {
  if (userRole === requiredRole) return true;
  const inherited = ROLE_HIERARCHY[userRole as UserRole];
  if (!inherited) return false;
  return inherited.includes(requiredRole as UserRole);
}

export function hasAnyRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.some(r => roleIncludes(userRole, r));
}

export function isAdminRole(role: string): boolean {
  return role === "admin" || role === "super_admin";
}

export function getPostLoginRedirect(role: string): string {
  if (role === "super_admin" || role === "admin") return "/admin";
  if (role === "group_admin") return "/group";
  return "/dashboard";
}
