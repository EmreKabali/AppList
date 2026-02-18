"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { submitApp } from "@/lib/api";

type SubmissionType = "live" | "test";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Dosya okunamadı"));
      }
    };
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.readAsDataURL(file);
  });
}

export default function SubmitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submissionType, setSubmissionType] = useState<SubmissionType>("live");

  const [formData, setFormData] = useState({
    name: "",
    platform: "android" as "android" | "ios",
    test_url: "",
    icon_url: "",
  });

  const iconPreview = formData.icon_url;

  const handleImageUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setFormData((prev) => ({ ...prev, icon_url: dataUrl }));
    } catch {
      setError("Görsel yüklenirken bir hata oluştu");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!formData.icon_url) {
      setLoading(false);
      setError("Lütfen ikon veya görsel ekleyin");
      return;
    }

    if (!formData.platform) {
      setLoading(false);
      setError("Platform seçimi zorunludur");
      return;
    }

    if (!formData.test_url) {
      setLoading(false);
      setError("Test linki zorunludur");
      return;
    }

    const response = await submitApp({
      submission_type: submissionType,
      platform: formData.platform,
      name: formData.name,
      test_url: formData.test_url,
      icon_url: formData.icon_url,
    });

    setLoading(false);

    if (response.success) {
      setSuccess(true);
      setFormData({
        name: "",
        platform: "android",
        test_url: "",
        icon_url: "",
      });
      setTimeout(() => router.push("/"), 2000);
    } else {
      setError(response.error || "Bir hata oluştu");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Uygulama Gönder</h1>
          <p className="text-gray-600 mt-2">Test veya Yayında seçeneğine göre bilgileri doldurun</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gönderim Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)] mb-2">Statü</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSubmissionType("test")}
                    className={`rounded-lg border px-4 py-3 text-left transition-all duration-200 ${submissionType === "test"
                      ? "border-[var(--primary)] bg-indigo-50"
                      : "border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)]"
                      }`}
                  >
                    <p className="font-medium text-gray-900">Test</p>
                    <p className="text-sm text-gray-600">Kapalı test süreci için gönderim</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmissionType("live")}
                    className={`rounded-lg border px-4 py-3 text-left transition-all duration-200 ${submissionType === "live"
                      ? "border-[var(--primary)] bg-indigo-50"
                      : "border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)]"
                      }`}
                  >
                    <p className="font-medium text-gray-900">Yayında</p>
                    <p className="text-sm text-gray-600">Store&apos;da yayında olan uygulama</p>
                  </button>
                </div>
              </div>

              <Input
                label="Uygulama Adı"
                placeholder="Örnek: MyApp Pro"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <div>
                <p className="text-sm font-medium text-[var(--foreground)] mb-2">Platform</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, platform: "android" }))}
                    className={`rounded-lg border px-4 py-3 text-left transition-all duration-200 ${formData.platform === "android"
                      ? "border-[var(--primary)] bg-indigo-50"
                      : "border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)]"
                      }`}
                  >
                    <p className="font-medium text-gray-900">Android</p>
                    <p className="text-sm text-gray-600">Google Play Store</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, platform: "ios" }))}
                    className={`rounded-lg border px-4 py-3 text-left transition-all duration-200 ${formData.platform === "ios"
                      ? "border-[var(--primary)] bg-indigo-50"
                      : "border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)]"
                      }`}
                  >
                    <p className="font-medium text-gray-900">iOS</p>
                    <p className="text-sm text-gray-600">Apple App Store</p>
                  </button>
                </div>
              </div>

              <Input
                label="Test Linki"
                placeholder="https://..."
                type="url"
                value={formData.test_url}
                onChange={(e) => setFormData({ ...formData, test_url: e.target.value })}
                required
              />

              <div className="w-full space-y-3">
                <label className="block text-sm font-medium text-[var(--foreground)]">
                  {submissionType === "live" ? "Uygulamanın İkonu" : "Uygulamanın Resmi veya İkonu"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files?.[0] || null)}
                  className="w-full text-sm text-[var(--foreground)] file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-[var(--muted)] file:text-[var(--foreground)] file:cursor-pointer"
                  required
                />
                {iconPreview && (
                  <div className="rounded-lg border border-[var(--border)] p-3 bg-[var(--background)]">
                    <p className="text-xs text-gray-500 mb-2">Önizleme</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={iconPreview}
                      alt="Yüklenen uygulama görseli"
                      className="h-20 w-20 object-cover rounded-md border border-[var(--border)]"
                    />
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              {success && (
                <p className="text-sm text-green-600">Ekleme başarılı, doğrudan onaylandı</p>
              )}

              <div className="flex gap-3">
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? "Gönderiliyor..." : "Gönder"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
