export type {
  User,
  App,
  TestRequest,
} from "@prisma/client";

export type UserRole = "user" | "admin" | "super_admin";
export type SubmissionType = "test" | "live";
export type Platform = "android" | "ios";
export type AppStatus = "pending" | "approved" | "rejected";
