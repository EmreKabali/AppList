import Link from "next/link";
import { Button } from "./ui/button";

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <h1 className="text-xl font-bold text-indigo-600">AppList</h1>
          </Link>

          <nav className="flex items-center space-x-4">
            <Link href="/submit">
              <Button variant="primary">App Gonder</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">Admin</Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
