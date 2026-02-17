import { redirect } from "next/navigation";
import { StatsCard } from "@/components/stats-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { APP_STATUS } from "@/lib/constants";
import type { App } from "@/types/database";

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  approved: "Onaylandi",
  rejected: "Reddedildi",
};

const statusVariants: Record<string, "default" | "success" | "warning" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Temporarily disable auth check for testing
  // if (!user) {
  //   redirect("/login");
  // }

  // Direct Supabase query instead of API fetch
  const { data: apps = [] } = await supabase
    .from("apps")
    .select("*")
    .order("created_at", { ascending: false });

  const stats = {
    total: apps.length,
    pending: apps.filter((a) => a.status === APP_STATUS.PENDING).length,
    approved: apps.filter((a) => a.status === APP_STATUS.APPROVED).length,
    rejected: apps.filter((a) => a.status === APP_STATUS.REJECTED).length,
  };

  const recentApps = apps.slice(0, 5);
  const expiringApps = apps
    .filter((a) => {
      if (!a.end_date || a.status !== APP_STATUS.APPROVED) return false;
      const days = Math.ceil((new Date(a.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 5;
    })
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="text-xl font-bold text-indigo-600">AppList</a>
            <nav className="flex items-center space-x-4">
              <a href="/admin" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</a>
              <a href="/admin/apps" className="text-sm text-gray-600 hover:text-gray-900">Apps</a>
              <a href="/admin/users" className="text-sm text-gray-600 hover:text-gray-900">Users</a>
              <a href="/" className="text-sm text-indigo-600 hover:text-indigo-800">Cikis</a>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Genel bakis ve istatistikler</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard value={stats.total} label="Toplam App" />
          <StatsCard value={stats.pending} label="Bekleyen" />
          <StatsCard value={stats.approved} label="Onaylanan" />
          <StatsCard value={stats.rejected} label="Reddedilen" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Son App Basvurulari</CardTitle>
            </CardHeader>
            <CardContent>
              {recentApps.length === 0 ? (
                <p className="text-gray-500 text-sm">Basvuru bulunmuyor</p>
              ) : (
                <div className="space-y-3">
                  {recentApps.map((app) => (
                    <div key={app.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{app.name}</span>
                      <Badge variant={statusVariants[app.status] || "default"}>
                        {statusLabels[app.status] || app.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yakinda Bitecek Uygulamalar</CardTitle>
            </CardHeader>
            <CardContent>
              {expiringApps.length === 0 ? (
                <p className="text-gray-500 text-sm">Yakinda bitecek uygulama yok</p>
              ) : (
                <div className="space-y-3">
                  {expiringApps.map((app) => (
                    <div key={app.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{app.name}</span>
                      <span className="text-xs text-gray-500">
                        {app.end_date ? new Date(app.end_date).toLocaleDateString("tr-TR") : "-"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
