import { create } from 'zustand'
import { useAuth } from '@/context/auth-provider'

interface AuthUser {
  id: string
  email: string
  user_metadata?: Record<string, unknown>
}

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  auth: {
    user: null,
    setUser: (user) =>
      set((state) => ({ ...state, auth: { ...state.auth, user } })),
    accessToken: '',
    setAccessToken: (accessToken) =>
      set((state) => ({ ...state, auth: { ...state.auth, accessToken } })),
    resetAccessToken: () =>
      set((state) => ({ ...state, auth: { ...state.auth, accessToken: '' } })),
    reset: () =>
      set((state) => ({
        ...state,
        auth: { ...state.auth, user: null, accessToken: '' },
      })),
  },
}))

export const useSupabaseAuth = () => {
  const auth = useAuth()
  const { auth: storeAuth } = useAuthStore()

  return {
    ...auth,
    storeAuth,
    isAuthenticated: !!auth.session,
  }
}
