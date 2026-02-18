"use client";

import { useMemo, useState } from "react";
import { AppCard } from "@/components/app-card";
import { StatsCard } from "@/components/stats-card";
import type { SerializedApp } from "@/types";

type ViewType = "live" | "active-test" | "expired-test";
type PlatformFilter = "android" | "ios" | null;

interface PublicAppsBoardProps {
  apps: SerializedApp[];
  initialView: ViewType;
  initialPlatformFilter: PlatformFilter;
}

const TODAY_ISO = new Date().toISOString().slice(0, 10);

export function PublicAppsBoard({ apps, initialView, initialPlatformFilter }: Readonly<PublicAppsBoardProps>) {
  const [view, setView] = useState<ViewType>(initialView);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>(initialPlatformFilter);

  const stats = useMemo(() => {
    const liveApps = apps.filter((app) => app.submissionType === "live");
    const testApps = apps.filter((app) => app.submissionType === "test");

    return {
      total: apps.length,
      live: liveApps.length,
      activeTests: testApps.filter((app) => !app.endDate || app.endDate >= TODAY_ISO).length,
      expiredTests: testApps.filter((app) => app.endDate !== null && app.endDate < TODAY_ISO).length,
    };
  }, [apps]);

  const currentApps = useMemo(() => {
    if (view === "live") {
      if (!platformFilter) {
        return apps.filter((app) => app.submissionType === "live");
      }
      return apps.filter((app) => app.submissionType === "live" && app.platform === platformFilter);
    }

    if (view === "active-test") {
      return apps.filter(
        (app) => app.submissionType === "test" && (!app.endDate || app.endDate >= TODAY_ISO)
      );
    }

    return apps.filter(
      (app) => app.submissionType === "test" && app.endDate !== null && app.endDate < TODAY_ISO
    );
  }, [apps, platformFilter, view]);

  const handleViewChange = (nextView: ViewType) => {
    setView(nextView);
    if (nextView !== "live") {
      setPlatformFilter(null);
    }
  };

  const getHeadingText = () => {
    switch (view) {
      case "active-test": return "Aktif Test Uygulamaları";
      case "expired-test": return "Süresi Biten Test Uygulamaları";
      default: return "Yayında Olan Uygulamalar";
    }
  };

  const getSubtext = () => {
    if (view === "active-test") return "Şu an aktif test sürecinde olan uygulamalar";
    if (view === "expired-test") return "Test süresi tamamlanan uygulamalar";
    if (platformFilter) return `${platformFilter === "android" ? "Android" : "iOS"} platformuna göre filtrelenmiş yayınlar`;
    return "Tüm yayınlanmış uygulamalar";
  };

  const getEmptyMessage = () => {
    if (view === "active-test") return "Aktif test uygulaması bulunmuyor.";
    if (view === "expired-test") return "Süresi biten test uygulaması bulunmuyor.";
    return "Gösterilecek yayında uygulama bulunmuyor.";
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatsCard value={stats.total} label="Toplam App" />
        <StatsCard
          value={stats.live}
          label="Yayında"
          active={view === "live"}
          onClick={() => handleViewChange("live")}
        />
        <StatsCard
          value={stats.activeTests}
          label="Aktif Test"
          active={view === "active-test"}
          onClick={() => handleViewChange("active-test")}
        />
        <StatsCard
          value={stats.expiredTests}
          label="Süresi Bitenler"
          active={view === "expired-test"}
          onClick={() => handleViewChange("expired-test")}
        />
      </div>

      {view === "live" && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Platform:</span>
          <button
            type="button"
            onClick={() => setPlatformFilter(null)}
            className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${platformFilter === null
              ? "bg-white border-indigo-600 text-indigo-700"
              : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
              }`}
          >
            Tümü
          </button>
          <button
            type="button"
            onClick={() => setPlatformFilter("android")}
            className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${platformFilter === "android"
              ? "bg-white border-indigo-600 text-indigo-700"
              : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
              }`}
          >
            Android
          </button>
          <button
            type="button"
            onClick={() => setPlatformFilter("ios")}
            className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${platformFilter === "ios"
              ? "bg-white border-indigo-600 text-indigo-700"
              : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
              }`}
          >
            iOS
          </button>
        </div>
      )}

      <section>
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            {getHeadingText()}
          </h3>
          <p className="text-sm text-gray-600">
            {getSubtext()}
          </p>
        </div>

        {currentApps.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">
            {getEmptyMessage()}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
