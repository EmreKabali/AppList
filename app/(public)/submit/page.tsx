"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { submitApp } from "@/lib/api";

export default function SubmitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    play_url: "",
    test_url: "",
    start_date: "",
    created_by: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const response = await submitApp(formData);

    setLoading(false);

    if (response.success) {
      setSuccess(true);
      setFormData({ name: "", play_url: "", test_url: "", start_date: "", created_by: "" });
      setTimeout(() => router.push("/"), 2000);
    } else {
      setError(response.error || "Bir hata olustu");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Yeni App Gonder</h1>
          <p className="text-gray-600 mt-2">App bilgilerini doldurun ve inceleme surecini baslatin</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>App Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="App Adi"
                placeholder="Ornek: MyApp Pro"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <Input
                label="Adiniz"
                placeholder="Adiniz veya e-posta"
                value={formData.created_by}
                onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
                required
              />

              <Input
                label="Play Store URL"
                placeholder="https://play.google.com/store/apps/details?id=com.example"
                type="url"
                value={formData.play_url}
                onChange={(e) => setFormData({ ...formData, play_url: e.target.value })}
                required
              />

              <Input
                label="Test URL"
                placeholder="https://test.example.com"
                type="url"
                value={formData.test_url}
                onChange={(e) => setFormData({ ...formData, test_url: e.target.value })}
              />

              <Input
                label="Baslangic Tarihi"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              {success && (
                <p className="text-sm text-green-600">Basariyla gonderildi! Yonlendiriliyorsunuz...</p>
              )}

              <div className="flex gap-3">
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? "Gonderiliyor..." : "Gonder"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Iptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
