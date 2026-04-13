import { useEffect, useState, useCallback } from 'react'

interface PWAUpdateState {
  updateAvailable: boolean
  needRefresh: boolean
}

export function usePWAUpdate() {
  const [state, setState] = useState<PWAUpdateState>({
    updateAvailable: false,
    needRefresh: false,
  })

  const handleRefresh = useCallback(() => {
    window.location.reload()
  }, [])

  const dismissUpdate = useCallback(() => {
    setState({ updateAvailable: false, needRefresh: false })
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return
    }

    const handleControllerChange = () => {
      setState({ updateAvailable: true, needRefresh: true })
    }

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      handleControllerChange
    )

    navigator.serviceWorker.ready.then((registration) => {
      // Check for updates setiap 1 jam
      const interval = setInterval(
        () => {
          registration.update().catch(console.error)
        },
        60 * 60 * 1000
      )

      // Listen untuk service worker installation baru
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // Ada service worker baru yang siap, tampilkan notifikasi
            setState({ updateAvailable: true, needRefresh: false })
          }
        })
      })

      return () => clearInterval(interval)
    })

    return () => {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        handleControllerChange
      )
    }
  }, [])

  return {
    ...state,
    handleRefresh,
    dismissUpdate,
  }
}
