"use client";

import { Fragment, useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ToastNotification } from "@/components/ui/toast-notification";
import { ChangePasswordCard } from "@/components/change-password-card";
import { getUserApps, getUserTestRequests, updateProfile, updateUserApp } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { SerializedApp } from "@/types";

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

const submissionTypeLabels: Record<string, string> = {
  live: "Yayında",
  test: "Test",
};

interface TesterApplicant {
  id: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface DashboardUserApp extends SerializedApp {
  testRequests?: TesterApplicant[];
}

interface EditFormState {
  name: string;
  submissionType: "live" | "test";
  platform: "android" | "ios" | "";
  playUrl: string;
  testUrl: string;
}

interface TestRequestWithApp {
  id: string;
  appId: string;
  createdAt: string;
  app: SerializedApp;
}

export default function DashboardPage() {
  const { data: session, update: updateSession } = useSession();
  const [myApps, setMyApps] = useState<DashboardUserApp[]>([]);
  const [testRequests, setTestRequests] = useState<TestRequestWithApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [appActionLoading, setAppActionLoading] = useState<string | null>(null);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [appsRes, testsRes] = await Promise.all([
        getUserApps(),
        getUserTestRequests(),
      ]);
      if (appsRes.success && appsRes.data) {
        setMyApps(appsRes.data as unknown as DashboardUserApp[]);
      }
      if (testsRes.success && testsRes.data) {
        setTestRequests(testsRes.data as unknown as TestRequestWithApp[]);
      }
      setLoading(false);
    }
    void loadData();
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextProfileName = (profileName || session?.user?.name || "").trim();

    if (!nextProfileName) {
      setToast({ message: "Ad Soyad boş bırakılamaz", variant: "error" });
      return;
    }

    setProfileLoading(true);
    const res = await updateProfile({ name: nextProfileName });
    if (res.success) {
      setToast({ message: "Profil güncellendi", variant: "success" });
      setProfileName(nextProfileName);
      await updateSession();
    } else {
      setToast({ message: res.error || "Güncelleme başarısız", variant: "error" });
    }
    setProfileLoading(false);
  };

  const startEdit = (app: DashboardUserApp) => {
    setEditingAppId(app.id);
    setEditForm({
      name: app.name,
      submissionType: app.submissionType === "live" ? "live" : "test",
      platform: app.platform === "android" || app.platform === "ios" ? app.platform : "",
      playUrl: app.playUrl ?? "",
      testUrl: app.testUrl ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingAppId(null);
    setEditForm(null);
  };

  const handleSaveApp = async () => {
    if (!editingAppId || !editForm) return;

    if (!editForm.name.trim()) {
      setToast({ message: "Uygulama adı boş bırakılamaz", variant: "error" });
      return;
    }

    if (!editForm.testUrl.trim()) {
      setToast({ message: "Test linki zorunludur", variant: "error" });
      return;
    }

    if (editForm.submissionType === "live" && !editForm.platform) {
      setToast({ message: "Yayında statüsü için platform seçimi zorunlu", variant: "error" });
      return;
    }

    setAppActionLoading(editingAppId);
    const response = await updateUserApp(editingAppId, {
      name: editForm.name.trim(),
      submissionType: editForm.submissionType,
      platform:
        editForm.submissionType === "live"
          ? editForm.platform || null
          : null,
      playUrl: editForm.submissionType === "live" ? editForm.playUrl || null : null,
      testUrl: editForm.testUrl.trim(),
    });

    if (response.success && response.data) {
      setMyApps((prev) =>
        prev.map((app) => (app.id === editingAppId ? response.data as unknown as DashboardUserApp : app))
      );
      setToast({ message: "Uygulama bilgileri güncellendi", variant: "success" });
      cancelEdit();
    } else {
      setToast({ message: response.error || "Uygulama güncellenemedi", variant: "error" });
    }

    setAppActionLoading(null);
  };

  const handleCopyToClipboard = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setToast({ message: successMessage, variant: "success" });
    } catch {
      setToast({ message: "Link kopyalanamadı", variant: "error" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <ToastNotification
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-indigo-600">AppList</Link>
            <nav className="flex items-center space-x-4">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">Ana Sayfa</Link>
              <Link href="/dashboard" className="text-sm font-medium text-indigo-600">Dashboard</Link>
              {(session?.user?.role === "admin" || session?.user?.role === "super_admin") && (
                <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">Admin</Link>
              )}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Çıkış
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Hoş geldiniz, {session?.user?.name || session?.user?.email}
            </p>
          </div>
          <Link href="/submit">
            <Button variant="primary">Uygulama Gönder</Button>
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm text-center py-8">Yükleniyor...</p>
        ) : (
          <div className="space-y-8">
            {/* My Apps */}
            <Card>
              <CardHeader>
                <CardTitle>Uygulamalarım ({myApps.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {myApps.length === 0 ? (
                  <p className="text-gray-500 text-sm">Henüz uygulama göndermediniz.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Ad</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tür</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Durum</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tester Başvuru</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tarih</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">İşlem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myApps.map((app) => (
                          <Fragment key={app.id}>
                            <tr className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm font-medium text-gray-900">{app.name}</td>
                              <td className="py-3 px-4">
                                <Badge variant={app.submissionType === "live" ? "success" : "warning"}>
                                  {submissionTypeLabels[app.submissionType] || app.submissionType}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant={statusVariants[app.status] || "default"}>
                                  {statusLabels[app.status] || app.status}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-700">
                                {app.testRequests?.length ?? 0}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-500">
                                {formatDate(app.createdAt)}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEdit(app)}
                                  disabled={appActionLoading === app.id}
                                >
                                  Düzenle
                                </Button>
                              </td>
                            </tr>

                            <tr className="border-b border-gray-100 bg-gray-50/50">
                              <td colSpan={6} className="px-4 py-3">
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs font-medium text-gray-700">Tester başvuranlar</p>
                                    {app.testRequests && app.testRequests.length > 0 ? (
                                      <ul className="mt-1 space-y-1">
                                        {app.testRequests.map((tester) => (
                                          <li key={tester.id} className="text-xs text-gray-600 flex items-center gap-2">
                                            <span>{(tester.user.name || "İsimsiz kullanıcı")} - {tester.user.email}</span>
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              className="h-6 px-2 text-[11px]"
                                              onClick={() =>
                                                void handleCopyToClipboard(
                                                  tester.user.email,
                                                  "Tester e-posta adresi kopyalandı"
                                                )
                                              }
                                            >
                                              Kopyala
                                            </Button>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="mt-1 text-xs text-gray-500">Henüz tester başvurusu yok.</p>
                                    )}
                                  </div>

                                  {editingAppId === app.id && editForm && (
                                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                                      <p className="text-sm font-semibold text-gray-900 mb-3">Uygulama Düzenle</p>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Input
                                          id={`app-name-${app.id}`}
                                          label="Uygulama Adı"
                                          value={editForm.name}
                                          onChange={(e) =>
                                            setEditForm((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                                          }
                                        />

                                        <div>
                                          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                                            Gönderim Statüsü
                                          </label>
                                          <select
                                            value={editForm.submissionType}
                                            onChange={(e) =>
                                              setEditForm((prev) =>
                                                prev
                                                  ? {
                                                    ...prev,
                                                    submissionType: e.target.value === "live" ? "live" : "test",
                                                    platform: e.target.value === "live" ? prev.platform : "",
                                                    playUrl: e.target.value === "live" ? prev.playUrl : "",
                                                  }
                                                  : prev
                                              )
                                            }
                                            className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)]"
                                          >
                                            <option value="test">Test</option>
                                            <option value="live">Yayında</option>
                                          </select>
                                        </div>

                                        {editForm.submissionType === "live" && (
                                          <div>
                                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                                              Platform
                                            </label>
                                            <select
                                              value={editForm.platform}
                                              onChange={(e) =>
                                                setEditForm((prev) =>
                                                  prev
                                                    ? {
                                                      ...prev,
                                                      platform:
                                                        e.target.value === "android" || e.target.value === "ios"
                                                          ? e.target.value
                                                          : "",
                                                    }
                                                    : prev
                                                )
                                              }
                                              className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)]"
                                            >
                                              <option value="">Seçin</option>
                                              <option value="android">Android</option>
                                              <option value="ios">iOS</option>
                                            </select>
                                          </div>
                                        )}

                                        {editForm.submissionType === "live" && (
                                          <Input
                                            id={`app-play-url-${app.id}`}
                                            label="Store Linki"
                                            value={editForm.playUrl}
                                            onChange={(e) =>
                                              setEditForm((prev) =>
                                                prev ? { ...prev, playUrl: e.target.value } : prev
                                              )
                                            }
                                          />
                                        )}

                                        <Input
                                          id={`app-test-url-${app.id}`}
                                          label="Test Linki"
                                          value={editForm.testUrl}
                                          onChange={(e) =>
                                            setEditForm((prev) =>
                                              prev ? { ...prev, testUrl: e.target.value } : prev
                                            )
                                          }
                                        />
                                      </div>

                                      <div className="mt-3 flex gap-2">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="primary"
                                          onClick={handleSaveApp}
                                          disabled={appActionLoading === app.id}
                                        >
                                          {appActionLoading === app.id ? "Kaydediliyor..." : "Kaydet"}
                                        </Button>
                                        <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>
                                          Vazgeç
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Tester Olduğum Uygulamalar ({testRequests.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {testRequests.length === 0 ? (
                  <p className="text-gray-500 text-sm">Henüz tester olarak kayıt olmadınız.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Uygulama</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Test Linki</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Kayıt Tarihi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testRequests.map((tr) => (
                          <tr key={tr.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm font-medium text-gray-900">{tr.app.name}</td>
                            <td className="py-3 px-4">
                              {tr.app.testUrl ? (
                                <div className="flex items-center gap-2">
                                  <a
                                    href={tr.app.testUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
                                  >
                                    Linki Aç
                                  </a>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() =>
                                      void handleCopyToClipboard(
                                        tr.app.testUrl ?? "",
                                        "Test linki kopyalandı"
                                      )
                                    }
                                  >
                                    Kopyala
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">Link yok</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {formatDate(tr.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile */}
            <Card>
              <CardHeader>
                <CardTitle>Profil Ayarları</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="flex gap-4 items-end">
                  <Input
                    id="profile-name"
                    label="Ad Soyad"
                    value={profileName || session?.user?.name || ""}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" variant="primary" disabled={profileLoading}>
                    {profileLoading ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Change Password */}
            <ChangePasswordCard />
          </div>
        )}
      </main>
    </div>
  );
}
