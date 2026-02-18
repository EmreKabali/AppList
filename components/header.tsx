"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "./ui/button";

export function Header() {
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "super_admin";

  return (
    <header className="bg-white/70 border-b border-gray-200/50 sticky top-0 z-50 backdrop-blur-xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center group transition-transform hover:scale-105">
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">AppList</h1>
          </Link>

          <nav className="flex items-center space-x-3">
            {session?.user && (
              <Link href="/submit">
                <Button variant="primary" className="shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5 active:translate-y-0">App Gonder</Button>
              </Link>
            )}

            {session?.user ? (
              <>
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="outline" className="hover:bg-gray-50 transition-colors">Admin</Button>
                  </Link>
                )}
                <Link href="/dashboard">
                  <Button variant="outline" className="hover:bg-gray-50 transition-colors">Dashboard</Button>
                </Link>
                <Button
                  variant="outline"
                  className="hover:bg-gray-50 transition-colors"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Cikis
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" className="hover:bg-gray-50 transition-colors">Giris</Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" className="hover:bg-gray-50 transition-colors">Kayit Ol</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
