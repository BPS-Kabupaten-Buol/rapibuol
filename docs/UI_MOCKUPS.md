# RAPIBUOL - UI ASCII Mockups & Design Guidelines

## Panduan Desain Umum

- **Warna:** Gunakan palet warna utama dari design system (lihat FRONTEND_IMPLEMENTATION_PLAN.md).
- **Typography:** Judul menggunakan font tebal, ukuran besar; subjudul sedang; isi teks regular.
- **Spacing:** Padding antar elemen minimal 2 spasi, margin antar section 1 baris kosong.
- **Komponen:** Semua tombol, input, dan card menggunakan sudut membulat (rounded), shadow halus, dan icon konsisten.
- **Navigasi:** Selalu ada di atas (desktop) atau bawah (mobile), dengan highlight pada halaman aktif.
- **Responsif:** Layout utama 2 kolom (sidebar + konten) di desktop, 1 kolom di mobile.
- **Breadcrumb:** Selalu tampil di bawah navbar, kecuali halaman login/register.
- **Aksesibilitas:** Semua tombol dan input memiliki label jelas.

---

## 1. Halaman Login

```
+---------------------------------------------+
|           RAPIBUOL - Login                  |
+---------------------------------------------+
|                                             |
|           [ Logo Besar di Tengah ]          |
|                                             |
|   +-------------------------------+         |
|   |  Email                        |         |
|   +-------------------------------+         |
|   +-------------------------------+         |
|   |  Password                     |         |
|   +-------------------------------+         |
|                                             |
|   [ ] Remember me      [Forgot Password?]   |
|                                             |
|   [   Login   ]                             |
|                                             |
|   Belum punya akun? [Register]              |
|                                             |
+---------------------------------------------+
```

---

## 2. Halaman Register

```
+---------------------------------------------+
|           RAPIBUOL - Register               |
+---------------------------------------------+
|                                             |
|           [ Logo Besar di Tengah ]          |
|                                             |
|   +-------------------------------+         |
|   |  Nama Lengkap                 |         |
|   +-------------------------------+         |
|   +-------------------------------+         |
|   |  Email                        |         |
|   +-------------------------------+         |
|   +-------------------------------+         |
|   |  Password                     |         |
|   +-------------------------------+         |
|   +-------------------------------+         |
|   |  Konfirmasi Password          |         |
|   +-------------------------------+         |
|                                             |
|   [   Register   ]                          |
|   Sudah punya akun? [Login]                 |
+---------------------------------------------+
```

---

## 3. Dashboard (Employee)

```
+---------------------------------------------------------------+
| RAPIBUOL [Logo]         | [User: Nama] [Notifikasi] [Logout]  |
+---------------------------------------------------------------+
| [Dashboard] [Log] [Report] [Profile]                          |
+-------------------+-------------------------------------------+
|                   |                                           |
|   [Sidebar]       |   [Breadcrumb: Home / Dashboard]          |
|   - Dashboard     |                                           |
|   - Log Aktivitas |   +-------------------------------+       |
|   - Report        |   |  Selamat datang, [Nama]!      |       |
|   - Profile       |   +-------------------------------+       |
|                   |                                           |
+-------------------+   [Grafik Heatmap Aktivitas]              |
|                   |   +-----------------------------------+   |
|                   |   |  [O O O O O O O O O O O O O O O]  |   |
|                   |   |  [O O O O O O O O O O O O O O O]  |   |
|                   |   +-----------------------------------+   |
|                   |                                           |
|                   |   [Tombol: Log Aktivitas Hari Ini]        |
|                   |                                           |
|                   |   [Ringkasan: Total Log, Progress, etc]   |
+-------------------+-------------------------------------------+
```

---

## 4. Halaman Log Aktivitas

```
+---------------------------------------------------------------+
| RAPIBUOL [Logo]         | [User: Nama] [Notifikasi] [Logout]  |
+---------------------------------------------------------------+
| [Dashboard] [Log] [Report] [Profile]                          |
+-------------------+-------------------------------------------+
|                   | [Breadcrumb: Home / Log Aktivitas]        |
|   [Sidebar]       |                                           |
|   - Dashboard     |   +-------------------------------+       |
|   - Log Aktivitas |   |  Form Log Aktivitas            |      |
|   - Report        |   +-------------------------------+       |
|   - Profile       |                                           |
|                   |   [Tanggal: [ 2024-06-01 ▼ ]]             |
|                   |   [Aktivitas:  ____________________ ]     |
|                   |   [Deskripsi: _____________________]      |
|                   |   [Durasi: ___ jam ___ menit]             |
|                   |   [Tombol: Simpan]                        |
|                   |                                           |
|                   |   [Daftar Log Hari Ini]                   |
|                   |   +-------------------------------+       |
|                   |   | 08:00 - 09:00 | Meeting      | [✏️]   |
|                   |   | 09:00 - 11:00 | Coding       | [✏️]   |
|                   |   +-------------------------------+       |
+-------------------+-------------------------------------------+
```

---

## 5. Halaman Monitoring (Team Leader/Dept Head)

```
+---------------------------------------------------------------+
| RAPIBUOL [Logo]         | [User: Nama] [Notifikasi] [Logout]  |
+---------------------------------------------------------------+
| [Dashboard] [Monitoring] [Report] [Profile]                   |
+-------------------+-------------------------------------------+
|                   | [Breadcrumb: Home / Monitoring]           |
|   [Sidebar]       |                                           |
|   - Dashboard     |   +-------------------------------+       |
|   - Monitoring    |   |  Monitoring Tim                |      |
|   - Report        |   +-------------------------------+       |
|   - Profile       |                                           |
|                   |   [Filter: [Tim ▼] [Tanggal ▼]]           |
|                   |                                           |
|                   |   +-----------------------------------+   |
|                   |   | Nama Anggota | Heatmap | Progress |   |
|                   |   +-----------------------------------+   |
|                   |   | Andi         | [O O O] | 80%     |   |
|                   |   | Budi         | [O O O] | 60%     |   |
|                   |   +-----------------------------------+   |
|                   |                                           |
|                   |   [Tombol: Export Data]                   |
+-------------------+-------------------------------------------+
```

---

## 6. Halaman Report

```
+---------------------------------------------------------------+
| RAPIBUOL [Logo]         | [User: Nama] [Notifikasi] [Logout]  |
+---------------------------------------------------------------+
| [Dashboard] [Log] [Report] [Profile]                          |
+-------------------+-------------------------------------------+
|                   | [Breadcrumb: Home / Report]               |
|   [Sidebar]       |                                           |
|   - Dashboard     |   +-------------------------------+       |
|   - Log Aktivitas |   |  Laporan Aktivitas            |       |
|   - Report        |   +-------------------------------+       |
|   - Profile       |                                           |
|                   |   [Filter: [Tanggal ▼] [Tim ▼]]           |
|                   |                                           |
|                   |   +-----------------------------------+   |
|                   |   | Nama | Total Jam | Progress | Export | |
|                   |   +-----------------------------------+   |
|                   |   | Andi |    40     |   80%   | [⬇️]   | |
|                   |   | Budi |    32     |   60%   | [⬇️]   | |
|                   |   +-----------------------------------+   |
|                   |                                           |
|                   |   [Tombol: Export Semua]                  |
+-------------------+-------------------------------------------+
```

---

## 7. Halaman Profile

```
+---------------------------------------------------------------+
| RAPIBUOL [Logo]         | [User: Nama] [Notifikasi] [Logout]  |
+---------------------------------------------------------------+
| [Dashboard] [Log] [Report] [Profile]                          |
+-------------------+-------------------------------------------+
|                   | [Breadcrumb: Home / Profile]              |
|   [Sidebar]       |                                           |
|   - Dashboard     |   +-------------------------------+       |
|   - Log Aktivitas |   |  Profile Pengguna             |       |
|   - Report        |   +-------------------------------+       |
|   - Profile       |                                           |
|                   |   [Nama: Andi]                             |
|                   |   [Email: andi@email.com]                  |
|                   |   [Role: Employee]                         |
|                   |   [Tombol: Edit Profile]                   |
|                   |   [Tombol: Ganti Password]                 |
+-------------------+-------------------------------------------+
```

---

## 8. Halaman Admin (Manajemen User/Tim)

```
+---------------------------------------------------------------+
| RAPIBUOL [Logo]         | [Admin: Nama] [Notifikasi] [Logout] |
+---------------------------------------------------------------+
| [Dashboard] [User] [Team] [Report] [Profile]                  |
+-------------------+-------------------------------------------+
|                   | [Breadcrumb: Home / User Management]      |
|   [Sidebar]       |                                           |
|   - Dashboard     |   +-------------------------------+       |
|   - User          |   |  Manajemen User               |       |
|   - Team          |   +-------------------------------+       |
|   - Report        |                                           |
|   - Profile       |   [Tombol: Tambah User]                   |
|                   |                                           |
|                   |   +-----------------------------------+   |
|                   |   | Nama | Email | Role | Aksi         |  |
|                   |   +-----------------------------------+   |
|                   |   | Andi | ...   | Employee | [✏️][🗑️] |  |
|                   |   | Budi | ...   | Leader   | [✏️][🗑️] |  |
|                   |   +-----------------------------------+   |
|                   |                                           |
+-------------------+-------------------------------------------+
```

---

## Konsistensi Komponen

- **Sidebar**: Selalu di kiri, highlight menu aktif.
- **Navbar**: Logo kiri, user info kanan.
- **Breadcrumb**: Di bawah navbar, kecuali login/register.
- **Tombol utama**: Selalu warna primer, sudut membulat, icon jika perlu.
- **Table**: Header tebal, baris bergantian warna abu muda/putih.
- **Heatmap**: Kotak kecil, warna gradasi hijau sesuai intensitas.
- **Form**: Label di atas input, error message warna merah kecil di bawah input.

---

## Catatan

- Untuk mobile, sidebar menjadi drawer/hamburger.
- Semua halaman menggunakan layout dasar yang sama, hanya konten utama yang berubah.
- Gunakan komponen dari shadcn/ui untuk konsistensi visual.
