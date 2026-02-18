"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ToastNotification } from "@/components/ui/toast-notification";
import { registerUser } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setToast(null);
    setLoading(true);

    if (formData.password.length < 8) {
      setToast({ message: "Sifre en az 8 karakter olmalıdır", variant: "error" });
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setToast({ message: "Sifreler eslemiyor", variant: "error" });
      setLoading(false);
      return;
    }

    const result = await registerUser({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });

    if (!result.success) {
      setToast({ message: result.error || "Kayıt basarısız", variant: "error" });
      setLoading(false);
      return;
    }

    // Auto sign in after registration
    const signInResult = await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });

    setLoading(false);

    if (signInResult?.error) {
      setToast({ message: "Kayıt basarılı! Giris yapabilirsiniz.", variant: "success" });
      setTimeout(() => router.push("/login"), 1500);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      {toast && (
        <ToastNotification
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Kayıt Ol</CardTitle>
          <p className="text-gray-600 text-sm mt-1">Yeni hesap olusturun</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Ad Soyad"
              type="text"
              placeholder="Adınız Soyadınız"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

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
              placeholder="En az 8 karakter"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <Input
              label="Sifre (Tekrar)"
              type="password"
              placeholder="Sifrenizi tekrar girin"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Zaten hesabınız var mı?{" "}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
                Giris Yap
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
