"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ToastNotification } from "@/components/ui/toast-notification";
import { ChangePasswordCard } from "@/components/change-password-card";
import { getUserApps, getUserTestRequests, updateProfile } from "@/lib/api";
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

interface TestRequestWithApp {
  id: string;
  appId: string;
  createdAt: string;
  app: SerializedApp;
}

export default function DashboardPage() {
  const { data: session, update: updateSession } = useSession();
  const [myApps, setMyApps] = useState<SerializedApp[]>([]);
  const [testRequests, setTestRequests] = useState<TestRequestWithApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  useEffect(() => {
    if (session?.user?.name) {
      setProfileName(session.user.name);
    }
  }, [session?.user?.name]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [appsRes, testsRes] = await Promise.all([
        getUserApps(),
        getUserTestRequests(),
      ]);
      if (appsRes.success && appsRes.data) {
        setMyApps(appsRes.data as unknown as SerializedApp[]);
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
    setProfileLoading(true);
    const res = await updateProfile({ name: profileName });
    if (res.success) {
      setToast({ message: "Profil güncellendi", variant: "success" });
      await updateSession();
    } else {
      setToast({ message: res.error || "Güncelleme başarısız", variant: "error" });
    }
    setProfileLoading(false);
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
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tarih</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myApps.map((app) => (
                          <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm font-medium text-gray-900">{app.name}</td>
                            <td className="py-3 px-4">
                              <Badge variant={app.submissionType === "live" ? "success" : "warning"}>
                                {app.submissionType === "live" ? "Yayında" : "Test"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={statusVariants[app.status] || "default"}>
                                {statusLabels[app.status] || app.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {formatDate(app.createdAt)}
                            </td>
                          </tr>
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
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Durum</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Kayıt Tarihi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testRequests.map((tr) => (
                          <tr key={tr.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm font-medium text-gray-900">{tr.app.name}</td>
                            <td className="py-3 px-4">
                              <Badge variant={statusVariants[tr.app.status] || "default"}>
                                {statusLabels[tr.app.status] || tr.app.status}
                              </Badge>
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
                    value={profileName}
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
