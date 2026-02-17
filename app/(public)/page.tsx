import { Header } from "@/components/header";
import { PublicAppsBoard } from "@/components/public-apps-board";

import { createClient } from "@/lib/supabase/server";

import type { App } from "@/types/database";

type ViewType = "live" | "active-test" | "expired-test";

export default async function HomePage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ filter?: string; view?: string; platform?: string }>;
}>) {
  const params = await searchParams;

  const initialView: ViewType =
    params.view === "active-test" || params.view === "expired-test" || params.view === "live"
      ? params.view
      : "live";

  const initialPlatformFilter =
    params.platform === "android" || params.platform === "ios" ? params.platform : null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("apps")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const apps: App[] = data ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">App Takip Paneli</h2>
          <p className="text-gray-600">Kartlara tıklayarak yayında ve test süreçlerini takip edin</p>
        </div>



        <PublicAppsBoard
          apps={apps}
          initialView={initialView}
          initialPlatformFilter={initialPlatformFilter}
        />
      </main>
    </div>
  );
}
