-- Penanda asal aktivitas dari sumber luar (mis. Google Tasks), supaya impor
-- ulang tidak membuat duplikat.
--
-- Jalankan sekali di Supabase SQL Editor.

alter table public.activities
  add column if not exists external_id text;

-- Satu task hanya boleh masuk sekali per pengguna.
create unique index if not exists activities_user_external_id_key
  on public.activities (user_id, external_id)
  where external_id is not null;

comment on column public.activities.external_id is
  'ID unik dari sumber luar, mis. google-task:<taskId>. NULL untuk aktivitas manual.';
