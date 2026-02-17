import { NextResponse } from "next/server";
import { getAdminSessionContext } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import type { AdminUser, ApiResponse, PaginatedResponse } from "@/types";
import { ADMIN_ROLES } from "@/lib/constants";

type AdminUsersResponse = PaginatedResponse<Omit<AdminUser, "password_hash">> & {
  currentRole: "admin" | "super_admin";
};

function unauthorizedResponse() {
  return NextResponse.json<ApiResponse>(
    { success: false, error: "Unauthorized" },
    { status: 401 }
  );
}

function forbiddenResponse() {
  return NextResponse.json<ApiResponse>(
    { success: false, error: "Forbidden" },
    { status: 403 }
  );
}

async function hasAuthUserIdColumn(
  supabase: ReturnType<typeof createServiceClient>
): Promise<boolean> {
  const { data, error } = await supabase
    .from("information_schema.columns")
    .select("column_name")
    .eq("table_schema", "public")
    .eq("table_name", "admin_users")
    .eq("column_name", "auth_user_id")
    .maybeSingle();

  if (error) {
    return false;
  }

  const column = data as { column_name?: string } | null;
  return Boolean(column?.column_name);
}

async function resolveAuthUserIdByEmail(
  email: string,
  supabase: ReturnType<typeof createServiceClient>
): Promise<string | null> {
  const perPage = 200;
  let page = 1;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      return null;
    }

    const matchedUser = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (matchedUser?.id) {
      return matchedUser.id;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }

  return null;
}

function isAuthUserMissing(errorMessage: string) {
  const message = errorMessage.toLowerCase();
  return message.includes("not found") || message.includes("no rows");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  try {
    const adminContext = await getAdminSessionContext();
    if (!adminContext) {
      return unauthorizedResponse();
    }

    const supabase = createServiceClient();

    const { data: users, error, count } = await supabase
      .from("admin_users")
      .select("id, email, role, created_at, created_by", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<AdminUsersResponse>>({
      success: true,
      data: {
        data: users as Omit<AdminUser, "password_hash">[],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        currentRole: adminContext.role,
      },
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const adminContext = await getAdminSessionContext();
    if (!adminContext) {
      return unauthorizedResponse();
    }

    if (adminContext.role !== ADMIN_ROLES.SUPER_ADMIN) {
      return forbiddenResponse();
    }

    const supabase = createServiceClient();
    const body = await request.json();

    const { email, password, role } = body;

    if (!email || !password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required fields: email, password" },
        { status: 400 }
      );
    }

    if (role && !Object.values(ADMIN_ROLES).includes(role)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid role value" },
        { status: 400 }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: authError?.message || "Failed to create user" },
        { status: 400 }
      );
    }

    const supportsAuthUserId = await hasAuthUserIdColumn(supabase);
    const adminUserInsertPayload: Record<string, string> = {
      email,
      password_hash: "", // Auth handled by Supabase
      role: role || ADMIN_ROLES.ADMIN,
      created_by: adminContext.userId,
    };

    if (supportsAuthUserId) {
      adminUserInsertPayload.auth_user_id = authData.user.id;
    }

    // Create admin_users record
    const { data, error } = await supabase
      .from("admin_users")
      .insert(adminUserInsertPayload as never)
      .select()
      .single();

    if (error) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true, data },
      { status: 201 }
    );
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const adminContext = await getAdminSessionContext();
    if (!adminContext) {
      return unauthorizedResponse();
    }

    if (adminContext.role !== ADMIN_ROLES.SUPER_ADMIN) {
      return forbiddenResponse();
    }

    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required parameter: id" },
        { status: 400 }
      );
    }

    const supportsAuthUserId = await hasAuthUserIdColumn(supabase);
    const selectColumns = supportsAuthUserId ? "id,auth_user_id,email" : "id,email";

    const { data: targetAdminRow, error: targetAdminError } = await supabase
      .from("admin_users")
      .select(selectColumns)
      .eq("id", id)
      .maybeSingle();

    const targetAdmin = targetAdminRow as
      | Pick<AdminUser, "id" | "email"> & { auth_user_id?: string | null }
      | null;

    if (targetAdminError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: targetAdminError.message },
        { status: 500 }
      );
    }

    if (!targetAdmin) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (targetAdmin.email === adminContext.email) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "You cannot delete your own admin account" },
        { status: 400 }
      );
    }

    const authUserId = targetAdmin.auth_user_id ?? (await resolveAuthUserIdByEmail(targetAdmin.email, supabase));

    if (authUserId) {
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(authUserId);
      if (deleteAuthError && !isAuthUserMissing(deleteAuthError.message)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: deleteAuthError.message },
          { status: 500 }
        );
      }
    }

    const { error } = await supabase.from("admin_users").delete().eq("id", id);

    if (error) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({ success: true });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
