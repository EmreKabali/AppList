import { Suspense } from "react";
import { Header } from "@/components/header";
import { FilterTabs } from "@/components/filter-tabs";
import { AppCard } from "@/components/app-card";
import { StatsCard } from "@/components/stats-card";
import { createClient } from "@/lib/supabase/server";
import type { App } from "@/types/database";

function FilterLoading() {
  return <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter || "all";

  // Direct Supabase query instead of API fetch
  const supabase = await createClient();
  const { data: apps = [] } = await supabase
    .from("apps")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const now = Date.now();
  const oneDayMs = 1000 * 60 * 60 * 24;

  const filteredApps = apps.filter((app) => {
    if (filter === "all") return true;
    if (filter === "active") return app.status === "approved";
    if (filter === "approved") return app.status === "approved";
    if (filter === "expiring") {
      if (!app.end_date || app.status !== "approved") return false;
      const days = Math.ceil((new Date(app.end_date).getTime() - now) / oneDayMs);
      return days >= 0 && days <= 5;
    }
    return true;
  });

  const stats = {
    total: apps.length,
    active: apps.filter((a) => a.status === "approved").length,
    expiring: apps.filter((a) => {
      if (!a.end_date || a.status !== "approved") return false;
      const days = Math.ceil((new Date(a.end_date).getTime() - now) / oneDayMs);
      return days >= 0 && days <= 5;
    }).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">App Takip Paneli</h2>
          <p className="text-gray-600">Tum uygulamalarinizi tek yerden yonetin</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard value={stats.total} label="Toplam App" />
          <StatsCard value={stats.active} label="Aktif" />
          <StatsCard value={stats.expiring} label="Yakinda Bitecek" />
        </div>

        <div className="mb-6">
          <Suspense fallback={<FilterLoading />}>
            <FilterTabs />
          </Suspense>
        </div>

        {filteredApps.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {filter === "all" ? "Henuz app bulunmuyor." : "Bu filtreleme icin app bulunmuyor."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
