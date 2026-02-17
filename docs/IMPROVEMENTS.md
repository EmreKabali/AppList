# AppList - Istege Bagli Iyilestirmeler

> **Tarih**: Subat 2026
> **Durum**: Beklemede

---

## 1. Auth Aktiflestirme

**Mevcut Durum:** Auth kontrolleri gecici olarak devre disi birakildi (test icin).

**Yapilacaklar:**

### 1.1 API Route'larinda Auth Aktiflestirme

Asagidaki dosyalardaki yorum satirlari kaldirilacak:

- `app/api/admin/apps/route.ts` - GET ve PATCH
- `app/api/admin/users/route.ts` - Tum endpoint'ler
- `app/(admin)/admin/page.tsx` - Dashboard redirect

```typescript
// Bu satirlari aktif et:
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}
```

### 1.2 Middleware Aktiflestirme

`middleware.ts` dosyasinda /admin/* route'lari icin koruma aktif edilecek.

---

## 2. Login Sayfasi

**Mevcut Durum:** Login sayfasi mevcut ama Supabase Auth tam entegre degil.

**Yapilacaklar:**

### 2.1 Supabase Auth Entegrasyonu

`app/(admin)/login/page.tsx` dosyasinda:

```typescript
import { createClient } from "@/lib/supabase/client";

const handleLogin = async (e: FormEvent) => {
  e.preventDefault();
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (!error) {
    router.push("/admin");
  }
};
```

### 2.2 Ilk Admin Kullanici Olusturma

Supabase Dashboard'dan:
1. Auth > Users > Add user
2. Email: admin@example.com
3. Password: guclu bir sifre

### 2.3 Cikis Islemi

Admin header'daki "Cikis" linkine signOut eklenmeli:

```typescript
const handleLogout = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
  router.push("/login");
};
```

---

## 3. Users Yonetimi

**Mevcut Durum:** Sayfa mevcut, API endpoint'leri hazir ama auth gerektiriyor.

**Yapilacaklar:**

### 3.1 Admin API Auth Aktiflestirme

`app/api/admin/users/route.ts` dosyasinda auth kontrolleri acilacak.

### 3.2 Rol Bazli Erisim

- `super_admin`: Tum user islemlerini yapabilir
- `admin`: Sadece goruntuleyebilir

### 3.3 Test

1. Admin panelde /admin/users sayfasina git
2. Yeni admin ekle
3. Admin sil

---

## 4. Deployment (Vercel)

**Mevcut Durum:** Ertelemdi.

**Yapilacaklar:**

### 4.1 Vercel Proje Olusturma

```bash
npm i -g vercel
vercel login
vercel
```

### 4.2 Environment Variables

Vercel Dashboard > Settings > Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://pikkvhyeyzffywifwvbg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4.3 Domain

- Production: `applist.vercel.app` (veya ozel domain)

---

## 5. Diger Iyilestirmeler

### 5.1 RLS Politikalari

Production'da daha sik RLS politikalari:

```sql
-- Sadece onayli appleri herkes gorebilir
CREATE POLICY "Public can view approved apps"
    ON public.apps FOR SELECT
    USING (status = 'approved');

-- Sadece authenticated kullanicilar app ekleyebilir
CREATE POLICY "Authenticated can insert apps"
    ON public.apps FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
```

### 5.2 Hata Sayfalari

- `not-found.tsx` - 404 sayfasi
- `error.tsx` - Hata sayfasi
- `loading.tsx` - Yukleme sayfasi

### 5.3 SEO

- Meta tag'ler
- Open Graph
- sitemap.xml

### 5.4 Performans

- Image optimization
- Font optimization
- Bundle analyzer

---

## Oncelik Sirasi

1. **Auth Aktiflestirme** - Guvenlik icin kritik
2. **Login Sayfasi** - Auth ile birlikte
3. **Deployment** - Production'a almak icin
4. **Users Yonetimi** - Admin yonetimi icin
5. **Diger Iyilestirmeler** - Istege bagli

---

*Dokuman: Maestro AI Framework*
