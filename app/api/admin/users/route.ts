import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { AdminUser, ApiResponse, PaginatedResponse } from "@/types";
import { ADMIN_ROLES } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  try {
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

    return NextResponse.json<PaginatedResponse<Omit<AdminUser, "password_hash">>>({
      data: users as Omit<AdminUser, "password_hash">[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
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
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: authError?.message || "Failed to create user" },
        { status: 400 }
      );
    }

    // Create admin_users record
    const { data, error } = await supabase
      .from("admin_users")
      .insert({
        email,
        password_hash: "", // Auth handled by Supabase
        role: role || ADMIN_ROLES.SUB_ADMIN,
        created_by: authData.user.id,
      } as never)
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
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required parameter: id" },
        { status: 400 }
      );
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
