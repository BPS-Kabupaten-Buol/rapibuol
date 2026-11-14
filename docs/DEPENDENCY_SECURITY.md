# Pembaruan keamanan dependensi

Tanggal pemeriksaan: 14 November 2026. Lingkungan validasi: Node.js 24.22.1,
pnpm 11.25.0, Windows.

## Hasil audit

| Tingkat  | Sebelum | Sesudah |
| -------- | ------: | ------: |
| Critical |       2 |       0 |
| High     |      60 |       0 |
| Moderate |      26 |       0 |
| Low      |       7 |       1 |
| Total    |      95 |       1 |

`pnpm audit --prod` melaporkan nol kerentanan. Audit seluruh dependensi tetap
melaporkan satu temuan low; tidak ada advisory yang disembunyikan atau diabaikan.
Hasil ini berlaku pada lockfile dan basis advisory saat pemeriksaan, bukan
jaminan bahwa tidak akan ditemukan kerentanan baru.

## Perubahan utama

| Paket             | Sebelum | Sesudah  |
| ----------------- | ------- | -------- |
| Vite              | 8.0.3   | 8.3.8    |
| React / React DOM | 19.2.4  | 19.3.1   |
| Supabase JS       | 2.102.1 | 2.119.0  |
| TanStack Router   | 1.168.4 | 1.170.46 |
| Tailwind CSS      | 4.2.2   | 4.3.5    |
| Zod               | 4.3.6   | 4.6.7    |
| Mammoth           | 1.12.0  | 1.13.0   |
| SheetJS / xlsx    | 0.18.5  | 0.20.3   |
| TypeScript        | 6.0.2   | 6.0.3    |

Dependensi lain diperbarui dalam rentang major yang sudah dipakai. React Table 8,
React Day Picker 9, TypeScript 6, dan vite-plugin-pwa 1 tetap dipertahankan.

SheetJS dipasang dari URL tarball resmi yang tercatat pada `package.json` dan
integritasnya dikunci dalam `pnpm-lock.yaml`. Registry npm masih menyediakan
rilis lama yang rentan. Lihat [petunjuk instalasi resmi SheetJS](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/)
dan advisory [prototype pollution](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6)
serta [ReDoS](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9).

`pnpm-workspace.yaml` memaksa patch transitif untuk Babel SystemJS, Browserslist,
fast-uri, minimatch, dan glob milik Workbox. Override minimatch/glob melewati
batas major parent; lint, pemformatan, dan pembuatan service worker perlu diuji
lagi ketika override ini diubah. Tinjau dan hapus override saat parent sudah
menggunakan rilis aman secara langsung.

Konfigurasi TypeScript kini menyebut tipe Node untuk tes secara eksplisit.
Dialog peran membaca pilihan langsung dari React Hook Form melalui `useWatch`,
sehingga tidak lagi menyalin nilai yang sama ke dua state React tambahan.

## Temuan yang masih tersisa

[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)
memengaruhi `deepmerge@4.3.1` melalui rantai development:
`vite-plugin-pwa > workbox-build > @rollup/plugin-node-resolve > deepmerge`.
Belum ada versi perbaikan resmi pada saat pemeriksaan. Paket ini digunakan oleh
alat build PWA; audit produksi tidak memuatnya. Temuan tetap dilaporkan dan
perlu diperiksa kembali saat upstream menerbitkan perbaikan.

## Validasi

- `pnpm test`: urutan Board, round-trip XLSX (termasuk teks mirip formula),
  konversi DOCX, dan pengiriman/validasi pilihan peran serta tim.
- `pnpm lint`, `pnpm build`, dan pemeriksaan format berkas yang diubah.
- Audit seluruh dependensi dan `pnpm audit --prod`.
- Instalasi `pnpm install --frozen-lockfile --ignore-scripts` berhasil tanpa
  mengubah lockfile.
- Pemeriksaan browser pada hasil build: validasi form masuk dan lupa password,
  routing antarhalaman, checkbox, toggle password, dan tombol muat ulang PWA.
  Tampilan 390 px diperiksa tanpa overflow horizontal dan tanpa error konsol.

`src/routeTree.gen.ts` diperbarui otomatis oleh generator router saat build;
identitas, path, dan parent route dibandingkan dengan versi sebelumnya.

Lint menyisakan lima warning lama tanpa error. Pemeriksaan format berkas yang
diubah lulus; `pnpm format:check` seluruh repositori masih menemukan 233 berkas
lain dengan format lama, yang tidak diformat massal dalam pembaruan ini.

Pengujian ini tidak menggantikan pemeriksaan manual seluruh alur setelah login
atau pengujian dengan database produksi.
