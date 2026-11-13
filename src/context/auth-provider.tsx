import React, { createContext, useContext, useEffect, useState } from 'react'
import { type Session, type User } from '@supabase/supabase-js'
import { toast } from 'sonner'
import {
  clearAllAuthStorage,
  hasRememberMeFlag,
  supabase,
} from '@/lib/supabase'
import {
  clearSessionDeadline,
  getSessionDeadline,
  isSessionExpired,
  setSessionDeadline,
} from '@/lib/session-expiry'

/** Seberapa sering sesi diperiksa saat aplikasi terbuka. */
const SESSION_CHECK_MS = 60 * 1000

type AuthProviderContextType = {
  session: Session | null
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>
}

const AuthProviderContext = createContext<AuthProviderContextType | undefined>(
  undefined
)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Sesi lama (sebelum batas umur ini ada) diberi batas mulai sekarang.
      if (session && getSessionDeadline() === null) {
        setSessionDeadline(hasRememberMeFlag())
      }

      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Keluar otomatis saat batas umur sesi habis atau JWT tidak bisa diperpanjang.
  useEffect(() => {
    let stopped = false
    let expiring = false

    const expire = async () => {
      if (stopped || expiring) return
      expiring = true

      try {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined)
        clearAllAuthStorage()
        clearSessionDeadline()
        toast.error('Sesi berakhir. Silakan masuk lagi.')
      } finally {
        expiring = false
      }
    }

    const check = async () => {
      if (stopped || expiring) return

      const { data } = await supabase.auth.getSession()
      if (stopped) return

      const current = data.session
      if (!current) {
        // Tidak ada sesi: batas umur yang tertinggal cukup dibersihkan.
        if (isSessionExpired()) clearSessionDeadline()
        return
      }

      if (isSessionExpired()) {
        await expire()
        return
      }

      // getSession() sudah mencoba memperpanjang token; kalau tetap lewat
      // masa berlakunya, sesi memang tidak bisa dipakai lagi.
      if (current.expires_at && current.expires_at * 1000 <= Date.now()) {
        await expire()
      }
    }

    void check()

    const interval = window.setInterval(check, SESSION_CHECK_MS)
    const onWake = () => void check()
    document.addEventListener('visibilitychange', onWake)
    window.addEventListener('focus', onWake)

    return () => {
      stopped = true
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onWake)
      window.removeEventListener('focus', onWake)
    }
  }, [])

  const signIn = async (email: string, password: string, rememberMe?: boolean) => {
    if (rememberMe !== undefined) {
      localStorage.setItem('rapibuol_remember_me', rememberMe ? 'true' : 'false')
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (!error) setSessionDeadline(rememberMe ?? false)
    return { error: error ? new Error(error.message) : null }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error: error ? new Error(error.message) : null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    clearAllAuthStorage()
    clearSessionDeadline()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: error ? new Error(error.message) : null }
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { error: error ? new Error(error.message) : null }
  }

  return (
    <AuthProviderContext.Provider
      value={{
        session,
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthProviderContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthProviderContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
