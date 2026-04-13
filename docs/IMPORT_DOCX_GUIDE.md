# Panduan Impor Dokumen DOCX

## Ringkasan

Fitur impor DOCX memungkinkan Anda untuk mengimpor data aktivitas dari file Word (.docx) secara massal. Dokumen akan diparsing untuk mengekstrak informasi tentang tanggal, waktu, dan deskripsi aktivitas.

## Format yang Didukung

### 1. Format Tabel (Rekomendasi)

Tabel harus memiliki struktur dengan kolom-kolom berikut:

#### Format dengan 5 Kolom (Lengkap):
| Tanggal | Nama Penugasan | Waktu | Deskripsi | Koordinat |
|---------|---|---------|-----------|-----------|
| 15/01/2024 | Tim A | 08:00 - 17:00 | Rapat koordinasi | https://maps.google.com |
| 16/01/2024 | Tim B | 09:00 - 12:00 | Survei lapangan | https://maps.google.com |

#### Format dengan 4 Kolom:
| Tanggal | Waktu | Deskripsi | Koordinat |
|---------|-------|-----------|-----------|
| 15/01/2024 | 08:00 - 17:00 | Rapat koordinasi | https://maps.google.com |
| 16/01/2024 | 09:00 - 12:00 | Survei lapangan | https://maps.google.com |

#### Format dengan 3 Kolom (Minimal):
| Tanggal | Waktu | Deskripsi |
|---------|-------|-----------|
| 15/01/2024 | 08:00 - 17:00 | Rapat koordinasi |
| 16/01/2024 | 09:00 - 12:00 | Survei lapangan |

### 2. Format Tanggal yang Didukung

Sistem mendukung berbagai format tanggal:

- **DD/MM/YYYY**: `15/01/2024`
- **DD-MM-YYYY**: `15-01-2024`
- **YYYY-MM-DD**: `2024-01-15`
- **DD BULAN YYYY**: `15 Januari 2024` (dalam bahasa Indonesia)

### 3. Format Waktu yang Didukung

- **Jam tunggal**: `08:00` (hanya jam mulai)
- **Rentang jam dengan tanda dash**: `08:00 - 17:00`
- **Rentang jam dengan "s/d"**: `08:00 s/d 17:00`

## Persyaratan File

- **Format file**: .docx (Microsoft Word format)
- **Ukuran maksimal**: 10 MB
- **Encoding**: UTF-8 (default untuk file docx)

## Langkah-Langkah Impor

1. Buka halaman **Aktivitas**
2. Klik tombol **Impor**
3. Pilih file .docx dari komputer Anda
4. Sistem akan otomatis memproses dan menampilkan pratinjau data
5. Pilih satuan dan tim default dari dropdown
6. Review data yang akan diimpor di tabel
7. Centang data yang ingin diimpor (default: semua tercentang)
8. Klik **Impor [N] Aktivitas** untuk menyelesaikan

## Contoh Dokumen yang Benar

### Contoh 1: Tabel dengan Semua Kolom

```
┌─────────────┬──────────────┬──────────────────┬──────────────────────┬──────────────────────┐
│ Tanggal     │ Penugasan    │ Waktu            │ Deskripsi            │ Koordinat            │
├─────────────┼──────────────┼──────────────────┼──────────────────────┼──────────────────────┤
│ 15/01/2024  │ Tim Survey   │ 08:00 - 17:00    │ Survei lapangan area │ -6.2088, 106.8456   │
│ 16/01/2024  │ Tim Teknis   │ 09:00 - 12:00    │ Pemeliharaan utilitas │ -6.2100, 106.8500   │
│ 17/01/2024  │ Tim Survey   │ 13:00 - 16:00    │ Verifikasi data      │ -6.2050, 106.8400   │
└─────────────┴──────────────┴──────────────────┴──────────────────────┴──────────────────────┘
```

### Contoh 2: Tabel Minimal

```
┌─────────────┬──────────────────┬──────────────────────┐
│ Tanggal     │ Waktu            │ Deskripsi            │
├─────────────┼──────────────────┼──────────────────────┤
│ 15/01/2024  │ 08:00 - 17:00    │ Survei lapangan area │
│ 16/01/2024  │ 09:00 - 12:00    │ Pemeliharaan utilitas │
│ 17/01/2024  │ 13:00 - 16:00    │ Verifikasi data      │
└─────────────┴──────────────────┴──────────────────────┘
```

## Troubleshooting

### Error: "Gagal memproses file"

**Penyebab**: File tidak memiliki tabel atau teks yang sesuai format.

**Solusi**:
- Pastikan dokumen memiliki tabel dengan kolom yang jelas
- Atau gunakan format teks dengan tanggal dan waktu yang terstruktur
- Periksa apakah seluruh data terlihat dengan benar di Word

### Error: "Tidak ada data yang dapat diekstrak"

**Penyebab**: Format tabel atau data tidak sesuai dengan yang diharapkan.

**Solusi**:
- Verifikasi format tanggal: gunakan format `DD/MM/YYYY`, `DD-MM-YYYY`, atau `YYYY-MM-DD`
- Verifikasi format waktu: gunakan format `HH:MM` atau `HH:MM - HH:MM`
- Pastikan kolom tabel memiliki data yang lengkap
- Hindari merge cells dalam tabel yang dapat mengganggu parsing

### Error: "Ukuran file terlalu besar"

**Penyebab**: File .docx lebih besar dari 10 MB.

**Solusi**:
- Kurangi isi dokumen (hapus gambar, format kompleks)
- Pisahkan data menjadi beberapa file lebih kecil
- Konversi ke format teks jika memungkinkan

### Hanya beberapa baris yang terimpor

**Penyebab**: Format data tidak konsisten dalam dokumen.

**Solusi**:
- Pastikan semua baris memiliki format yang sama
- Jangan gunakan gabungan sel vertikal (rowspan/colspan)
- Pastikan tanggal terisi di setiap baris atau gunakan format yang memungkinkan inherit tanggal dari baris sebelumnya

## Tips Terbaik

1. **Gunakan tabel bukan teks**: Tabel memberikan hasil parsing yang lebih akurat
2. **Konsisten dengan format**: Gunakan format tanggal dan waktu yang sama di seluruh dokumen
3. **Review pratinjau**: Selalu review data di dialog preview sebelum mengimpor
4. **Backup data**: Jika melakukan impor massal pertama kali, sebaiknya backup data terlebih dahulu
5. **Mulai dari yang kecil**: Test dengan impor 10-20 baris terlebih dahulu sebelum impor data besar

## Format Data yang Dihasilkan

Setiap baris yang berhasil diparsing akan menghasilkan:

```json
{
  "date": "2024-01-15",           // Format: YYYY-MM-DD
  "startTime": "08:00",           // Format: HH:MM (nullable)
  "endTime": "17:00",             // Format: HH:MM (nullable)
  "description": "Survei lapangan", // String deskripsi
  "coordinates": "-6.2088, 106.8456" // Opsional, dari kolom 5
}
```

Data ini kemudian akan disimpan sebagai aktivitas baru dalam sistem.

## Dukungan Teknis

Jika mengalami masalah:

1. Buka Developer Tools (F12) → Console tab
2. Cari pesan error yang detail
3. Screenshot pesan error dan struktur tabel dokumen
4. Hubungi tim support dengan informasi tersebut

---

**Catatan**: Fitur impor menggunakan [Mammoth.js](https://github.com/mwilkinson/mammoth.js) untuk konversi DOCX ke HTML dan [Cheerio](https://cheerio.js.org/) untuk parsing data.