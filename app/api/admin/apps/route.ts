import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/auth-helpers";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { App } from "@prisma/client";
import { APP_STATUS } from "@/lib/constants";

type AppStatus = (typeof APP_STATUS)[keyof typeof APP_STATUS];
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
  const skip = (page - 1) * limit;

  try {
    const context = await getSessionContext();
    if (
      !context ||
      (context.role !== "admin" && context.role !== "super_admin")
    ) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const where: Record<string, unknown> = {};

    if (status && Object.values(APP_STATUS).includes(status as AppStatus)) {
      where.status = status;
    }

    if (submissionType && isValidSubmissionType(submissionType)) {
      where.submissionType = submissionType;
    }

    if (platform && isValidPlatform(platform)) {
      where.platform = platform;
    }

    if (q) {
      const normalizedQuery = q.replace(/,/g, " ");
      where.OR = [
        { name: { contains: normalizedQuery } },
        { description: { contains: normalizedQuery } },
      ];
    }

    const [apps, count] = await Promise.all([
      prisma.app.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          submissionType: true,
          platform: true,
          playUrl: true,
          testUrl: true,
          description: true,
          iconUrl: true,
          startDate: true,
          endDate: true,
          status: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { testRequests: true } },
        },
      }),
      prisma.app.count({ where }),
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
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await getSessionContext();
    if (
      !context ||
      (context.role !== "admin" && context.role !== "super_admin")
    ) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required field: id" },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!Object.values(APP_STATUS).includes(body.status as AppStatus)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Invalid status value" },
          { status: 400 },
        );
      }
      updates.status = body.status;
    }

    if (
      body.submissionType !== undefined ||
      body.submission_type !== undefined
    ) {
      const st = body.submissionType ?? body.submission_type;
      if (!isValidSubmissionType(st)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "submissionType must be live or test" },
          { status: 400 },
        );
      }
      updates.submissionType = st;
    }

    if (body.platform !== undefined) {
      if (body.platform !== null && !isValidPlatform(body.platform)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "platform must be android, ios, or null" },
          { status: 400 },
        );
      }
      updates.platform = body.platform;
    }

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "name cannot be empty" },
          { status: 400 },
        );
      }
      updates.name = body.name.trim();
    }

    const fieldMap: Record<string, string> = {
      playUrl: "playUrl",
      play_url: "playUrl",
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
            { status: 400 },
          );
        }
        updates[prismaKey] = body[bodyKey];
      }
    }

    if (
      updates.submissionType === "test" &&
      Object.prototype.hasOwnProperty.call(updates, "platform") &&
      updates.platform !== null
    ) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "test submissionType cannot have a platform" },
        { status: 400 },
      );
    }

    if (
      updates.submissionType === "test" &&
      !Object.prototype.hasOwnProperty.call(updates, "platform")
    ) {
      updates.platform = null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "No updatable fields were provided" },
        { status: 400 },
      );
    }

    const data = await prisma.app.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json<ApiResponse>({ success: true, data });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await getSessionContext();
    if (
      !context ||
      (context.role !== "admin" && context.role !== "super_admin")
    ) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required query param: id" },
        { status: 400 },
      );
    }

    await prisma.app.delete({ where: { id } });

    return NextResponse.json<ApiResponse>({ success: true });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
