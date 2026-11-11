import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

/**
 * Penanda kecil di bawah layar selama browser kehilangan koneksi.
 *
 * Hanya memberi tahu; tidak mencoba memuat ulang data.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(() => !navigator.onLine)

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)

    window.addEventListener('online', update)
    window.addEventListener('offline', update)

    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role='status'
      data-print='hide'
      className='fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-center text-xs font-medium text-amber-950'
    >
      <WifiOff className='h-3.5 w-3.5 shrink-0' aria-hidden='true' />
      Anda sedang offline. Data tidak dapat dimuat sampai koneksi kembali.
    </div>
  )
}
