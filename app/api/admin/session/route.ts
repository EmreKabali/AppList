import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-helpers";
import type { ApiResponse } from "@/types";

interface AdminSessionResponse {
  email: string;
  role: string;
  name: string | null;
}

export async function GET() {
  const context = await getSessionContext();

  if (!context) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (context.role !== "admin" && context.role !== "super_admin") {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Bu hesap admin paneli için yetkili değil" },
      { status: 403 }
    );
  }

  return NextResponse.json<ApiResponse<AdminSessionResponse>>({
    success: true,
    data: {
      email: context.email,
      role: context.role,
      name: context.name,
    },
  });
}
