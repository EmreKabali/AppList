import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminSessionContext } from "@/lib/admin-auth";
import type { App, ApiResponse, PaginatedResponse } from "@/types";
import { APP_STATUS } from "@/lib/constants";

type AppStatus = typeof APP_STATUS[keyof typeof APP_STATUS];

type SubmissionType = "live" | "test";
type PlatformType = "android" | "ios";

function isValidSubmissionType(value: unknown): value is SubmissionType {
  return value === "live" || value === "test";
}

function isValidPlatform(value: unknown): value is PlatformType {
  return value === "android" || value === "ios";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();
  const submissionType = searchParams.get("submission_type");
  const platform = searchParams.get("platform");
  const normalizedQuery = q?.replace(/,/g, " ");
  const offset = (page - 1) * limit;

  try {
    const adminContext = await getAdminSessionContext();
    if (!adminContext) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    let query = supabase.from("apps").select("*", { count: "exact" });

    if (status && Object.values(APP_STATUS).includes(status as AppStatus)) {
      query = query.eq("status", status);
    }

    if (submissionType && isValidSubmissionType(submissionType)) {
      query = query.eq("submission_type", submissionType);
    }

    if (platform && isValidPlatform(platform)) {
      query = query.eq("platform", platform);
    }

    if (normalizedQuery) {
      query = query.or(`name.ilike.%${normalizedQuery}%,description.ilike.%${normalizedQuery}%`);
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
    const adminContext = await getAdminSessionContext();
    if (!adminContext) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const body = await request.json();

    const { id } = body;

    if (!id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!Object.values(APP_STATUS).includes(body.status as AppStatus)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Invalid status value" },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    if (body.submission_type !== undefined) {
      if (!isValidSubmissionType(body.submission_type)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "submission_type must be live or test" },
          { status: 400 }
        );
      }
      updates.submission_type = body.submission_type;
    }

    if (body.platform !== undefined) {
      if (body.platform !== null && !isValidPlatform(body.platform)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "platform must be android, ios, or null" },
          { status: 400 }
        );
      }
      updates.platform = body.platform;
    }

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "name cannot be empty" },
          { status: 400 }
        );
      }
      updates.name = body.name.trim();
    }

    const optionalTextFields = ["play_url", "description", "icon_url", "start_date", "end_date"] as const;
    for (const field of optionalTextFields) {
      if (body[field] !== undefined) {
        if (body[field] !== null && typeof body[field] !== "string") {
          return NextResponse.json<ApiResponse>(
            { success: false, error: `${field} must be string or null` },
            { status: 400 }
          );
        }
        updates[field] = body[field];
      }
    }

    if (
      updates.submission_type === "test" &&
      Object.prototype.hasOwnProperty.call(updates, "platform") &&
      updates.platform !== null
    ) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "test submission_type cannot have a platform" },
        { status: 400 }
      );
    }

    if (
      updates.submission_type === "test" &&
      !Object.prototype.hasOwnProperty.call(updates, "platform")
    ) {
      updates.platform = null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "No updatable fields were provided" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("apps")
      .update(updates as never)
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

export async function DELETE(request: Request) {
  try {
    const adminContext = await getAdminSessionContext();
    if (!adminContext) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required query param: id" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("apps").delete().eq("id", id);

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
