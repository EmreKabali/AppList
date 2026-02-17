import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { App, ApiResponse, PaginatedResponse } from "@/types";
import { APP_STATUS } from "@/lib/constants";

type AppStatus = typeof APP_STATUS[keyof typeof APP_STATUS];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");
  const offset = (page - 1) * limit;

  try {
    const supabase = await createClient();

    // Temporarily disable auth for testing
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) {
    //   return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
    // }

    let query = supabase.from("apps").select("*", { count: "exact" });

    if (status && Object.values(APP_STATUS).includes(status as AppStatus)) {
      query = query.eq("status", status);
    }

    const { data: apps, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

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
  } catch {
    return NextResponse.json<ApiResponse<PaginatedResponse<App>>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required fields: id, status" },
        { status: 400 }
      );
    }

    if (!Object.values(APP_STATUS).includes(status)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Temporarily disable auth for testing
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) {
    //   return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
    // }

    const { data, error } = await supabase
      .from("apps")
      .update({ status } as never)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({ success: true, data });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
