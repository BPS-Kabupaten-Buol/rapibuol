# Code Audit — RapiBuol

Tanggal: 2026-11-09
Lingkup: seluruh repo (src/, konfigurasi build, lapisan data), tanpa menjalankan build.

## Apa repo ini

RapiBuol: aplikasi internal BPS Kabupaten Buol untuk rekap kegiatan harian pegawai.
React 19 + Vite + TypeScript, Tailwind v4 + shadcn/ui (Radix), TanStack Router + Query,
Zustand, Supabase (auth + PostgreSQL), Recharts, mammoth/cheerio (import DOCX),
xlsx (export). Auth via Supabase email/password dengan sesi tersimpan di
`localStorage`/`sessionStorage` sesuai checkbox "ingat saya".

## Asumsi beban

Satu organisasi kecil, puluhan pegawai, beberapa tim, entri aktivitas harian.
Lalu lintas rendah. Temuan terkait skala dinilai rendah-prioritas.

## Alur utama

`main.tsx` (QueryClient + providers) → `__root.tsx` → `_authenticated` (layout memblokir
non-login lewat `useEffect`) → dashboard berbasis peran (`role_id 1` = admin, `2` = kepala;
atau punya tim yang dipimpin = team leader). CRUD aktivitas lewat Supabase, dengan
`beforeLoad` penjaga peran di rute `users` dan `teams`.

---

## Temuan — Must fix

### 1. Kelola user admin dipanggil dari browser dengan anon key

- **Lokasi:** `src/features/users/hooks/use-users.ts:67-72, 128-129, 145-148`
- **Apa ini:** `addUser` memakai `supabase.auth.admin.createUser`, `deleteUser`/`deleteUsers` memakai `supabase.auth.admin.deleteUser`.
- **Masalah:** API `auth.admin.*` hanya jalan dengan `service_role` (rahasia), sedangkan client cuma punya anon key, jadi pasti gagal 401/403. Kalau pun dihidupkan, itu sama dengan memberi setiap user yang login hak membuat/menghapus akun. Selain itu `deleteUser` menghapus profil dulu baru akun; kalau langkah kedua gagal, akun tertinggal tanpa profil (tidak atomik).
- **Perbaikan:** pindahkan ke Supabase Edge Function / RPC yang dipanggil client; hapus logika admin dari client.

### 2. Bulk action palsu (pura-pura berhasil)

- **Lokasi:** `src/features/activities/components/data-table-bulk-actions.tsx:33-61`
- **Apa ini:** tombol "Perbarui status" dan "Ekspor aktivitas" di toolbar bulk.
- **Masalah:** keduanya cuma `toast.promise(sleep(2000), ...)` lalu toast "berhasil", tanpa update DB atau tulis file. User mengira status terubah / file ter-ekspor padahal tidak terjadi apa-apa.
- **Perbaikan:** panggil update/ekspor sungguhan, atau hapus tombolnya.

### 3. Error handling terhubung ke Axios, padahal aplikasinya Supabase

- **Lokasi:** `src/lib/handle-server-error.ts`, `src/main.tsx:25-71`
- **Apa ini:** retry, `queryCache.onError` (redirect 401/500/403), dan `handleServerError` semuanya bercabang pada `error instanceof AxiosError`.
- **Masalah:** semua panggilan data lewat supabase-js yang melempar `PostgrestError`, bukan `AxiosError`. Akibatnya: (a) cabang redirect "Session expired"/500/403 tidak pernah kena, (b) toast menampilkan "Something went wrong!" generik dan tidak pernah menampilkan pesan DB aslinya; untuk AxiosError `error.response?.data.title` bisa `undefined` sehingga toast "undefined". `axios` hanya dipakai untuk `instanceof` ini, tidak ada pemakaian nyata.
- **Perbaikan:** cabang pada `PostgrestError` dan `.message`-nya, buang logika Axios, hapus `axios` dari `dependencies`.

---

## Temuan — Should fix

### 4. Dua lapisan data paralel

Aktivitas pakai TanStack Query (`api/activities.ts`), tapi tim/user pakai `useState`+`useEffect`
manual dengan optimistic update + rollback + `fetchUsers()` (`use-teams.ts`, `use-users.ts`).
Satu aplikasi dua pola, sehingga cache/loading/error tidak konsisten.
Migrasikan tim/user ke react-query (atau sebaliknya, tapi pilih satu).

### 5. Over-fetch untuk hitung anggota tim

- **Lokasi:** `use-teams.ts:31-43`
- **Masalah:** `fetchTeams` menarik seluruh tabel `users_teams` lalu menghitung anggota per tim di client.
- **Perbaikan:** pakai `.select('..., users_teams(count)')` atau hitung di DB (RPC).

### 6. Hapus tidak transaksional

- **Lokasi:** `use-teams.ts:175-204`, `use-users.ts:66-112`
- **Masalah:** `deleteTeam` menghapus baris `users_teams` dulu baru `teams`; kalau panggilan kedua gagal, keanggotaan hilang tapi tim masih ada. `addUser` membuat akun auth dulu, insert profil bisa gagal sehingga akun menjadi yatim.
- **Perbaikan:** satu RPC/Edge Function yang atomik menyelesaikan keduanya.

### 7. Sisa mock/rename yang mati

- `src/features/activities/data/activities.ts` — 100 baris `faker`, tidak di-import siapa pun (kalau pernah di-import akan menarik `@faker-js/faker` ke bundle client).
- `src/features/activities/data/data.tsx` — hanya `statuses` yang dipakai; array `teams`/`units` mati.
- `src/features/activities/data/schema.ts:40-43` — alias `taskSchema/Task/CreateTaskInput/UpdateTaskInput`.
- `src/features/activities/components/activities-provider.tsx:43` — alias `useTasks = useActivities`.
- `src/features/teams/team-detail/team-detail-provider.tsx` — provider yang cuma memberi `{ placeholder: '' }`.
- `src/stores/auth-store.ts` — store Zustand yang `user`/`accessToken`-nya tidak pernah di-isi di mana pun.

Hapus untuk mengecilkan permukaan yang harus dibaca/diuji.

### 8. Scaffold shadcn belum diadaptasi di halaman nyata

- **Lokasi:** `src/features/settings/profile/profile-form.tsx` + folder `display/`, `notifications/`, `profile/`.
- **Masalah:** form masih berisi "shadcn", "I own a computer.", "m@example.com", dan submit tidak melakukan apa pun; profil juga tidak punya rute (rute settings hanya `account` + `appearance`).
- **Perbaikan:** selesaikan atau hapus.

---

## Temuan — Nice to have

### 9. Komponen select dobel

`components/ui/select.tsx`, `components/select-dropdown.tsx`, `components/multi-select.tsx`.
Periksa apakah dua yang terakhir masih dipakai; jika bisa, satukan.

### 10. Role pakai angka ajaib

- **Lokasi:** `dashboard/index.tsx:70`, `users/index.tsx:22`, `teams/index.tsx:15`
- **Masalah:** `role_id === 1` / `=== 2` tersebar tanpa nama.
- **Perbaikan:** ekstrak ke konstanta/enum.

### 11. Penjaga peran duplikat

`beforeLoad` di `users/index.tsx` dan `teams/index.tsx` hampir identik.
Ekstrak `requireRole([...])`.

### 12. Query dobel + `any` di user dashboard

- **Lokasi:** `user-dashboard.tsx:81-101, 218`
- **Masalah:** `periodCountRes` dan `totalRes` adalah query yang sama, dijalankan dua kali; `weekOfMonth` untuk periode non-custom pakai `new Date().getDate()/7` (penyebut salah); `onValueChange={(val: any)` lolos dari type-safety.

### 13. Avatar DiceBear eksternal + fallback hardcoded

- **Lokasi:** `user-dashboard.tsx:192-194`
- **Masalah:** aplikasi pemerintah menelepon `api.dicebear.com` untuk avatar inisial, dan `AvatarFallback>US` keras.
- **Perbaikan:** pakai inisial lokal.

### 14. `parseDate` format nama-bulan rusak

- **Lokasi:** `import-docx.ts:58-65`
- **Masalah:** pola `(\d{1,2})\s+(\w+)\s+(\d{4})` menghasilkan `tahun-hari-NamaBulan` (mis. "2024-05-Januari"), bukan ISO. Kalau DOCX sumber memakai "5 Januari 2024", tanggalnya rusak.
- **Perbaikan:** perbaiki atau buang format itu.

### 15. `parseDocxFromPath` pakai `.buffer` + `fs`

- **Lokasi:** `import-docx.ts:322-323`
- **Masalah:** `readFileSync(...).buffer` memakai ArrayBuffer dasar yang bisa lebih besar dari file; `fs` juga tidak ada di browser, jadi path ini mati untuk SPA ini.

---

## Saran fitur (diprioritaskan, berdasar kode yang sudah ada)

1. **Ekspor/laporan sungguhan.** `lib/export.ts` (xlsx) sudah ada tapi tidak terhubung (lihat temuan #2). Bangun ekspor rekap per periode per pengguna/tim/satker.
2. **Alur persetujuan (approval).** Aktivitas cuma punya `is_done` tanpa persetujuan atasan. Tambah status "disetujui/ditolak" + catatan.
3. **Pengingat laporan.** Dashboard sudah menghitung "anggota belum lapor"; naikkan jadi notifikasi/reminder harian ke yang belum mengisi (folder `settings/notifications` sudah ada).
4. **Unggah bukti dukung.** `link_bukti_dukung` masih teks; jadikan upload file ke Supabase Storage dengan pratinjau gambar/PDF.
5. **Validasi lokasi.** `coordinates` sudah direkam; tambah pratinjau peta + cek radius untuk presensi lapangan.
6. **CRUD data master unit/tim.** `unit_measurement` dan `teams` sudah tabel DB tapi unit hanya bisa dibaca; tambah halaman admin untuk mengelolanya.
7. **Matriks peran/izin.** Role masih angka ajaib (temuan #10); bangun halaman peran yang benar, sekalian menghilangkan angka ajaib.

---

## Verdict

Kerangka dan fiturnya sehat, tapi ada satu lubang keamanan nyata (#1), dua fitur yang bohong/mati (#2, #3), dan cukup banyak kode mati yang bisa dipangkas.
Urutan perbaikan yang disarankan: **#1 → #2 → #3 → #7**.

## Lean

Kira-kira bisa -300 baris (file mock + alias + scaffold + provider stub) dan -1 dependency
(`axios`, plus `@faker-js/faker` dari devDependencies yang sudah tidak terpakai).

## Tidak diperiksa

Komponen chart Recharts (`analytics.tsx`, `activity-heatmap.tsx`), detail `kepala-satker-dashboard`
dan `team-leader-dashboard`, file UI `src/components/ui/*` (generasi shadcn), dan `routeTree.gen.ts`.
Build belum dijalankan (sandbox sesi ini menolak tulis di subfolder; `pnpm build` butuh akses penuh).

## Status perbaikan (2026-11-09)

| # | Temuan | Status | Catatan |
|---|--------|--------|---------|
| 1 | Admin user dari browser dengan anon key | **Belum** | Sengaja dilewati, butuh Supabase Edge Function. |
| 2 | Bulk action palsu | Selesai | Status update + ekspor XLSX sekarang sungguhan. |
| 3 | Error handling berbasis Axios | Selesai | `getErrorMessage`/`isAuthFailure` untuk Supabase; `axios` dihapus dari dependency. |
| 4 | Dua lapisan data paralel | Selesai | `useTeams`, `useTeamMembers`, `useUsers`, `useRoles`, dan opsi tim pindah ke TanStack Query. |
| 5 | Over-fetch hitung anggota tim | Selesai | Pakai `users_teams(count)` di select. |
| 6 | Hapus tidak transaksional | Sebagian | Keanggotaan dicadangkan lalu dikembalikan bila hapus tim gagal. Transaksi penuh tetap butuh RPC. |
| 7 | Kode mati | Selesai | Dihapus: mock faker, tim/satuan mock, alias `Task`, `useTasks`, provider stub, store Zustand, `sidebarData.user`. |
| 8 | Scaffold shadcn settings | Selesai | `profile/`, `display/`, `notifications/` dihapus; dua rute diarahkan ke `/settings/account`. |
| 9 | Komponen select dobel | Diperiksa | `select-dropdown` (satu pilihan) dan `multi-select` (banyak pilihan + pencarian) dipakai di tempat berbeda; bukan duplikat, dipertahankan. |
| 10 | Angka peran ajaib | Selesai | `src/lib/roles.ts`. |
| 11 | Guard peran duplikat | Selesai | `requireAnyRole` di `src/lib/route-guards.ts`. |
| 12 | Query dobel + `any` di dashboard | Selesai | Query duplikat dibuang, penghitung minggu diperbaiki, tipe `PeriodTask`. |
| 13 | Avatar DiceBear eksternal | Selesai | Inisial lokal dari nama profil. |
| 14 | `parseDate` nama bulan | Selesai | Format `dd/mm/yyyy` dan "5 Januari 2024" sekarang benar; tanggal tidak valid ditolak. |
| 15 | `parseDocxFromPath` | Selesai | Dihapus (tidak bisa jalan di browser). |

