"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", role: "admin" });
  const [formLoading, setFormLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const response = await getAdminUsers({ limit: 100 });
    if (response.success && response.data) {
      setUsers(response.data.data);
    }
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
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
    }
    setFormLoading(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Bu kullaniciyi silmek istediginizden emin misiniz?")) return;
    setActionLoading(id);
    const response = await deleteAdminUser(id);
    if (response.success) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
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
              <a href="/admin/apps" className="text-sm text-gray-600 hover:text-gray-900">Apps</a>
              <a href="/admin/users" className="text-sm font-medium text-indigo-600">Users</a>
              <a href="/" className="text-sm text-indigo-600 hover:text-indigo-800">Cikis</a>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Yonetimi</h1>
            <p className="text-gray-600 mt-1">Admin yetkilerini yonetin (Super Admin only)</p>
          </div>
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Iptal" : "Yeni Admin"}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Yeni Admin Ekle</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="flex gap-4 items-end">
                <Input
                  label="E-posta"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="flex-1"
                />
                <Input
                  label="Sifre"
                  type="password"
                  placeholder="********"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="flex-1"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value={ADMIN_ROLES.SUB_ADMIN}>Admin</option>
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
            <CardTitle>Kullanicilar</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500 text-sm text-center py-4">Yukleniyor...</p>
            ) : users.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Kullanici bulunmuyor</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">E-posta</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rol</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Olusturulma</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Islemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
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
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={actionLoading === user.id}
                          >
                            Sil
                          </Button>
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
