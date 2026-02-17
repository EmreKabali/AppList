"use client";

import Link from "next/link";
import { Button } from "./ui/button";


export function Header() {
  return (
    <header className="bg-white/70 border-b border-gray-200/50 sticky top-0 z-50 backdrop-blur-xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center group transition-transform hover:scale-105">
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">AppList</h1>
          </Link>

          <nav className="flex items-center space-x-3">
            <Link href="/submit">
              <Button variant="primary" className="shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5 active:translate-y-0">App Gonder</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="hover:bg-gray-50 transition-colors">Admin</Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
