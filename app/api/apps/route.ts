import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { App, ApiResponse, PaginatedResponse } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  try {
    const supabase = await createClient();

    const [{ data: apps, error }, { count }] = await Promise.all([
      supabase
        .from("apps")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1),
      supabase.from("apps").select("*", { count: "exact", head: true }).eq("status", "approved"),
    ]);

    if (error) {
      return NextResponse.json<ApiResponse<PaginatedResponse<App>>>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<PaginatedResponse<App>>>({
      success: true,
      data: {
        data: (apps || []) as App[],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<PaginatedResponse<App>>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
