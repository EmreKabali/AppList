import { NextResponse } from "next/server";
import { getAdminSessionContext } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

interface AdminSessionResponse {
  email: string;
  role: "admin" | "super_admin";
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const adminContext = await getAdminSessionContext();
  if (!adminContext) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Bu hesap admin paneli için yetkili değil" },
      { status: 403 }
    );
  }

  return NextResponse.json<ApiResponse<AdminSessionResponse>>({
    success: true,
    data: {
      email: adminContext.email,
      role: adminContext.role,
    },
  });
}
