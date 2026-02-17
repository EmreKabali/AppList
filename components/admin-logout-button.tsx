"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AdminLogoutButtonProps {
  className?: string;
}

export function AdminLogoutButton({ className }: AdminLogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={className}
    >
      Çıkış
    </button>
  );
}
