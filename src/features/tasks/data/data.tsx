import { Circle, CheckCircle, Boxes, Users } from 'lucide-react'

// Mock teams data as assignor (id references table teams)
export const teams = [
  { value: 1, label: 'Tim Produksi', icon: Users },
  { value: 2, label: 'Tim Distribusi', icon: Users },
  { value: 3, label: 'Tim Neraca', icon: Users },
  { value: 4, label: 'Tim Sosial', icon: Users },
  { value: 5, label: 'Tim IPDS', icon: Users },
  { value: 6, label: 'Tim Umum', icon: Users },
]

// Mock unit measurement data (id references table unit_measurement)
export const units = [
  { value: 1, label: 'Dokumen', icon: Boxes },
  { value: 2, label: 'Laporan', icon: Boxes },
  { value: 3, label: 'Kegiatan', icon: Boxes },
  { value: 4, label: 'Kunjungan', icon: Boxes },
  { value: 5, label: 'Jam', icon: Boxes },
  { value: 6, label: 'Tabel', icon: Boxes },
]

// Status representation map (is_done)
export const statuses = [
  {
    value: true,
    label: 'Selesai',
    icon: CheckCircle,
  },
  {
    value: false,
    label: 'Belum Selesai',
    icon: Circle,
  },
]
