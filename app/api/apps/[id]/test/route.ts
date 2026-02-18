import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/auth-helpers";
import type { ApiResponse } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const app = await prisma.app.findUnique({ where: { id } });
    if (!app) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Uygulama bulunamadı" },
        { status: 404 }
      );
    }

    const existing = await prisma.testRequest.findUnique({
      where: { appId_userId: { appId: id, userId: context.userId } },
    });

    if (existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Zaten tester olarak kayıtlısınız" },
        { status: 400 }
      );
    }

    const testRequest = await prisma.testRequest.create({
      data: {
        appId: id,
        userId: context.userId,
      },
    });

    return NextResponse.json<ApiResponse>(
      { success: true, data: testRequest },
      { status: 201 }
    );
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existing = await prisma.testRequest.findUnique({
      where: { appId_userId: { appId: id, userId: context.userId } },
    });

    if (!existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Tester kaydı bulunamadı" },
        { status: 404 }
      );
    }

    await prisma.testRequest.delete({
      where: { appId_userId: { appId: id, userId: context.userId } },
    });

    return NextResponse.json<ApiResponse>({ success: true });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
