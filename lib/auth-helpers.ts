import { auth } from "@/lib/auth";

export interface SessionContext {
  userId: string;
  email: string;
  name: string | null;
  role: string;
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return null;
  }

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    role: session.user.role,
  };
}

export async function requireAuth(): Promise<SessionContext> {
  const context = await getSessionContext();
  if (!context) {
    throw new Error("Unauthorized");
  }
  return context;
}

export async function requireAdmin(): Promise<SessionContext> {
  const context = await getSessionContext();
  if (!context || (context.role !== "admin" && context.role !== "super_admin")) {
    throw new Error("Forbidden");
  }
  return context;
}

export async function requireSuperAdmin(): Promise<SessionContext> {
  const context = await getSessionContext();
  if (!context || context.role !== "super_admin") {
    throw new Error("Forbidden");
  }
  return context;
}
