import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { App, ApiResponse, PaginatedResponse } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  try {
    const visibilityFilter: Prisma.AppWhereInput = {
      OR: [
        { status: "approved" },
        { submissionType: "test" },
      ],
    };

    const [apps, count] = await Promise.all([
      prisma.app.findMany({
        where: visibilityFilter,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          _count: { select: { testRequests: true } },
        },
      }),
      prisma.app.count({ where: visibilityFilter }),
    ]);

    return NextResponse.json<ApiResponse<PaginatedResponse<App>>>({
      success: true,
      data: {
        data: apps as unknown as App[],
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
