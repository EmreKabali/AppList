import Link from "next/link";
import { AdminAppsBoard } from "@/components/admin-apps-board";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { StatsCard } from "@/components/stats-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getAdminSessionContext } from "@/lib/admin-auth";
import { APP_STATUS } from "@/lib/constants";
import type { App } from "@/types/database";
import { redirect } from "next/navigation";

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

const statusVariants: Record<string, "default" | "success" | "warning" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

const submissionTypeLabels: Record<App["submission_type"], string> = {
  live: "Yayında",
  test: "Test",
};

export default async function AdminDashboardPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ q?: string }>;
}>) {
  const adminContext = await getAdminSessionContext();
  if (!adminContext) {
    redirect("/login");
  }

  const params = await searchParams;
  const supabase = await createClient();
  const query = (params.q ?? "").trim();
  const escapedQuery = query.replaceAll(",", " ");
  const todayIso = new Date().toISOString().slice(0, 10);
  const expiringLimit = new Date();
  expiringLimit.setDate(expiringLimit.getDate() + 5);
  const expiringLimitIso = expiringLimit.toISOString().slice(0, 10);

  let recentAppsQuery = supabase
    .from("apps")
    .select("id,name,submission_type,status")
    .order("created_at", { ascending: false })
    .limit(5);

  let expiringAppsQuery = supabase
    .from("apps")
    .select("id,name,end_date")
    .eq("status", APP_STATUS.APPROVED)
    .not("end_date", "is", null)
    .gte("end_date", todayIso)
    .lte("end_date", expiringLimitIso)
    .order("end_date", { ascending: true })
    .limit(5);

  if (escapedQuery) {
    recentAppsQuery = recentAppsQuery.ilike("name", `%${escapedQuery}%`);
    expiringAppsQuery = expiringAppsQuery.ilike("name", `%${escapedQuery}%`);
  }

  const [
    totalResult,
    pendingResult,
    approvedResult,
    rejectedResult,
    approvedAppsResult,
    recentResult,
    expiringResult,
  ] = await Promise.all([
    supabase.from("apps").select("id", { count: "exact", head: true }),
    supabase.from("apps").select("id", { count: "exact", head: true }).eq("status", APP_STATUS.PENDING),
    supabase.from("apps").select("id", { count: "exact", head: true }).eq("status", APP_STATUS.APPROVED),
    supabase.from("apps").select("id", { count: "exact", head: true }).eq("status", APP_STATUS.REJECTED),
    supabase
      .from("apps")
      .select("id,name,description,icon_url,submission_type,status,platform,play_url,test_url,start_date,end_date")
      .eq("status", APP_STATUS.APPROVED)
      .or(escapedQuery ? `name.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%` : "id.not.is.null")
      .order("created_at", { ascending: false }),
    recentAppsQuery,
    expiringAppsQuery,
  ]);

  if (approvedAppsResult.error) {
    throw new Error(approvedAppsResult.error.message);
  }

  if (recentResult.error) {
    throw new Error(recentResult.error.message);
  }

  if (expiringResult.error) {
    throw new Error(expiringResult.error.message);
  }

  const stats = {
    total: totalResult.count ?? 0,
    pending: pendingResult.count ?? 0,
    approved: approvedResult.count ?? 0,
    rejected: rejectedResult.count ?? 0,
  };

  const recentApps: Pick<App, "id" | "name" | "submission_type" | "status">[] = recentResult.data ?? [];
  const expiringApps: Pick<App, "id" | "name" | "end_date">[] = expiringResult.data ?? [];
  const approvedApps: App[] = approvedAppsResult.data ?? [];

  const adminAppsBase = new URLSearchParams();
  if (query) {
    adminAppsBase.set("q", query);
  }

  const getAppsHref = (status?: "pending" | "approved" | "rejected") => {
    const qs = new URLSearchParams(adminAppsBase.toString());
    if (status) {
      qs.set("status", status);
    }
    const queryString = qs.toString();
    return queryString ? `/admin/apps?${queryString}` : "/admin/apps";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-indigo-600">AppList</Link>
            <nav className="flex items-center space-x-4">
              <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">Panel</Link>
              <Link href="/admin/apps" className="text-sm text-gray-600 hover:text-gray-900">Uygulamalar</Link>
              <Link href="/admin/users" className="text-sm text-gray-600 hover:text-gray-900">Kullanıcılar</Link>
              <AdminLogoutButton className="text-sm text-indigo-600 hover:text-indigo-800" />
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Paneli</h1>
          <p className="text-gray-600 mt-1">Genel bakış ve istatistikler</p>

          <form method="GET" className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
            <div className="w-full md:max-w-md">
              <label htmlFor="dashboard-search" className="block text-sm font-medium text-gray-700 mb-1.5">
                Arama
              </label>
              <input
                id="dashboard-search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Uygulama adına göre ara"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                Ara
              </button>
              <Link
                href="/admin"
                className="px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Temizle
              </Link>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard value={stats.total} label="Toplam Uygulama" href={getAppsHref()} />
          <StatsCard value={stats.pending} label="Bekleyen" href={getAppsHref("pending")} />
          <StatsCard value={stats.approved} label="Onaylanan" href={getAppsHref("approved")} />
          <StatsCard value={stats.rejected} label="Reddedilen" href={getAppsHref("rejected")} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Link
            href={getAppsHref()}
            className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <Card className="cursor-pointer hover:border-indigo-300">
              <CardHeader>
                <CardTitle>Son Uygulama Başvuruları</CardTitle>
              </CardHeader>
              <CardContent>
                {recentApps.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    {query ? "Aramaya uygun başvuru bulunmuyor" : "Başvuru bulunmuyor"}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentApps.map((app) => (
                      <div key={app.id} className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{app.name}</p>
                          <p className="text-xs text-gray-500">{submissionTypeLabels[app.submission_type]}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={app.submission_type === "live" ? "success" : "warning"}>
                            {submissionTypeLabels[app.submission_type]}
                          </Badge>
                          <Badge variant={statusVariants[app.status] || "default"}>
                            {statusLabels[app.status] || app.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>

          <Link
            href={getAppsHref("approved")}
            className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <Card className="cursor-pointer hover:border-indigo-300">
              <CardHeader>
                <CardTitle>Yakinda Bitecek Uygulamalar</CardTitle>
              </CardHeader>
              <CardContent>
                {expiringApps.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    {query ? "Aramaya uygun yakında bitecek uygulama yok" : "Yakinda bitecek uygulama yok"}
                  </p>
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
          </Link>
        </div>

        <AdminAppsBoard apps={approvedApps} query={query} />
      </main>
    </div>
  );
}
