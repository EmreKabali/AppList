"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToastNotification } from "@/components/ui/toast-notification";
import { createClient } from "@/lib/supabase/client";

interface FormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const INITIAL_FORM_STATE: FormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function ChangePasswordCard() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  const updateForm = (patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setToast(null);

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setToast({ message: "Tüm alanları doldurun.", variant: "error" });
      return;
    }

    if (form.newPassword.length < 8) {
      setToast({ message: "Yeni şifre en az 8 karakter olmalı.", variant: "error" });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setToast({ message: "Yeni şifre ve tekrar şifresi eşleşmiyor.", variant: "error" });
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setToast({ message: "Yeni şifre mevcut şifreden farklı olmalı.", variant: "error" });
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      setToast({ message: "Kullanıcı doğrulanamadı. Tekrar giriş yapın.", variant: "error" });
      setLoading(false);
      return;
    }

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: form.currentPassword,
    });

    if (reauthError) {
      setToast({ message: "Mevcut şifre hatalı.", variant: "error" });
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: form.newPassword,
    });

    if (updateError) {
      setToast({ message: updateError.message || "Şifre güncellenemedi.", variant: "error" });
      setLoading(false);
      return;
    }

    setToast({ message: "Şifreniz güncellendi.", variant: "success" });
    setForm(INITIAL_FORM_STATE);
    setLoading(false);
  };

  return (
    <Card className="mb-6">
      {toast && (
        <ToastNotification
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      <CardHeader>
        <CardTitle>Şifre Değiştir</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
          <Input
            id="current-password"
            label="Mevcut Şifre"
            type="password"
            value={form.currentPassword}
            onChange={(event) => updateForm({ currentPassword: event.target.value })}
            required
          />
          <Input
            id="new-password"
            label="Yeni Şifre"
            type="password"
            value={form.newPassword}
            onChange={(event) => updateForm({ newPassword: event.target.value })}
            required
          />
          <Input
            id="confirm-password"
            label="Yeni Şifre (Tekrar)"
            type="password"
            value={form.confirmPassword}
            onChange={(event) => updateForm({ confirmPassword: event.target.value })}
            required
          />

          <div className="md:col-span-3">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
