import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/auth-helpers";
import type { ApiResponse } from "@/types";
import { APP_STATUS } from "@/lib/constants";

function isValidPlatform(value: unknown): value is "android" | "ios" {
  return value === "android" || value === "ios";
}

export async function POST(request: Request) {
  try {
    const session = await getSessionContext();
    const body = await request.json();

    const {
      submission_type,
      submissionType: submissionTypeAlt,
      platform,
      name,
      play_url,
      playUrl: playUrlAlt,
      test_url,
      testUrl: testUrlAlt,
      description,
      icon_url,
      iconUrl: iconUrlAlt,
      start_date,
      startDate: startDateAlt,
      end_date,
      endDate: endDateAlt,
    } = body;

    const subType = submission_type ?? submissionTypeAlt;
    const playUrlVal = play_url ?? playUrlAlt;
    const testUrlVal = test_url ?? testUrlAlt;
    const iconUrlVal = icon_url ?? iconUrlAlt;
    const startDateVal = start_date ?? startDateAlt;
    const endDateVal = end_date ?? endDateAlt;

    if (!name || !subType) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required fields: name, submission_type" },
        { status: 400 }
      );
    }

    if (subType !== "live" && subType !== "test") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "submission_type must be live or test" },
        { status: 400 }
      );
    }

    if (!isValidPlatform(platform)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Missing required field: platform (android or ios)",
        },
        { status: 400 }
      );
    }

    if (!testUrlVal || !iconUrlVal) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required fields: test_url, icon_url" },
        { status: 400 }
      );
    }

    // If user is authenticated, use their ID. Otherwise create as anonymous.
    let creatorId = session?.userId;

    if (!creatorId) {
      // Create or get anonymous user for unauthenticated submissions
      let anonUser = await prisma.user.findUnique({
        where: { email: "anonymous@applist.com" },
      });
      if (!anonUser) {
        anonUser = await prisma.user.create({
          data: {
            email: "anonymous@applist.com",
            name: "Anonymous",
            password: "",
            role: "user",
          },
        });
      }
      creatorId = anonUser.id;
    }

    const data = await prisma.app.create({
      data: {
        name,
        submissionType: subType,
        platform,
        playUrl: subType === "live" ? (playUrlVal ?? testUrlVal) : null,
        testUrl: testUrlVal,
        description: description ?? null,
        iconUrl: iconUrlVal || null,
        startDate: startDateVal ?? null,
        endDate: endDateVal ?? null,
        status: subType === "test" ? APP_STATUS.APPROVED : APP_STATUS.PENDING,
        createdBy: creatorId,
      },
    });

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
