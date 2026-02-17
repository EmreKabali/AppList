export const APP_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export const ADMIN_ROLES = {
  SUPER_ADMIN: "super_admin",
  SUB_ADMIN: "sub_admin",
} as const;

export const APP_LISTING_DURATION_DAYS = 14;

export const ROUTES = {
  HOME: "/",
  ADMIN: "/admin",
  ADMIN_APPS: "/admin/apps",
  ADMIN_USERS: "/admin/users",
  LOGIN: "/login",
  SUBMIT: "/submit",
} as const;
