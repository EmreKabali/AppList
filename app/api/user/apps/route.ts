import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/auth-helpers";
import type { ApiResponse } from "@/types";

function isSubmissionType(value: unknown): value is "live" | "test" {
  return value === "live" || value === "test";
}

function isPlatform(value: unknown): value is "android" | "ios" {
  return value === "android" || value === "ios";
}

export async function GET() {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const apps = await prisma.app.findMany({
      where: { createdBy: context.userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { testRequests: true } },
        testRequests: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: apps,
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const existingApp = await prisma.app.findFirst({
      where: { id, createdBy: context.userId },
      select: { id: true },
    });

    if (!existingApp) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Uygulama bulunamadı" },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "name cannot be empty" },
          { status: 400 }
        );
      }
      updates.name = body.name.trim();
    }

    if (body.submissionType !== undefined || body.submission_type !== undefined) {
      const submissionType = body.submissionType ?? body.submission_type;
      if (!isSubmissionType(submissionType)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "submissionType must be live or test" },
          { status: 400 }
        );
      }
      updates.submissionType = submissionType;
    }

    if (body.platform !== undefined) {
      if (body.platform !== null && !isPlatform(body.platform)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "platform must be android, ios, or null" },
          { status: 400 }
        );
      }
      updates.platform = body.platform;
    }

    const fieldMap: Record<string, string> = {
      playUrl: "playUrl",
      play_url: "playUrl",
      testUrl: "testUrl",
      test_url: "testUrl",
      description: "description",
      iconUrl: "iconUrl",
      icon_url: "iconUrl",
      startDate: "startDate",
      start_date: "startDate",
      endDate: "endDate",
      end_date: "endDate",
    };

    for (const [bodyKey, prismaKey] of Object.entries(fieldMap)) {
      if (body[bodyKey] !== undefined) {
        if (body[bodyKey] !== null && typeof body[bodyKey] !== "string") {
          return NextResponse.json<ApiResponse>(
            { success: false, error: `${bodyKey} must be string or null` },
            { status: 400 }
          );
        }
        updates[prismaKey] = body[bodyKey];
      }
    }

    const nextSubmissionType =
      (updates.submissionType as "live" | "test" | undefined) ?? undefined;

    if (nextSubmissionType === "test") {
      updates.platform = null;
      updates.playUrl = null;
    }

    if (
      nextSubmissionType === "live" &&
      Object.prototype.hasOwnProperty.call(updates, "platform") &&
      updates.platform === null
    ) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "live submissionType için platform zorunludur" },
        { status: 400 }
      );
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "No updatable fields were provided" },
        { status: 400 }
      );
    }

    const updated = await prisma.app.update({
      where: { id },
      data: updates,
      include: {
        _count: { select: { testRequests: true } },
        testRequests: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json<ApiResponse>({ success: true, data: updated });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
