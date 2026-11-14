# RapiBuol

Aplikasi pencatatan, perencanaan, dan pelaporan kegiatan harian untuk BPS
(Badan Pusat Statistik). RapiBuol menggunakan React 19, Vite, TypeScript, dan
Supabase.

## Fitur Utama

- Dashboard personal, tim, dan satker sesuai peran pengguna.
- Pencatatan aktivitas dengan rentang tanggal, jam, volume, unit, status,
  catatan, dan bukti.
- Kalender harian, mingguan, dan bulanan dengan pemindahan aktivitas.
- Board prioritas berbasis kuadran Eisenhower.
- Pengelolaan tim, anggota, pengguna, dan peran.
- Ekspor laporan ke XLSX, PDF, dan DOCX.
- Impor aktivitas dari DOCX dan Google Tasks serta ekspor ke kalender.
- Dukungan PWA, mode offline, tema terang/gelap, dan tata letak responsif.

## Tech Stack

| Teknologi             | Fungsi                         |
| --------------------- | ------------------------------ |
| React 19              | UI Framework                   |
| TypeScript            | Type Safety                    |
| Vite                  | Build Tool                     |
| Tailwind CSS v4       | Styling                        |
| Shadcn UI             | Komponen UI (Radix + Tailwind) |
| TanStack Router       | Routing                        |
| TanStack Query        | Data Fetching & Caching        |
| React Hook Form + Zod | Form & Validasi                |
| Supabase              | Auth & Database (PostgreSQL)   |
| Recharts              | Chart & Visualisasi            |
| date-fns              | Date manipulation              |

## Struktur Proyek

```
src/
├── features/              # Modul fitur
│   ├── auth/             # Login, forgot password, reset password
│   ├── activities/       # Pencatatan dan impor aktivitas
│   ├── board/            # Board prioritas Eisenhower
│   ├── calendar/         # Kalender kegiatan
│   ├── dashboard/        # Dashboard berbasis peran
│   ├── reports/          # Pembuatan laporan
│   ├── teams/            # Manajemen tim dan anggota
│   ├── users/            # Manajemen pengguna dan peran
│   └── settings/         # Pengaturan akun dan tampilan
├── routes/               # TanStack Router file-based routes
│   ├── _authenticated/   # Protected routes
│   ├── (auth)/           # Auth routes
│   └── __root.tsx        # Root route
├── components/           # Shared components
│   ├── ui/              # Shadcn UI components
│   ├── layout/          # Layout components
│   └── data-table/      # Data table components
├── lib/                  # Utilities (supabase client, helpers)
├── hooks/                # Custom React hooks
└── styles/               # Global styles
```

`src/routeTree.gen.ts` dibuat otomatis oleh TanStack Router dan tidak boleh
diedit manual. Berkas statis berada di `public/`, sedangkan panduan dan migrasi
SQL berada di `docs/`.

## Menjalankan Proyek

### Prasyarat

- Node.js
- pnpm
- Proyek Supabase lokal atau cloud

### Setup

```bash
# Clone repo
git clone <repo-url>
cd rapibuol

# Install dependencies
pnpm install

# Siapkan environment
# Salin .env.example menjadi .env, lalu isi konfigurasi Supabase

# Jalankan dev server
pnpm dev
```

Akses di `http://localhost:5173`

Variabel yang digunakan aplikasi:

- `VITE_SUPABASE_URL`: URL proyek Supabase.
- `VITE_SUPABASE_ANON_KEY`: kunci anon Supabase.
- `VITE_GOOGLE_CLIENT_ID`: opsional, diperlukan untuk impor Google Tasks.

Nilai `VITE_*` tersedia di browser. Jangan menyimpan service-role key atau
rahasia server di dalamnya.

### Build Production

```bash
pnpm build
```

### Scripts

| Script              | Fungsi                                                   |
| ------------------- | -------------------------------------------------------- |
| `pnpm dev`          | Dev server                                               |
| `pnpm build`        | Build production                                         |
| `pnpm lint`         | ESLint check                                             |
| `pnpm test:board`   | Uji urutan kartu Board (Node.js 22.18+)                  |
| `pnpm format:check` | Periksa format tanpa mengubah berkas                     |
| `pnpm format`       | Prettier format                                          |
| `pnpm preview`      | Preview build                                            |
| `pnpm knip`         | Cari berkas, ekspor, dan dependency yang tidak digunakan |

Pengujian urutan kartu Board memakai test runner bawaan Node.js melalui
`pnpm test:board`. Sebelum membuat pull request, jalankan juga `pnpm lint`,
`pnpm format:check`, dan `pnpm build`, lalu uji alur yang berubah secara manual
pada tampilan dan tema yang relevan.

Kartu Board dapat diseret ke posisi di atas/bawah kartu lain atau ke kolom lain.
Menu titik tiga menyediakan tindakan yang sama untuk keyboard dan layar sentuh.
Urutan kartu diingat per akun di browser ini; kolom aktivitas disimpan di Supabase.

## Dokumentasi

Dokumentasi lengkap ada di folder `docs/`:

- [`docs/DEVELOPMENT_GUIDE.md`](./docs/DEVELOPMENT_GUIDE.md): arsitektur dan panduan pengembangan
- [`docs/TUTORIAL_ADD_FEATURE.md`](./docs/TUTORIAL_ADD_FEATURE.md): tutorial menambah fitur
- [`docs/DATABASE.md`](./docs/DATABASE.md): skema database
- [`docs/IMPLEMENTATION_CHECKLIST.md`](./docs/IMPLEMENTATION_CHECKLIST.md): checklist dan troubleshooting
- [`AGENTS.md`](./AGENTS.md): panduan kontribusi ringkas

## License

MIT
