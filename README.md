# RapiBuol

Sistem pelaporan kegiatan harian untuk BPS (Badan Pusat Statistik). Dibangun dengan React 19, Vite, dan Supabase.

## Fitur Utama

- **Dashboard Berbasis Peran** — Tiga tampilan dashboard sesuai peran pengguna:
  - **Dashboard Saya** — Statistik personal, heatmap aktivitas 3 bulan, daftar tugas per periode
  - **Dashboard Tim** — Pemantauan anggota tim, rasio penyelesaian, anggota aktif/belum lapor
  - **Dashboard Satker** — Pengawasan makro organisasi, kepatuhan, trend harian, beban per tim
- **Filter Periode** — Harian, Mingguan, Bulanan, dan **Pilih Bulan** (dengan month/year picker)
- **Manajemen Aktivitas** — CRUD aktivitas harian dengan deskripsi, jam, volume, unit, status, dan bukti
- **Manajemen Tim** — Kelola tim, anggota, dan pemimpin tim
- **Manajemen Pengguna** — Admin kelola pengguna, peran, dan keanggotaan tim
- **Tema Terang/Gelap** — Switch tema dengan persistensi
- **Responsif** — Tampilan desktop dan mobile

## Tech Stack

| Teknologi | Fungsi |
|-----------|--------|
| React 19 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Tailwind CSS v4 | Styling |
| Shadcn UI | Komponen UI (Radix + Tailwind) |
| TanStack Router | Routing |
| TanStack Query | Data Fetching & Caching |
| React Hook Form + Zod | Form & Validasi |
| Zustand | State Management |
| Supabase | Auth & Database (PostgreSQL) |
| Recharts | Chart & Visualisasi |
| date-fns | Date manipulation |

## Struktur Proyek

```
src/
├── features/              # Modul fitur
│   ├── auth/             # Login, forgot password, reset password
│   ├── dashboard/        # Dashboard berbasis peran
│   ├── activities/       # CRUD aktivitas harian
│   ├── teams/            # Manajemen tim & anggota
│   ├── users/            # Manajemen pengguna & peran
│   ├── units/            # Unit measurement (data layer)
│   └── settings/         # Pengaturan akun & tampilan
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
├── stores/               # Zustand stores
└── styles/               # Global styles
```

## Menjalankan Proyek

### Prasyarat
- Node.js 20+
- pnpm
- Supabase project (local atau cloud)

### Setup

```bash
# Clone repo
git clone <repo-url>
cd rapibuol

# Install dependencies
pnpm install

# Setup environment
# Copy .env.example ke .env dan isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY

# Jalankan dev server
pnpm dev
```

Akses di `http://localhost:5173`

### Build Production

```bash
pnpm build
```

### Scripts

| Script | Fungsi |
|--------|--------|
| `pnpm dev` | Dev server |
| `pnpm build` | Build production |
| `pnpm lint` | ESLint check |
| `pnpm format` | Prettier format |
| `pnpm tsc` | TypeScript check |
| `pnpm preview` | Preview build |

## Dokumentasi

Dokumentasi lengkap ada di folder `docs/`:

- [`docs/DEVELOPMENT_GUIDE.md`](./docs/DEVELOPMENT_GUIDE.md) — Arsitektur & panduan pengembangan
- [`docs/TUTORIAL_ADD_FEATURE.md`](./docs/TUTORIAL_ADD_FEATURE.md) — Tutorial menambah fitur
- [`docs/DATABASE.md`](./docs/DATABASE.md) — Skema database
- [`docs/IMPLEMENTATION_CHECKLIST.md`](./docs/IMPLEMENTATION_CHECKLIST.md) — Checklist & troubleshooting

## License

MIT
