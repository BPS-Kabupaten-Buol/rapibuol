-- Board Eisenhower: kuadran aktivitas.
--
-- Jalankan sekali di Supabase SQL Editor (project RapiBuol) sebelum memakai
-- kolom board. Tanpa kolom ini, memindahkan kartu akan gagal dengan pesan
-- "kolom quadrant belum ada".

alter table public.activities
  add column if not exists quadrant text
  constraint activities_quadrant_check
  check (
    quadrant is null
    or quadrant in ('do-first', 'schedule', 'delegate', 'eliminate')
  );

comment on column public.activities.quadrant is
  'Kuadran Eisenhower: do-first | schedule | delegate | eliminate. NULL dianggap do-first.';
