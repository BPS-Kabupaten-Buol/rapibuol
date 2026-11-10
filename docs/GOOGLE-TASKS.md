# Impor Google Tasks

RapiBuol bisa menarik task dari Google Tasks (daftar yang muncul di sidebar
Google Calendar) lalu menyimpannya sebagai aktivitas. Task yang sudah selesai
ikut diimpor dengan status selesai.

## Kenapa OAuth, bukan subscribe iCal

- Task list tidak punya URL `.ics` sendiri, jadi tidak bisa di-"subscribe".
- Google Calendar API hanya mengembalikan event, bukan task.
- Task ada di **Google Tasks API** (`tasks.googleapis.com/tasks/v1`) dan
  memerlukan izin OAuth pengguna.

Google Tasks API mendukung CORS, jadi semua panggilan bisa dilakukan dari
browser — tidak perlu backend.

## Menyiapkan Google Cloud

1. Buat project di [Google Cloud Console](https://console.cloud.google.com/).
2. Aktifkan **Google Tasks API**.
3. Atur **OAuth consent screen** (tipe External cukup), tambahkan scope
   `https://www.googleapis.com/auth/tasks.readonly`.
4. Buat **OAuth client ID** tipe *Web application*.
   - *Authorized JavaScript origins*: origin aplikasi, misal
     `http://localhost:5173` dan domain produksi RapiBuol.
   - *Authorized redirect URIs*: tidak dipakai (memakai model token).
5. Salin Client ID ke `.env`:

   ```
   VITE_GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
   ```

6. Jalankan ulang dev server, lalu jalankan migrasi
   `docs/migrations/2026-11-10-activity-external-id.sql` di Supabase.

## Memakai

1. Buka halaman **Aktivitas** → tombol **Tasks**.
2. Klik **Hubungkan Google**, setujui izin baca Google Tasks.
3. Pilih daftar task → **Muat task**.
4. Periksa pratinjau, lalu **Impor N aktivitas**.

Task yang sudah pernah diimpor otomatis dilewati, jadi aman menekan impor
berulang kali.

## Cara kerja impor

| Google Tasks | RapiBuol |
| --- | --- |
| `title` | `description` |
| `due` (tanggal saja) | `date` |
| `status = completed` | `is_done = true` |
| `id` | `external_id = google-task:<id>` |

- Task tanpa tanggal jatuh tempo dilewati (tidak ada tanggal untuk aktivitas).
- Karena Google Tasks tidak menyimpan jam, `start_time`/`end_time` kosong.
- `external_id` + unique index `(user_id, external_id)` mencegah duplikat.

## Batasan

- Access token Google berlaku ~1 jam dan hanya disimpan di memori browser.
  Setelah kedaluwarsa, klik **Hubungkan Google** lagi (biasanya tanpa popup
  selama izin masih aktif dan kamu masih login Google).
- Sinkronisasi hanya berjalan saat dialog dibuka; tidak ada sync otomatis di
  latar belakang. Untuk itu perlu backend yang menyimpan refresh token.
- Reminder Google Tasks tidak terekspos API, jadi tidak ikut terbawa.
