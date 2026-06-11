// Role hierarchy and permission definitions

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  COMPANY_ADMIN: "company_admin",
  HR_MANAGER: "hr_manager",
  RECRUITER: "recruiter",
  TEAM_MEMBER: "team_member",
  VIEWER: "viewer",
  CEO: "ceo", // legacy - treated as super_admin
  ADMIN: "admin", // legacy - treated as company_admin
  TEAM_LEAD: "team_lead", // legacy - treated as hr_manager
  EMPLOYEE: "employee", // legacy - treated as team_member
};

export const ROLE_LABELS = {
  super_admin: "Super Admin",
  company_admin: "Company Admin",
  hr_manager: "HR Manager",
  recruiter: "Recruiter",
  team_member: "Team Member",
  viewer: "Viewer",
  // legacy
  ceo: "CEO (Super Admin)",
  admin: "Admin (Company Admin)",
  team_lead: "Team Lead (HR Manager)",
  employee: "Employee (Team Member)",
};

// Canonical role order (lowest → highest)
export const ROLE_HIERARCHY = [
  "viewer",
  "team_member",
  "employee",     // legacy
  "recruiter",
  "team_lead",    // legacy
  "hr_manager",
  "admin",        // legacy
  "company_admin",
  "super_admin",
  "ceo",          // legacy top
];

export function getRoleLevel(role) {
  const idx = ROLE_HIERARCHY.indexOf(role);
  return idx < 0 ? 0 : idx;
}

export function hasRole(user, ...allowedRoles) {
  if (!user?.role) return false;
  return allowedRoles.includes(user.role);
}

export function isAtLeast(user, role) {
  if (!user?.role) return false;
  return getRoleLevel(user.role) >= getRoleLevel(role);
}

// Returns roles a user can assign (only roles strictly below their own level)
export function assignableRoles(userRole) {
  const level = getRoleLevel(userRole);
  return ROLE_HIERARCHY.filter(r => getRoleLevel(r) < level);
}

// The new canonical roles for display in admin UI
export const ASSIGNABLE_ROLE_LIST = [
  "viewer",
  "team_member",
  "recruiter",
  "hr_manager",
  "company_admin",
  "super_admin",
];

// ─── Permission matrix ────────────────────────────────────────────────────────
// All permissions are derived from role level — add new ones here without DB changes.

export const can = {
  // Navigation / module access
  viewDashboard: (u) => true,
  viewDataCenter: (u) => true,                    // ALL authenticated users
  viewRecruitment: (u) => isAtLeast(u, "recruiter"),
  viewRecruiterIQ: (u) => isAtLeast(u, "recruiter"),
  viewAnalytics: (u) => isAtLeast(u, "hr_manager") || isAtLeast(u, "team_lead"),
  viewCRM: (u) => isAtLeast(u, "recruiter"),
  viewCompanies: (u) => isAtLeast(u, "recruiter"),
  viewTeams: (u) => isAtLeast(u, "hr_manager") || isAtLeast(u, "team_lead"),
  viewTargets: (u) => isAtLeast(u, "recruiter"),
  viewRevenue: (u) => isAtLeast(u, "company_admin") || isAtLeast(u, "admin"),
  viewAttendance: (u) => true,

  // Data Centre permissions
  uploadFiles: (u) => true,                       // ALL roles can upload
  editFiles: (u) => isAtLeast(u, "recruiter"),    // Recruiter and above can edit/delete
  deleteFiles: (u) => isAtLeast(u, "recruiter"),

  // Admin capabilities
  manageUsers: (u) => isAtLeast(u, "company_admin") || isAtLeast(u, "super_admin") || isAtLeast(u, "admin") || isAtLeast(u, "ceo"),
  manageSettings: (u) => isAtLeast(u, "super_admin") || isAtLeast(u, "ceo"),
  viewOrgSettings: (u) => isAtLeast(u, "super_admin") || isAtLeast(u, "ceo"),
  approveUsers: (u) => isAtLeast(u, "company_admin") || isAtLeast(u, "super_admin") || isAtLeast(u, "admin") || isAtLeast(u, "ceo"),
  suspendUsers: (u) => isAtLeast(u, "company_admin") || isAtLeast(u, "super_admin") || isAtLeast(u, "admin") || isAtLeast(u, "ceo"),

  // Legacy
  manageAttendance: (u) => isAtLeast(u, "team_lead") || isAtLeast(u, "hr_manager"),
  isCEO: (u) => u?.role === "ceo" || u?.role === "super_admin",
};

// User account statuses
export const USER_STATUS = {
  PENDING: "pending_approval",
  ACTIVE: "active",
  SUSPENDED: "suspended",
};

export const USER_STATUS_LABELS = {
  pending_approval: "Pending Approval",
  active: "Active",
  suspended: "Suspended",
};