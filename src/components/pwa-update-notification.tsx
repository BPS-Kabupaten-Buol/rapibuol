import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { usePWAUpdate } from '@/hooks/use-pwa-update'
import { Button } from '@/components/ui/button'

/**
 * Komponen untuk menampilkan notifikasi update PWA
 * Menampilkan toast ketika ada update aplikasi yang tersedia
 */
export function PWAUpdateNotification() {
  const { updateAvailable, needRefresh, handleRefresh, dismissUpdate } =
    usePWAUpdate()

  useEffect(() => {
    if (!updateAvailable) {
      return
    }

    if (needRefresh) {
      // Update sudah siap diterapkan (SW baru sudah aktif)
      toast.custom(
        (t) => (
          <div className='flex w-full max-w-sm items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 shadow-lg dark:border-green-900 dark:bg-green-950'>
            <RefreshCw className='mt-0.5 h-5 w-5 shrink-0 animate-spin text-green-600 dark:text-green-400' />
            <div className='flex-1'>
              <h3 className='font-semibold text-green-900 dark:text-green-100'>
                Update Siap Diterapkan
              </h3>
              <p className='mt-1 text-sm text-green-800 dark:text-green-200'>
                Aplikasi telah diperbarui. Muat ulang halaman untuk menggunakan
                versi terbaru.
              </p>
            </div>
            <Button
              size='sm'
              className='mt-0.5 h-8 gap-1.5 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
              onClick={() => {
                handleRefresh()
                toast.dismiss(t)
              }}
            >
              <RefreshCw className='h-4 w-4' />
              Muat Ulang
            </Button>
          </div>
        ),
        {
          duration: Infinity,
          position: 'bottom-right',
        }
      )
    } else {
      // Update tersedia untuk diunduh
      toast.custom(
        (t) => (
          <div className='flex w-full max-w-sm items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-lg dark:border-blue-900 dark:bg-blue-950'>
            <AlertCircle className='mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400' />
            <div className='flex-1'>
              <h3 className='font-semibold text-blue-900 dark:text-blue-100'>
                Update Aplikasi Tersedia
              </h3>
              <p className='mt-1 text-sm text-blue-800 dark:text-blue-200'>
                Versi baru aplikasi telah siap. Perbarui untuk mendapatkan fitur
                terbaru dan perbaikan bug.
              </p>
            </div>
            <div className='flex shrink-0 gap-2'>
              <Button
                size='sm'
                variant='outline'
                className='h-8 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900'
                onClick={() => {
                  dismissUpdate()
                  toast.dismiss(t)
                }}
              >
                Nanti
              </Button>
              <Button
                size='sm'
                className='h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
                onClick={() => {
                  handleRefresh()
                  toast.dismiss(t)
                }}
              >
                <RefreshCw className='h-4 w-4' />
                Update Sekarang
              </Button>
            </div>
          </div>
        ),
        {
          duration: Infinity,
          position: 'bottom-right',
        }
      )
    }

    return () => {
      toast.dismiss()
    }
  }, [updateAvailable, needRefresh, handleRefresh, dismissUpdate])

  return null
}
