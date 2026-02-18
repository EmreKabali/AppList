import { Header } from "@/components/header";
import { PublicAppsBoard } from "@/components/public-apps-board";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

        <Card className="mb-6 border-indigo-200 bg-indigo-50/40 hover:shadow-sm">
          <CardHeader className="mb-2">
            <CardTitle className="text-base text-indigo-900">Önemli Bilgilendirme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <p>
              Aşağıdaki Google gruplara katılarak, gruptaki herkesi otomatik tester olarak eklemiş
              olursunuz.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <a
                  href="https://groups.google.com/g/google-play-testers-trkiye"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-700 underline underline-offset-2 hover:text-indigo-900"
                >
                  google-play-testers-trkiye
                </a>
              </li>
              <li>
                <a
                  href="https://groups.google.com/g/testgrubutr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-700 underline underline-offset-2 hover:text-indigo-900"
                >
                  testgrubutr
                </a>
              </li>
            </ul>
            <p className="text-gray-600">
              Google Grup mantığı: Play Console içinde tester olarak grup e-posta adresi tanımlanır;
              gruba katılan herkes tek tek ekleme yapmadan otomatik olarak teste erişebilir.
            </p>
          </CardContent>
        </Card>

        <PublicAppsBoard
          apps={serializedApps}
          initialView={initialView}
          initialPlatformFilter={initialPlatformFilter}
        />
      </main>
    </div>
  );
}
