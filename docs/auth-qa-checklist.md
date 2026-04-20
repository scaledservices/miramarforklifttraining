# Auth & Access Control QA Checklist

## Role System
- [x] 7 roles defined: individual, certified_student, instructor_applicant, instructor, group_admin, admin, super_admin
- [x] SQL migration updates constraint to accept all 7 roles
- [x] Shared role hierarchy utility (shared/roles.ts) with inheritance
- [x] requireRole middleware uses hierarchy-based checks
- [x] ProtectedRoute imports from shared/roles.ts (single source of truth)

## Privilege Escalation Prevention
- [x] Only super_admin can assign admin or super_admin roles via /api/admin/users/:id/role
- [x] Admin role selector in AdminUsers UI conditionally shows admin/super_admin options only to super_admin
- [x] Role assignment endpoint validates role is in allowed set
- [x] Backend enforces actor-role check before assigning elevated roles

## Password Policy
- [x] Registration enforces 8+ chars, uppercase, lowercase, number
- [x] Password reset enforces same policy
- [x] Clear error messages returned for policy violations

## OAuth Providers
- [x] Google OAuth: env-gated, state verification, sanitized returnTo
- [x] LinkedIn OAuth: env-gated, state verification, sanitized returnTo
- [x] Facebook OAuth: env-gated, state verification, sanitized returnTo
- [x] /api/auth/providers returns all three provider statuses
- [x] Login/Register pages show all enabled providers
- [x] OAuth buttons propagate ?returnTo from ?next param for deep linking

## OAuth Security
- [x] OAuth state (CSRF token) generated on initiation, verified on callback
- [x] State mismatch redirects to login with error
- [x] returnTo sanitized: must start with /, must not start with //, no .. or \
- [x] Open redirect prevention via sanitizeReturnTo helper

## Route Access Control

### Admin Routes (backend)
- [x] All /api/admin/* routes gated to requireRole("admin", "super_admin")
- [x] Role hierarchy: super_admin inherits admin access
- [x] Booking detail/cancel: uses isAdminRole() for ownership bypass

### Admin Routes (frontend)
- [x] All /admin/* routes: ProtectedRoute roles={["admin", "super_admin"]}
- [x] All /group/* routes: ProtectedRoute roles={["group_admin", "admin", "super_admin"]}
- [x] Header navigation: admin role recognized for admin dashboard link

### Document Access
- [x] Certificate download: owner, group_admin (of member's group), or isAdminRole
- [x] Invoice download: owner, group_admin (if group order), or isAdminRole
- [x] Public compliance docs (/api/documents/:docId/download): no auth required (intentional)

### User-scoped Routes
- [x] Enrollments: filtered to authenticated user
- [x] Orders: filtered to authenticated user
- [x] Certifications: filtered to authenticated user
- [x] Instructor applications: owner-only view

## Frontend Auth
- [x] useAuth AuthUser type includes all 7 roles
- [x] ProtectedRoute uses shared role hierarchy (imported from @shared/roles)
- [x] Login page redirects admin role to /admin
- [x] Register page redirects admin role to /admin
- [x] Header shows correct dashboard link for admin role
- [x] AdminUsers role selector shows all 7 roles (admin/super_admin restricted to super_admin actors)
