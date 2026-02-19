import Link from "next/link";
import { AdminAppsBoard } from "@/components/admin-apps-board";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { StatsCard } from "@/components/stats-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import type { SerializedApp } from "@/types";

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

const statusVariants: Record<
  string,
  "default" | "success" | "warning" | "danger"
> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

const submissionTypeLabels: Record<string, string> = {
  live: "Yayında",
  test: "Test",
};

export default async function AdminDashboardPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ q?: string }>;
}>) {
  const adminContext = await getSessionContext();
  if (
    !adminContext ||
    (adminContext.role !== "admin" && adminContext.role !== "super_admin")
  ) {
    redirect("/login");
  }

  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const todayIso = new Date().toISOString().slice(0, 10);
  const expiringLimit = new Date();
  expiringLimit.setDate(expiringLimit.getDate() + 5);
  const expiringLimitIso = expiringLimit.toISOString().slice(0, 10);

  const searchFilter = query
    ? {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
      }
    : {};

  const [
    totalCount,
    pendingCount,
    approvedCount,
    rejectedCount,
    recentApps,
    expiringApps,
    approvedApps,
  ] = await Promise.all([
    prisma.app.count(),
    prisma.app.count({ where: { status: "pending" } }),
    prisma.app.count({ where: { status: "approved" } }),
    prisma.app.count({ where: { status: "rejected" } }),
    prisma.app.findMany({
      where: searchFilter,
      select: { id: true, name: true, submissionType: true, status: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.app.findMany({
      where: {
        status: "approved",
        endDate: { not: null, gte: todayIso, lte: expiringLimitIso },
        ...searchFilter,
      },
      select: { id: true, name: true, endDate: true },
      orderBy: { endDate: "asc" },
      take: 5,
    }),
    prisma.app.findMany({
      where: {
        status: "approved",
        ...searchFilter,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        submissionType: true,
        platform: true,
        playUrl: true,
        testUrl: true,
        description: true,
        iconUrl: true,
        startDate: true,
        endDate: true,
        status: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { testRequests: true } },
      },
    }),
  ]);

  const stats = {
    total: totalCount,
    pending: pendingCount,
    approved: approvedCount,
    rejected: rejectedCount,
  };

  const serializedApprovedApps: SerializedApp[] = approvedApps.map((app) => ({
    ...app,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
    testerCount: app._count.testRequests,
  }));

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
            <Link href="/" className="text-xl font-bold text-indigo-600">
              AppList
            </Link>
            <nav className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Panel
              </Link>
              <Link
                href="/admin/apps"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Uygulamalar
              </Link>
              <Link
                href="/admin/users"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Kullanıcılar
              </Link>
              <AdminLogoutButton className="text-sm text-indigo-600 hover:text-indigo-800" />
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Paneli</h1>
          <p className="text-gray-600 mt-1">Genel bakış ve istatistikler</p>

          <form
            method="GET"
            className="mt-4 flex flex-col gap-3 md:flex-row md:items-end"
          >
            <div className="w-full md:max-w-md">
              <label
                htmlFor="dashboard-search"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
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
          <StatsCard
            value={stats.total}
            label="Toplam Uygulama"
            href={getAppsHref()}
          />
          <StatsCard
            value={stats.pending}
            label="Bekleyen"
            href={getAppsHref("pending")}
          />
          <StatsCard
            value={stats.approved}
            label="Onaylanan"
            href={getAppsHref("approved")}
          />
          <StatsCard
            value={stats.rejected}
            label="Reddedilen"
            href={getAppsHref("rejected")}
          />
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
                    {query
                      ? "Aramaya uygun başvuru bulunmuyor"
                      : "Başvuru bulunmuyor"}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentApps.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {app.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {submissionTypeLabels[app.submissionType]}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              app.submissionType === "live"
                                ? "success"
                                : "warning"
                            }
                          >
                            {submissionTypeLabels[app.submissionType]}
                          </Badge>
                          <Badge
                            variant={statusVariants[app.status] || "default"}
                          >
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
                    {query
                      ? "Aramaya uygun yakında bitecek uygulama yok"
                      : "Yakinda bitecek uygulama yok"}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {expiringApps.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm font-medium">{app.name}</span>
                        <span className="text-xs text-gray-500">
                          {app.endDate
                            ? new Date(app.endDate).toLocaleDateString("tr-TR")
                            : "-"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>

        <AdminAppsBoard apps={serializedApprovedApps} query={query} />
      </main>
    </div>
  );
}
