import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";
import { APP_STATUS } from "@/lib/constants";
import { generateEndDate } from "@/lib/utils";

function isSchemaCacheColumnError(message: string): boolean {
  return (
    message.includes("schema cache") &&
    (message.includes("description") ||
      message.includes("icon_url") ||
      message.includes("submission_type") ||
      message.includes("platform"))
  );
}

function isValidPlatform(value: unknown): value is "android" | "ios" {
  return value === "android" || value === "ios";
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      submission_type,
      platform,
      name,
      play_url,
      description,
      icon_url,
      start_date,
      end_date,
      created_by,
    } = body;

    if (!name || !submission_type) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required fields: name, submission_type" },
        { status: 400 }
      );
    }

    if (submission_type !== "live" && submission_type !== "test") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "submission_type must be live or test" },
        { status: 400 }
      );
    }

    if (submission_type === "live" && (!play_url || !description || !icon_url)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Missing required fields for live: play_url, description, icon_url",
        },
        { status: 400 }
      );
    }

    if (submission_type === "live" && !isValidPlatform(platform)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required field for live: platform (android or ios)" },
        { status: 400 }
      );
    }

    if (submission_type === "test" && (!start_date || !end_date || !icon_url)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Missing required fields for test: start_date, end_date, icon_url",
        },
        { status: 400 }
      );
    }

    if (
      submission_type === "test" &&
      typeof start_date === "string" &&
      typeof end_date === "string" &&
      end_date < start_date
    ) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "end_date cannot be earlier than start_date" },
        { status: 400 }
      );
    }

    const fallbackEndDate =
      submission_type === "test" && typeof start_date === "string" ? generateEndDate(start_date) : null;

    const insertPayload = {
      name,
      submission_type,
      platform: submission_type === "live" ? platform : null,
      play_url: submission_type === "live" ? play_url : null,
      test_url: null,
      description: submission_type === "live" ? description : null,
      icon_url: icon_url || null,
      start_date: submission_type === "test" ? start_date : null,
      end_date: submission_type === "test" ? end_date || fallbackEndDate : null,
      status: APP_STATUS.PENDING,
      created_by: created_by || "Anonymous",
    };

    const { data, error } = await supabase
      .from("apps")
      .insert(insertPayload as never)
      .select()
      .single();

    if (error && isSchemaCacheColumnError(error.message)) {
      const legacyPayload = {
        name,
        play_url: submission_type === "live" ? play_url : null,
        test_url: null,
        start_date: submission_type === "test" ? start_date : null,
        end_date: submission_type === "test" ? end_date || fallbackEndDate : null,
        status: APP_STATUS.PENDING,
        created_by: created_by || "Anonymous",
      };

      const { data: legacyData, error: legacyError } = await supabase
        .from("apps")
        .insert(legacyPayload as never)
        .select()
        .single();

      if (legacyError) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: `${legacyError.message}. Migration gerekli: supabase/migrations/004_submission_fields.sql`,
          },
          { status: 500 }
        );
      }

      return NextResponse.json<ApiResponse>(
        { success: true, data: legacyData },
        { status: 201 }
      );
    }

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
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
