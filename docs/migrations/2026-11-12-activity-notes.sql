-- Catatan bebas per aktivitas.
--
-- Jalankan sekali di Supabase SQL Editor (project RapiBuol) sebelum memakai
-- kolom catatan. Tanpa kolom ini, menyimpan aktivitas dengan catatan akan
-- gagal dengan pesan "kolom notes belum ada".

alter table public.activities
  add column if not exists notes text;

comment on column public.activities.notes is
  'Catatan bebas untuk aktivitas. NULL berarti tidak ada catatan.';
