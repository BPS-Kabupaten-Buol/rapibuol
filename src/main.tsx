import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  getErrorMessage,
  handleServerError,
  isAuthFailure,
} from '@/lib/handle-server-error'
import { AuthProvider } from '@/context/auth-provider'
import { OfflineBanner } from '@/components/offline-banner'
import { PWAUpdateNotification } from '@/components/pwa-update-notification'
import { DirectionProvider } from './context/direction-provider'
import { FontProvider } from './context/font-provider'
import { ThemeProvider } from './context/theme-provider'
// Generated Routes
import { routeTree } from './routeTree.gen'
// Styles
import './styles/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (import.meta.env.DEV) return false
        return failureCount <= 3 && !isAuthFailure(error)
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000, // 10s
    },
    mutations: {
      onError: (error) => {
        handleServerError(error)
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (isAuthFailure(error)) {
        toast.error('Sesi berakhir. Silakan masuk lagi.')
        const redirect = `${router.history.location.href}`
        router.navigate({ to: '/sign-in', search: { redirect }, replace: true })
        return
      }

      toast.error(getErrorMessage(error))
    },
  }),
})

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <FontProvider>
            <DirectionProvider>
              <AuthProvider>
                <PWAUpdateNotification />
                <OfflineBanner />
                <RouterProvider router={router} />
              </AuthProvider>
            </DirectionProvider>
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}
