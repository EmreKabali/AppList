import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";
import type { ApiResponse } from "@/types";

export async function POST(request: Request) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Mevcut şifre ve yeni şifre gereklidir" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Yeni şifre en az 8 karakter olmalıdır" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: context.userId },
    });

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Mevcut şifre hatalı" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: context.userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: "Şifreniz güncellendi" },
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
