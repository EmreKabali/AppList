# AppList - Product Requirements Document (PRD)

> **Versiyon**: 1.0
> **Tarih**: 2025
> **Durum**: Draft

---

## 1. Proje Özeti

### 1.1 Amaç

AppList, WhatsApp Android ve IOS developer grubumuzun 14 günlük kapalı test (closed testing) sürecinde birbirine destek olmak için oluşturulmuş özel bir platformdur. Grup üyelerinin uygulamalarını listeler ve test sürecini takip etmeye yardımcı olur.

### 1.2 Hedef Kitle

- WhatsApp Android ve IOS developer grubu üyeleri
- Google Play Console ve APp store closed testing sürecindeki geliştiriciler

### 1.3 Temel Değer Önerisi

- Üyelerin uygulamalarını tek yerden görme
- Test süresini renkli geri sayımla takip etme
- Basit onay süreciyle kalite kontrolü

---

## 2. Teknoloji Stack

| Katman      | Teknoloji                | Maliyet        |
| ----------- | ------------------------ | -------------- |
| Frontend    | Next.js 14+ (App Router) | Ücretsiz      |
| Dil         | TypeScript               | -              |
| Stil        | TailwindCSS              | Ücretsiz      |
| Veritabanı | Supabase (PostgreSQL)    | Ücretsiz tier |
| Auth        | Supabase Auth            | Ücretsiz tier |
| Hosting     | Vercel                   | Ücretsiz tier |

**Kısıtlar**: Ücretsiz planlar dışında hiçbir paid service kullanılmayacak.

---

## 3. Roller ve Yetkiler

### 3.1 Rol Tanımları

| Rol                   | Açıklama                   | Yetkiler                                           |
| --------------------- | ---------------------------- | -------------------------------------------------- |
| **Super Admin** | Tam kontrol sahibi           | App onay/red, Sub Admin atama, tüm görüntüleme |
| **Sub Admin**   | Sınırlı yetkili yönetici | App onay/red, görüntüleme                       |
| **Public**      | Misafir kullanıcı          | App gönderme, onaylı app görme (girişsiz)      |

### 3.2 Yetki Matrisi

| İşlem                      | Super Admin | Sub Admin | Public |
| ---------------------------- | ----------- | --------- | ------ |
| App görüntüleme (onaylı) | ✅          | ✅        | ✅     |
| App gönderme                | ✅          | ✅        | ✅     |
| App onaylama                 | ✅          | ✅        | ❌     |
| App reddetme                 | ✅          | ✅        | ❌     |
| Bekleyen app görme          | ✅          | ✅        | ❌     |
| Admin atama                  | ✅          | ❌        | ❌     |
| Admin silme                  | ✅          | ❌        | ❌     |

---

## 4. Veritabanı Şeması

### 4.1 `apps` Tablosu

| Sütun         | Tip       | Açıklama                                 |
| -------------- | --------- | ------------------------------------------ |
| `id`         | uuid      | Primary key, auto-generated                |
| `name`       | text      | Uygulama adı                              |
| `play_url`   | text      | Google Play Store linki                    |
| `test_url`   | text      | Closed testing linki                       |
| `start_date` | date      | Test başlangıç tarihi                   |
| `end_date`   | date      | Test bitiş tarihi (auto: start + 14 gün) |
| `status`     | enum      | `pending` / `approved` / `rejected`  |
| `created_by` | text      | Gönderen kişinin adı/e-postası         |
| `created_at` | timestamp | Kayıt oluşturma zamanı                  |

### 4.2 `admin_users` Tablosu

| Sütun            | Tip       | Açıklama                       |
| ----------------- | --------- | -------------------------------- |
| `id`            | uuid      | Primary key                      |
| `email`         | text      | Unique, login için kullanılır |
| `password_hash` | text      | Şifrelenmiş şifre             |
| `role`          | enum      | `super_admin` / `sub_admin`  |
| `created_at`    | timestamp | Kayıt zamanı                   |
| `created_by`    | uuid      | Bu admin'i oluşturan admin      |

### 4.3 İlişkiler

```
admin_users (1) → (N) apps [created_by üzerinden dolaylı]
```

---

## 5. Özellikler

### 5.1 Ana Sayfa (`/`)

**Amaç**: Onaylı uygulamaları listelemek

**Bileşenler**:

- Header: Logo (AppList text) + "App Gönder" butonu
- Filtre sekmeleri: Tümü | Aktif | Yakında Bitecek | Yayınlanmış
- App kartları grid'i

**App Kartı İçeriği**:

- Uygulama adı
- Test durumu (renkli badge)
- Kalan gün sayısı
- Play Store linki
- Test linki

### 5.2 Renk Kodlu Geri Sayım Sistemi

| Renk          | Koşul           | Anlamı              |
| ------------- | ---------------- | -------------------- |
| 🟢 Yeşil     | ≥10 gün kaldı | Rahat, zaman var     |
| 🟡 Sarı      | 5-9 gün kaldı  | Dikkat, yaklaşıyor |
| 🔴 Kırmızı | 0-4 gün kaldı  | Acil, bitmek üzere  |

**Hesaplama**:

```
kalan_gün = end_date - bugün
eğer kalan_gün < 0 → "Sona erdi" (gri badge)
```

### 5.3 Filtreleme

| Filtre                     | Koşul                                        |
| -------------------------- | --------------------------------------------- |
| **Tümü**           | status = 'approved'                           |
| **Aktif**            | status = 'approved' AND end_date >= today     |
| **Yakında Bitecek** | status = 'approved' AND end_date - today <= 5 |
| **Yayınlanmış**   | status = 'approved' AND end_date < today      |

### 5.4 App Gönderme Formu (`/submit`)

**Erişim**: Public (giriş gerektirmez)

**Form Alanları**:

| Alan                     | Tip  | Zorunlu |
| ------------------------ | ---- | ------- |
| Uygulama Adı            | text | ✅      |
| Play Store Linki         | url  | ✅      |
| Test Linki               | url  | ✅      |
| Test Başlangıç Tarihi | date | ✅      |
| Sizin Adınız           | text | ✅      |

**Akış**:

1. Kullanıcı formu doldurur
2. Sistem `end_date`'i otomatik hesaplar (start + 14)
3. Kayıt `pending` durumunda oluşturulur
4. Kullanıcıya "Başvurunuz alındı, onay bekleniyor" mesajı gösterilir

### 5.5 Admin Login (`/login`)

**Erişim**: Sadece admin_users tablosundaki hesaplar

**Akış**:

1. E-posta ve şifre ile giriş
2. Supabase Auth ile doğrulama
3. Başarılı → `/admin` yönlendirmesi
4. Başarısız → Hata mesajı

### 5.6 Admin Paneli (`/admin`)

**Koruma**: Middleware ile sadece authenticated admin'ler

**Dashboard**:

- İstatistikler: Toplam app, bekleyen, onaylı, reddedilen
- Son gönderilen uygulamalar listesi

**App Yönetimi** (`/admin/apps`):

- Tüm uygulamalar tablosu
- Durum filtreleme
- Onay/Red butonları
- Toplu işlem (opsiyonel)

**Admin Yönetimi** (`/admin/users`) - Sadece Super Admin:

- Admin listesi
- Yeni admin ekleme
- Rol değiştirme
- Admin silme

---

## 6. API Endpoints

### 6.1 Public Endpoints

| Method | Endpoint             | Açıklama                    |
| ------ | -------------------- | ----------------------------- |
| GET    | `/api/apps`        | Onaylı uygulamaları listele |
| POST   | `/api/apps/submit` | Yeni app gönder              |

### 6.2 Admin Endpoints (Auth gerekli)

| Method | Endpoint                 | Açıklama                  |
| ------ | ------------------------ | --------------------------- |
| GET    | `/api/admin/apps`      | Tüm uygulamaları listele  |
| PATCH  | `/api/admin/apps/:id`  | App durumunu güncelle      |
| GET    | `/api/admin/users`     | Admin listesi (Super Admin) |
| POST   | `/api/admin/users`     | Admin ekle (Super Admin)    |
| DELETE | `/api/admin/users/:id` | Admin sil (Super Admin)     |

---

## 7. UI/UX Gereksinimleri

### 7.1 Genel

- Temiz, minimal tasarım
- Kart tabanlı layout
- Mobil öncelikli responsive tasarım
- Hızlı yükleme süreleri

### 7.2 Logo

- Basit "AppList" text tabanlı logo
- Sans-serif font
- Modern ve temiz görünüm

### 7.3 Renk Paleti

| Kullanım                 | Renk               |
| ------------------------- | ------------------ |
| Primary                   | Modern mavi/indigo |
| Success (Yeşil badge)    | #22c55e            |
| Warning (Sarı badge)     | #eab308            |
| Danger (Kırmızı badge) | #ef4444            |
| Background                | Beyaz/gri          |

---

## 8. Klasör Yapısı

```
/app
  /(public)
    /page.tsx              → Ana sayfa
    /submit/page.tsx       → App gönderme formu
  /(admin)
    /admin/page.tsx        → Admin dashboard
    /admin/apps/page.tsx   → App yönetimi
    /admin/users/page.tsx  → Admin yönetimi (Super Admin)
    /login/page.tsx        → Admin login
  /api
    /apps/route.ts         → Public app API
    /apps/submit/route.ts  → Submit API
    /admin/apps/route.ts   → Admin app API
    /admin/users/route.ts  → Admin user API
/components
  /ui
    /button.tsx
    /card.tsx
    /input.tsx
    /badge.tsx
    /tabs.tsx
  /app-card.tsx            → App kartı
  /countdown-badge.tsx     → Geri sayım rozeti
  /filter-tabs.tsx         → Filtre sekmeleri
  /header.tsx              → Site header
  /stats-card.tsx          → İstatistik kartı
/lib
  /supabase/
    /client.ts             → Browser client
    /server.ts             → Server client
    /middleware.ts         → Auth helper
  /utils.ts                → Yardımcı fonksiyonlar
  /constants.ts            → Sabitler
/types
  /index.ts                → TypeScript tipleri
  /database.ts             → Supabase tipleri
/middleware.ts             → Route koruması
/supabase
  /migrations/             → SQL migration'lar
  /seed.sql                → İlk veri (Super Admin)
```

---

## 9. Güvenlik

### 9.1 Auth

- Supabase Auth ile güvenli kimlik doğrulama
- HTTP-only cookie tabanlı session
- CSRF koruması

### 9.2 Route Koruması

- `/admin/*` route'ları middleware ile korunur
- Auth check başarısız → `/login` yönlendirmesi

### 9.3 RLS (Row Level Security)

- Supabase RLS ile veritabanı seviyesinde koruma
- Public users sadece `status = 'approved'` kayıtları görebilir
- Admin'ler tüm kayıtları görebilir

---

## 10. Deployment

### 10.1 Ortamlar

| Ortam      | Platform       | URL                |
| ---------- | -------------- | ------------------ |
| Production | Vercel         | applist.vercel.app |
| Supabase   | Supabase Cloud | *.supabase.co      |

### 10.2 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 10.3 İlk Kurulum (Seed)

```sql
-- İlk Super Admin oluşturma
INSERT INTO admin_users (email, role)
VALUES ('admin@example.com', 'super_admin');
```

---

## 11. Gelecek Özellikler (v2)

- [ ] E-posta bildirimleri (onay/red)
- [ ] Discord/Slack entegrasyonu
- [ ] App detay sayfası
- [ ] İstatistik grafikleri
- [ ] Export (CSV)
- [ ] Çoklu dil desteği

---

## 12. Başarı Kriterleri

- [ ] Public kullanıcılar app gönderebiliyor
- [ ] Admin'ler app onaylayabiliyor/reddedebiliyor
- [ ] Geri sayım sistemi doğru çalışıyor
- [ ] Filtreleme çalışıyor
- [ ] Mobil responsive
- [ ] < 3 saniye sayfa yükleme
- [ ] Ücretsiz tier sınırları içinde

---

*Tasarım ve Geliştirme: Maestro AI Framework*
