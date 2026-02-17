"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { ChangePasswordCard } from "@/components/change-password-card";
import { ToastNotification } from "@/components/ui/toast-notification";
import { getAdminUsers, createAdminUser, deleteAdminUser } from "@/lib/api";
import { ADMIN_ROLES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { AdminUser } from "@/types/database";

type UserRole = "super_admin" | "admin";

const roleVariants: Record<UserRole, "default" | "success" | "warning" | "danger"> = {
  super_admin: "danger",
  admin: "warning",
};

const roleLabels: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Omit<AdminUser, "password_hash">[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", role: "admin" });
  const [formLoading, setFormLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  const canManageUsers = currentRole === "super_admin";

  const loadUsers = async () => {
    setLoading(true);
    const response = await getAdminUsers({ limit: 100 });
    if (response.success && response.data) {
      setUsers(response.data.data);
      setCurrentRole(response.data.currentRole);
      setToast(null);
    } else if (response.error) {
      setToast({ message: response.error, variant: "error" });
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => globalThis.clearTimeout(timer);
  }, []);

  const handleCreateUser = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    if (!canManageUsers) return;
    setFormLoading(true);
    const response = await createAdminUser({
      email: formData.email,
      password: formData.password,
      role: formData.role,
    });
    if (response.success) {
      await loadUsers();
      setShowForm(false);
      setFormData({ email: "", password: "", role: "admin" });
      setToast({ message: "Yönetici başarıyla eklendi.", variant: "success" });
    } else if (response.error) {
      setToast({ message: response.error, variant: "error" });
    }
    setFormLoading(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (!canManageUsers) return;
    if (!globalThis.confirm("Bu kullanıcıyı silmek istediğinizden emin misiniz?")) return;
    setActionLoading(id);
    const response = await deleteAdminUser(id);
    if (response.success) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setToast({ message: "Yönetici silindi.", variant: "success" });
    } else if (response.error) {
      setToast({ message: response.error, variant: "error" });
    }
    setActionLoading(null);
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
              <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">Panel</Link>
              <Link href="/admin/apps" className="text-sm text-gray-600 hover:text-gray-900">Uygulamalar</Link>
              <Link href="/admin/users" className="text-sm font-medium text-indigo-600">Kullanıcılar</Link>
              <AdminLogoutButton className="text-sm text-indigo-600 hover:text-indigo-800" />
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yönetici Paneli</h1>
            <p className="text-gray-600 mt-1">Yönetici hesabını ve yetkileri yönetin</p>
          </div>
          {canManageUsers && (
            <Button variant="primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? "İptal" : "Yeni Yönetici"}
            </Button>
          )}
        </div>

        <ChangePasswordCard />

        {!canManageUsers && (
          <p className="mb-4 text-sm text-amber-700">Bu hesap kullanıcı yönetimi işlemleri için yetkili değil.</p>
        )}

        {showForm && canManageUsers && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Yeni Yönetici Ekle</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="flex gap-4 items-end">
                <Input
                  id="user-email"
                  label="E-posta"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="flex-1"
                />
                <Input
                  id="user-password"
                  label="Şifre"
                  type="password"
                  placeholder="********"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="flex-1"
                />
                <div>
                  <label htmlFor="user-role" className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select
                    id="user-role"
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value={ADMIN_ROLES.ADMIN}>Admin</option>
                    <option value={ADMIN_ROLES.SUPER_ADMIN}>Super Admin</option>
                  </select>
                </div>
                <Button type="submit" variant="primary" disabled={formLoading}>
                  {formLoading ? "Ekleniyor..." : "Ekle"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Kullanıcılar</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500 text-sm text-center py-4">Yükleniyor...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">E-posta</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rol</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Oluşturulma</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-gray-500 text-sm text-center py-4">Kullanıcı bulunmuyor</td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">{user.email}</td>
                          <td className="py-3 px-4">
                            <Badge variant={roleVariants[user.role as UserRole] || "default"}>
                              {roleLabels[user.role as UserRole] || user.role}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {user.created_at ? formatDate(user.created_at) : "-"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {canManageUsers ? (
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={actionLoading === user.id}
                              >
                                Sil
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-400">Yetki yok</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
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
