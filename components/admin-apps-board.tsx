"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppCard } from "@/components/app-card";
import { StatsCard } from "@/components/stats-card";
import type { SerializedApp } from "@/types";

type ViewType = "live" | "test";
type PlatformFilter = "android" | "ios" | null;

interface AdminAppsBoardProps {
  apps: SerializedApp[];
  query: string;
}

export function AdminAppsBoard({ apps, query }: Readonly<AdminAppsBoardProps>) {
  const [view, setView] = useState<ViewType>("live");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>(null);

  const stats = useMemo(() => {
    const liveApps = apps.filter((app) => app.submissionType === "live");
    const testApps = apps.filter((app) => app.submissionType === "test");

    return {
      live: liveApps.length,
      test: testApps.length,
    };
  }, [apps]);

  const currentApps = useMemo(() => {
    if (view === "test") {
      return apps.filter((app) => app.submissionType === "test");
    }

    if (!platformFilter) {
      return apps.filter((app) => app.submissionType === "live");
    }

    return apps.filter(
      (app) => app.submissionType === "live" && app.platform === platformFilter
    );
  }, [apps, platformFilter, view]);

  const handleViewChange = (nextView: ViewType) => {
    setView(nextView);
    if (nextView !== "live") {
      setPlatformFilter(null);
    }
  };

  const getHeadingText = () => {
    if (view === "test") {
      return "Test Uygulamaları";
    }

    return "Yayında Olan Uygulamalar";
  };

  const getSubtext = () => {
    if (view === "test") {
      return "Onaylı test sürecindeki uygulamalar";
    }

    if (platformFilter) {
      return `${platformFilter === "android" ? "Android" : "iOS"} platformuna göre filtrelenmiş yayınlar`;
    }

    return "Onaylı tüm yayınlanan uygulamalar";
  };

  const getEmptyMessage = () => {
    if (view === "test") {
      return query
        ? "Aramaya uygun test uygulaması bulunmuyor."
        : "Gösterilecek test uygulaması bulunmuyor.";
    }

    return query
      ? "Aramaya uygun yayında uygulama bulunmuyor."
      : "Gösterilecek yayında uygulama bulunmuyor.";
  };

  const appsHref = useMemo(() => {
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }
    params.set("status", "approved");
    const queryString = params.toString();
    return queryString ? `/admin/apps?${queryString}` : "/admin/apps";
  }, [query]);

  return (
    <section className="mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StatsCard
          value={stats.live}
          label="Yayında"
          active={view === "live"}
          onClick={() => handleViewChange("live")}
        />
        <StatsCard
          value={stats.test}
          label="Test"
          active={view === "test"}
          onClick={() => handleViewChange("test")}
        />
      </div>

      {view === "live" && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Platform:</span>
          <button
            type="button"
            onClick={() => setPlatformFilter(null)}
            className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
              platformFilter === null
                ? "bg-white border-indigo-600 text-indigo-700"
                : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Tümü
          </button>
          <button
            type="button"
            onClick={() => setPlatformFilter("android")}
            className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
              platformFilter === "android"
                ? "bg-white border-indigo-600 text-indigo-700"
                : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Android
          </button>
          <button
            type="button"
            onClick={() => setPlatformFilter("ios")}
            className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
              platformFilter === "ios"
                ? "bg-white border-indigo-600 text-indigo-700"
                : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
            }`}
          >
            iOS
          </button>
        </div>
      )}

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{getHeadingText()}</h3>
          <p className="text-sm text-gray-600">{getSubtext()}</p>
        </div>
        <Link
          href={appsHref}
          className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Tümünü Admin Apps&apos;te Gör
        </Link>
      </div>

      {currentApps.length === 0 ? (
        <p className="text-gray-500 text-sm py-4">{getEmptyMessage()}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentApps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </section>
  );
}
