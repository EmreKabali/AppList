import { Header } from "@/components/header";
import { PublicAppsBoard } from "@/components/public-apps-board";
import { prisma } from "@/lib/prisma";

type ViewType = "live" | "active-test" | "expired-test";

export const revalidate = 60;

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

  const apps = await prisma.app.findMany({
    where: {
      OR: [
        { status: "approved" },
        { submissionType: "test" },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { testRequests: true } },
    },
  });

  const serializedApps = apps.map((app) => ({
    ...app,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
    testerCount: app._count.testRequests,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">App Takip Paneli</h2>
          <p className="text-gray-600">Kartlara tıklayarak yayında ve test süreçlerini takip edin</p>
        </div>

        <PublicAppsBoard
          apps={serializedApps}
          initialView={initialView}
          initialPlatformFilter={initialPlatformFilter}
        />
      </main>
    </div>
  );
}
