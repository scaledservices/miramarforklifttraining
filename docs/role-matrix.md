# ForkliftCertified Role Matrix & Access Control

## Roles (ordered by privilege)

| Role | Description | Inherits From |
|------|------------|---------------|
| `individual` | Default registered user | — |
| `certified_student` | User who completed certification | `individual` |
| `instructor_applicant` | User who applied to be instructor | `individual` |
| `instructor` | Approved instructor | `individual` |
| `group_admin` | Crew/group administrator | `individual` |
| `admin` | Platform administrator | `individual`, `group_admin` |
| `super_admin` | Full platform owner | `individual`, `group_admin`, `admin` |

**Note:** `admin` and `super_admin` inherit `individual` and `group_admin` access, but do NOT inherit `instructor`, `certified_student`, or `instructor_applicant` gates. If instructor-specific or certification-specific route checks are introduced in the future, admin roles will need explicit inclusion in those gates.

## Route Access Matrix

### Public Routes (no auth required)
| Route | Access |
|-------|--------|
| `/` (Home) | All |
| `/courses`, `/courses/:slug` | All |
| `/login`, `/register` | All |
| `/verify/:certificateNumber` | All |
| `/contact`, `/about`, `/faq` | All |
| `/terms`, `/privacy`, `/refund-policy` | All |
| `/osha-compliance` | All |
| `/book-onsite-training` | All |
| `/reset-password` | All |
| `/api/auth/providers` | All |
| `/api/auth/google`, `/api/auth/linkedin`, `/api/auth/facebook` | All |
| `/api/documents/:docId/download` | All (public compliance docs) |

### Authenticated Routes (any logged-in user)
| Route | Access |
|-------|--------|
| `/dashboard` | Any authenticated |
| `/course/:enrollmentId` | Owner only (enrollment) |
| `/certifications/:id` | Owner only |
| `/certifications/:id/download` | Owner, group_admin (of owner's group), admin, super_admin |
| `/order-cert-card/:certificationId` | Owner only |
| `/become-an-instructor` | Any authenticated (requires cert or admin to submit) |
| `/api/enrollments` | Own enrollments only |
| `/api/orders` | Own orders only |
| `/api/orders/:id/invoice` | Owner, group_admin (if group order), admin, super_admin |
| `/api/certifications` | Own certifications only |
| `/api/instructor-applications` (POST) | Any authenticated |
| `/api/instructor-applications/mine` | Own application only |

### Group Admin Routes
| Route | Access |
|-------|--------|
| `/group` | `group_admin`, `admin`, `super_admin` |
| `/group/members` | `group_admin`, `admin`, `super_admin` |
| `/group/seats` | `group_admin`, `admin`, `super_admin` |
| `/group/progress` | `group_admin`, `admin`, `super_admin` |
| `/group/certifications` | `group_admin`, `admin`, `super_admin` |

### Admin Routes
| Route | Access |
|-------|--------|
| `/admin` | `admin`, `super_admin` |
| `/admin/users` | `admin`, `super_admin` |
| `/admin/courses` | `admin`, `super_admin` |
| `/admin/orders` | `admin`, `super_admin` |
| `/admin/enrollments` | `admin`, `super_admin` |
| `/admin/certificates` | `admin`, `super_admin` |
| `/admin/card-orders` | `admin`, `super_admin` |
| `/admin/audit-log` | `admin`, `super_admin` |
| `/admin/email-outbox` | `admin`, `super_admin` |
| `/admin/seo-pages` | `admin`, `super_admin` |
| `/admin/seo-health` | `admin`, `super_admin` |
| `/admin/bookings` | `admin`, `super_admin` |
| `/admin/sessions` | `admin`, `super_admin` |
| `/admin/onsite-requests` | `admin`, `super_admin` |
| `/admin/instructor-applications` | `admin`, `super_admin` |
| `/admin/instructors` | `admin`, `super_admin` |

## OAuth Providers

| Provider | Status | Environment Variables |
|----------|--------|----------------------|
| Google | Ready (env-gated) | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| LinkedIn | Ready (env-gated) | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` |
| Facebook | Ready (env-gated) | `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` |

## Password Policy
- Minimum 8 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain a number
- Enforced on registration and password reset

## Role Hierarchy
The role system uses inheritance: `super_admin` inherits all permissions from `admin`, which inherits from `group_admin`, which inherits from `individual`. This means:
- A `super_admin` can access any route that requires `admin`, `group_admin`, or `individual`
- An `admin` can access any route that requires `group_admin` or `individual`
- Hierarchy is enforced both server-side (`requireRole` middleware) and client-side (`ProtectedRoute` component)
