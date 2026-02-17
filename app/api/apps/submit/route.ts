import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";
import { APP_STATUS } from "@/lib/constants";
import { generateEndDate } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { name, play_url, test_url, start_date, created_by } = body;

    if (!name || !play_url || !start_date) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required fields: name, play_url, start_date" },
        { status: 400 }
      );
    }

    const end_date = generateEndDate(start_date);

    const { data, error } = await supabase
      .from("apps")
      .insert({
        name,
        play_url,
        test_url: test_url || null,
        start_date,
        end_date,
        status: APP_STATUS.PENDING,
        created_by: created_by || "Anonymous",
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
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
