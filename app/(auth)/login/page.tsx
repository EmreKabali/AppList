"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ToastNotification } from "@/components/ui/toast-notification";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setToastMessage("");

    const result = await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });

    if (result?.error) {
      setLoading(false);
      setToastMessage("E-posta veya şifre hatalı");
      return;
    }

    // Fetch session to determine redirect
    const sessionRes = await fetch("/api/admin/session", { cache: "no-store" });
    const sessionData = await sessionRes.json();

    setLoading(false);

    if (sessionRes.ok && sessionData.success) {
      router.replace("/admin");
    } else {
      router.replace("/dashboard");
    }
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
          <CardTitle className="text-2xl">Giris Yap</CardTitle>
          <p className="text-gray-600 text-sm mt-1">Devam etmek icin giris yapın</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-posta"
              type="email"
              placeholder="ornek@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Sifre"
              type="password"
              placeholder="********"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? "Giris yapılıyor..." : "Giris Yap"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Hesabınız yok mu?{" "}
              <Link href="/register" className="text-indigo-600 hover:text-indigo-800 font-medium">
                Kayıt Ol
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
