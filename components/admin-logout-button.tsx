"use client";

import { signOut } from "next-auth/react";

interface AdminLogoutButtonProps {
  className?: string;
}

export function AdminLogoutButton({ className }: AdminLogoutButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={className}
    >
      Çıkış
    </button>
  );
}
