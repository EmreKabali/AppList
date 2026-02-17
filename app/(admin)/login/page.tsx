"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ToastNotification } from "@/components/ui/toast-notification";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setToastMessage("");

    const supabase = createClient();

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (authError) {
      setLoading(false);
      setToastMessage(authError.message || "Giriş başarısız");
      return;
    }

    const sessionResponse = await fetch("/api/admin/session", {
      method: "GET",
      cache: "no-store",
    });

    if (!sessionResponse.ok) {
      await supabase.auth.signOut();
      setLoading(false);
      setToastMessage("Bu hesap admin paneline erişim yetkisine sahip değil");
      return;
    }

    setLoading(false);
    router.replace("/admin");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      {toastMessage && (
        <ToastNotification
          message={toastMessage}
          variant="error"
          onClose={() => setToastMessage("")}
        />
      )}

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Yönetici Girişi</CardTitle>
          <p className="text-gray-600 text-sm mt-1">Devam etmek için giriş yapın</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-posta"
              type="email"
              placeholder="admin@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Şifre"
              type="password"
              placeholder="********"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
