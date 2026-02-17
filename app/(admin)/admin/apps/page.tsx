"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/stats-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { deleteAdminApp, getAdminApps, updateAdminApp, updateAppStatus } from "@/lib/api";
import { APP_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { App } from "@/types/database";

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

const platformLabels: Record<"android" | "ios", string> = {
  android: "Android",
  ios: "iOS",
};

type StatusFilter = "all" | "pending" | "approved" | "rejected";
type SubmissionTypeFilter = "all" | "live" | "test";

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tüm Durumlar" },
  { value: "pending", label: "Beklemede" },
  { value: "approved", label: "Onaylandı" },
  { value: "rejected", label: "Reddedildi" },
];

type EditFormState = {
  name: string;
  submission_type: App["submission_type"];
  platform: "android" | "ios" | "";
  play_url: string;
  description: string;
  icon_url: string;
  start_date: string;
  end_date: string;
};

function AdminAppsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string>("");
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const statusParam = searchParams.get("status");
  const submissionTypeParam = searchParams.get("submission_type");
  const platformParam = searchParams.get("platform");
  const queryParam = (searchParams.get("q") ?? "").trim();
  const statusFilter: StatusFilter =
    statusParam === "pending" || statusParam === "approved" || statusParam === "rejected"
      ? statusParam
      : "all";
  const submissionTypeFilter: SubmissionTypeFilter =
    submissionTypeParam === "live" || submissionTypeParam === "test"
      ? submissionTypeParam
      : "all";
  const platformFilter: "android" | "ios" | null =
    platformParam === "android" || platformParam === "ios" ? platformParam : null;

  useEffect(() => {
    setSearchInput(queryParam);
  }, [queryParam]);

  const updateFilters = useCallback((updates: {
    status?: StatusFilter;
    q?: string;
    submission_type?: SubmissionTypeFilter;
    platform?: "android" | "ios" | null;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.status !== undefined) {
      if (updates.status === "all") {
        params.delete("status");
      } else {
        params.set("status", updates.status);
      }
    }

    if (updates.q !== undefined) {
      const normalized = updates.q.trim();
      if (normalized.length === 0) {
        params.delete("q");
      } else {
        params.set("q", normalized);
      }
    }

    if (updates.submission_type !== undefined) {
      if (updates.submission_type === "all") {
        params.delete("submission_type");
        params.delete("platform");
      } else {
        params.set("submission_type", updates.submission_type);
        if (updates.submission_type !== "live") {
          params.delete("platform");
        }
      }
    }

    if (updates.platform !== undefined) {
      if (updates.platform === null || params.get("submission_type") !== "live") {
        params.delete("platform");
      } else {
        params.set("platform", updates.platform);
      }
    }

    const query = params.toString();
    router.replace(query ? `/admin/apps?${query}` : "/admin/apps", { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    let isCancelled = false;

    async function runInitialLoad() {
      setLoading(true);
      const response = await getAdminApps({
        limit: 100,
        status: statusFilter === "all" ? undefined : statusFilter,
        q: queryParam || undefined,
        submission_type: submissionTypeFilter === "all" ? undefined : submissionTypeFilter,
        platform: submissionTypeFilter === "live" ? platformFilter ?? undefined : undefined,
      });
      if (isCancelled) return;
      if (response.success && response.data) {
        setApps(response.data.data);
      } else {
        setApps([]);
      }
      setLoading(false);
    }

    void runInitialLoad();

    return () => {
      isCancelled = true;
    };
  }, [platformFilter, queryParam, statusFilter, submissionTypeFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== queryParam) {
        updateFilters({ q: searchInput });
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [queryParam, searchInput, updateFilters]);

  const handleStatusChange = async (id: string, status: string) => {
    setActionError("");
    setActionLoading(id);
    const response = await updateAppStatus(id, status);
    if (response.success) {
      setApps((prev) => prev.map((app) => (app.id === id ? { ...app, status: status as App["status"] } : app)));
    } else {
      setActionError(response.error || "Durum güncellenirken bir hata oluştu");
    }
    setActionLoading(null);
  };

  const startEdit = (app: App) => {
    setEditingAppId(app.id);
    setEditForm({
      name: app.name,
      submission_type: app.submission_type,
      platform: app.platform ?? "",
      play_url: app.play_url ?? "",
      description: app.description ?? "",
      icon_url: app.icon_url ?? "",
      start_date: app.start_date ?? "",
      end_date: app.end_date ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingAppId(null);
    setEditForm(null);
  };

  const handleEditSave = async () => {
    if (!editingAppId || !editForm) return;
    setActionError("");
    if (!editForm.name.trim()) {
      setActionError("Uygulama adı boş olamaz");
      return;
    }

    setActionLoading(editingAppId);
    const payload = {
      name: editForm.name.trim(),
      submission_type: editForm.submission_type,
      platform:
        editForm.submission_type === "live"
          ? editForm.platform || null
          : null,
      play_url: editForm.submission_type === "live" ? editForm.play_url || null : null,
      description: editForm.submission_type === "live" ? editForm.description || null : null,
      icon_url: editForm.icon_url || null,
      start_date: editForm.submission_type === "test" ? editForm.start_date || null : null,
      end_date: editForm.submission_type === "test" ? editForm.end_date || null : null,
    };

    const response = await updateAdminApp(editingAppId, payload);
    if (response.success && response.data) {
      setApps((prev) => prev.map((app) => (app.id === editingAppId ? response.data! : app)));
      cancelEdit();
    } else {
      setActionError(response.error || "Uygulama kaydedilemedi");
    }
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    setActionError("");
    if (!globalThis.confirm("Bu uygulamayı silmek istediğinize emin misiniz?")) {
      return;
    }
    setActionLoading(id);
    const response = await deleteAdminApp(id);
    if (response.success) {
      setApps((prev) => prev.filter((app) => app.id !== id));
      if (editingAppId === id) {
        cancelEdit();
      }
    } else {
      setActionError(response.error || "Uygulama silinemedi");
    }
    setActionLoading(null);
  };

  const typeStats = {
    all: apps.length,
    live: apps.filter((app) => app.submission_type === "live").length,
    test: apps.filter((app) => app.submission_type === "test").length,
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-40 backdrop-blur-sm bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-[var(--primary)] hover:text-[var(--accent)] transition-colors">AppList</Link>
            <nav className="flex items-center space-x-4">
              <Link href="/admin" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">Panel</Link>
              <Link href="/admin/apps" className="text-sm font-medium text-[var(--primary)]">Uygulamalar</Link>
              <Link href="/admin/users" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">Kullanıcılar</Link>
              <AdminLogoutButton className="text-sm text-[var(--primary)] hover:text-[var(--accent)] transition-colors" />
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Uygulama Yönetimi</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Başvuruları inceleyin ve onaylayın</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tüm Başvurular</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard
                value={typeStats.all}
                label="Tümü"
                active={submissionTypeFilter === "all"}
                onClick={() => updateFilters({ submission_type: "all", platform: null })}
              />
              <StatsCard
                value={typeStats.live}
                label="Yayında"
                active={submissionTypeFilter === "live"}
                onClick={() => updateFilters({ submission_type: "live" })}
              />
              <StatsCard
                value={typeStats.test}
                label="Test"
                active={submissionTypeFilter === "test"}
                onClick={() => updateFilters({ submission_type: "test" })}
              />
            </div>

            {submissionTypeFilter === "live" && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">Platform:</span>
                <button
                  type="button"
                  onClick={() => updateFilters({ platform: null })}
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
                  onClick={() => updateFilters({ platform: "android" })}
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
                  onClick={() => updateFilters({ platform: "ios" })}
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

            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <Input
                id="apps-search"
                label="Arama"
                placeholder="Uygulama adı veya açıklama"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />

              <div className="w-full md:max-w-xs">
                <label htmlFor="status-filter" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Durum Filtresi
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => updateFilters({ status: e.target.value as StatusFilter })}
                  className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)]"
                >
                  {statusFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {(statusFilter !== "all" || queryParam || submissionTypeFilter !== "all" || platformFilter !== null) && (
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSearchInput("");
                      updateFilters({ status: "all", q: "", submission_type: "all", platform: null });
                    }}
                  >
                    Filtreleri Temizle
                  </Button>
                </div>
              )}
            </div>

            {(() => {
              if (loading) {
                return <p className="text-[var(--muted-foreground)] text-sm text-center py-4">Yükleniyor...</p>;
              }
              if (apps.length === 0) {
                return <p className="text-[var(--muted-foreground)] text-sm text-center py-4">Başvuru bulunmuyor</p>;
              }
              return (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">Uygulama Adı</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">Gönderim</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">Platform</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">Durum</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">Başlangıç</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">Bitiş</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apps.map((app) => (
                        <tr key={app.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm font-medium text-[var(--foreground)]">{app.name}</p>
                              {app.play_url && (
                                <a
                                  href={app.play_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[var(--primary)] hover:text-[var(--accent)] hover:underline transition-colors"
                                >
                                  {app.platform === "ios" ? "App Store" : "Play Store"}
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={app.submission_type === "live" ? "success" : "warning"}>
                              {submissionTypeLabels[app.submission_type]}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-[var(--muted-foreground)]">
                            {app.platform ? platformLabels[app.platform] : "-"}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={statusVariants[app.status] || "default"}>
                              {statusLabels[app.status] || app.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-[var(--muted-foreground)]">
                            {app.start_date ? formatDate(app.start_date) : "-"}
                          </td>
                          <td className="py-3 px-4 text-sm text-[var(--muted-foreground)]">
                            {app.end_date ? formatDate(app.end_date) : "-"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              {app.status === APP_STATUS.PENDING && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleStatusChange(app.id, APP_STATUS.APPROVED)}
                                    disabled={actionLoading === app.id}
                                  >
                                    Onayla
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => handleStatusChange(app.id, APP_STATUS.REJECTED)}
                                    disabled={actionLoading === app.id}
                                  >
                                    Reddet
                                  </Button>
                                </>
                              )}
                              {app.status === APP_STATUS.APPROVED && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(app.id, APP_STATUS.REJECTED)}
                                  disabled={actionLoading === app.id}
                                >
                                  Geri Al
                                </Button>
                              )}
                              {app.status === APP_STATUS.REJECTED && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleStatusChange(app.id, APP_STATUS.APPROVED)}
                                  disabled={actionLoading === app.id}
                                >
                                  Onayla
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEdit(app)}
                                disabled={actionLoading === app.id}
                              >
                                Düzenle
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDelete(app.id)}
                                disabled={actionLoading === app.id}
                              >
                                Sil
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {actionError && (
              <p className="mt-4 text-sm text-red-600">{actionError}</p>
            )}

            {editingAppId && editForm && (
              <div className="mt-6 border border-[var(--border)] rounded-lg p-4 bg-[var(--muted)] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">Uygulama Düzenle</h3>
                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                    Vazgeç
                  </Button>
                </div>

                <Input
                  id="edit-app-name"
                  label="Uygulama Adı"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-submission-type" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Gönderim Türü</label>
                    <select
                      id="edit-submission-type"
                      value={editForm.submission_type}
                      onChange={(e) =>
                        setEditForm((prev) =>
                          prev
                            ? {
                              ...prev,
                              submission_type: e.target.value as App["submission_type"],
                              platform: e.target.value === "test" ? "" : prev.platform,
                            }
                            : prev
                        )
                      }
                      className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)]"
                    >
                      <option value="live">Yayında</option>
                      <option value="test">Test</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="edit-platform" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Platform</label>
                    <select
                      id="edit-platform"
                      value={editForm.platform}
                      onChange={(e) =>
                        setEditForm((prev) => (prev ? { ...prev, platform: e.target.value as "android" | "ios" | "" } : prev))
                      }
                      disabled={editForm.submission_type === "test"}
                      className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] disabled:bg-gray-100"
                    >
                      <option value="">Seçiniz</option>
                      <option value="android">Android</option>
                      <option value="ios">iOS</option>
                    </select>
                  </div>
                </div>

                {editForm.submission_type === "live" ? (
                  <>
                    <Input
                      id="edit-store-url"
                      label="Store URL"
                      type="url"
                      value={editForm.play_url}
                      onChange={(e) => setEditForm((prev) => (prev ? { ...prev, play_url: e.target.value } : prev))}
                    />
                    <div>
                      <label htmlFor="edit-description" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Açıklama</label>
                      <textarea
                        id="edit-description"
                        rows={3}
                        value={editForm.description}
                        onChange={(e) => setEditForm((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                        className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)]"
                      />
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      id="edit-start-date"
                      label="Başlangıç Tarihi"
                      type="date"
                      value={editForm.start_date}
                      onChange={(e) => setEditForm((prev) => (prev ? { ...prev, start_date: e.target.value } : prev))}
                    />
                    <Input
                      id="edit-end-date"
                      label="Bitiş Tarihi"
                      type="date"
                      value={editForm.end_date}
                      onChange={(e) => setEditForm((prev) => (prev ? { ...prev, end_date: e.target.value } : prev))}
                    />
                  </div>
                )}

                <Input
                  id="edit-icon-url"
                  label="İkon/Görsel URL"
                  type="url"
                  value={editForm.icon_url}
                  onChange={(e) => setEditForm((prev) => (prev ? { ...prev, icon_url: e.target.value } : prev))}
                />

                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    onClick={handleEditSave}
                    disabled={actionLoading === editingAppId}
                  >
                    {actionLoading === editingAppId ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function AdminAppsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)]" />}>
      <AdminAppsPageContent />
    </Suspense>
  );
}
