import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { AdminUser } from "@/types/database";

export type AdminRole = "admin" | "super_admin";

export interface AdminSessionContext {
  userId: string;
  email: string;
  role: AdminRole;
}

export async function getAdminSessionContext(): Promise<AdminSessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id || !user.email) {
    return null;
  }

  const serviceClient = createServiceClient();
  const { data: adminUserRow, error: adminError } = await serviceClient
    .from("admin_users")
    .select("role")
    .ilike("email", user.email)
    .maybeSingle();

  const adminUser = adminUserRow as Pick<AdminUser, "role"> | null;

  if (adminError) {
    return null;
  }

  if (!adminUser?.role) {
    const { count, error: adminCountError } = await serviceClient
      .from("admin_users")
      .select("id", { count: "exact", head: true });

    if (adminCountError) {
      return null;
    }

    if ((count ?? 0) === 0) {
      const { error: bootstrapError } = await serviceClient.from("admin_users").insert({
        email: user.email,
        password_hash: "",
        role: "super_admin",
        created_by: user.id,
      } as never);

      if (bootstrapError) {
        return null;
      }

      return {
        userId: user.id,
        email: user.email,
        role: "super_admin",
      };
    }

    return null;
  }

  if (adminUser.role !== "admin" && adminUser.role !== "super_admin") {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    role: adminUser.role,
  };
}
