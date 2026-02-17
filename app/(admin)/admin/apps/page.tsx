"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getAdminApps, updateAppStatus } from "@/lib/api";
import { APP_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
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

export default function AdminAppsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    setLoading(true);
    const response = await getAdminApps({ limit: 100 });
    if (response.success && response.data) {
      setApps(response.data.data);
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    setActionLoading(id);
    const response = await updateAppStatus(id, status);
    if (response.success) {
      setApps((prev) => prev.map((app) => (app.id === id ? { ...app, status: status as App["status"] } : app)));
    }
    setActionLoading(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="text-xl font-bold text-indigo-600">AppList</a>
            <nav className="flex items-center space-x-4">
              <a href="/admin" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</a>
              <a href="/admin/apps" className="text-sm font-medium text-indigo-600">Apps</a>
              <a href="/admin/users" className="text-sm text-gray-600 hover:text-gray-900">Users</a>
              <a href="/" className="text-sm text-indigo-600 hover:text-indigo-800">Cikis</a>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">App Yonetimi</h1>
          <p className="text-gray-600 mt-1">Basvurulari inceleyin ve onaylayin</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tum Basvurular</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500 text-sm text-center py-4">Yukleniyor...</p>
            ) : apps.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Basvuru bulunmuyor</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">App Adi</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Durum</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Baslangic</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Bitis</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Islemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((app) => (
                      <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{app.name}</p>
                            {app.play_url && (
                              <a
                                href={app.play_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:underline"
                              >
                                Play Store
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={statusVariants[app.status] || "default"}>
                            {statusLabels[app.status] || app.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {app.start_date ? formatDate(app.start_date) : "-"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
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
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
