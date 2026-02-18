import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/auth-helpers";
import type { ApiResponse } from "@/types";

export async function GET() {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const testRequests = await prisma.testRequest.findMany({
      where: { userId: context.userId },
      orderBy: { createdAt: "desc" },
      include: {
        app: true,
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: testRequests,
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
