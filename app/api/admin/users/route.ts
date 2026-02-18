import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { User } from "@prisma/client";

type SafeUser = Omit<User, "password">;

type UsersResponse = PaginatedResponse<SafeUser> & {
  currentRole: string;
};

function unauthorizedResponse() {
  return NextResponse.json<ApiResponse>(
    { success: false, error: "Unauthorized" },
    { status: 401 }
  );
}

function forbiddenResponse() {
  return NextResponse.json<ApiResponse>(
    { success: false, error: "Forbidden" },
    { status: 403 }
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const roleFilter = searchParams.get("role");
  const skip = (page - 1) * limit;

  try {
    const context = await getSessionContext();
    if (!context || (context.role !== "admin" && context.role !== "super_admin")) {
      return unauthorizedResponse();
    }

    const where: Record<string, unknown> = {};
    if (roleFilter && ["user", "admin", "super_admin"].includes(roleFilter)) {
      where.role = roleFilter;
    }

    const [users, count] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json<ApiResponse<UsersResponse>>({
      success: true,
      data: {
        data: users as unknown as SafeUser[],
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        currentRole: context.role,
      },
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await getSessionContext();
    if (!context || context.role !== "super_admin") {
      return context ? forbiddenResponse() : unauthorizedResponse();
    }

    const body = await request.json();
    const { email, password, role, name } = body;

    if (!email || !password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required fields: email, password" },
        { status: 400 }
      );
    }

    const validRoles = ["user", "admin", "super_admin"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid role value" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Bu e-posta adresi zaten kayıtlı" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
        role: role || "admin",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json<ApiResponse>(
      { success: true, data: user },
      { status: 201 }
    );
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await getSessionContext();
    if (!context || context.role !== "super_admin") {
      return context ? forbiddenResponse() : unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required parameter: id" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (targetUser.email === context.email) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Kendi hesabınızı silemezsiniz" },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json<ApiResponse>({ success: true });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
