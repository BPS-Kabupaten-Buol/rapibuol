import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const REMEMBER_ME_KEY = 'rapibuol_remember_me'

class RememberMeStorage {
  private getStorage(): Storage {
    const flag = localStorage.getItem(REMEMBER_ME_KEY)
    return flag === 'true' ? localStorage : sessionStorage
  }

  getItem(key: string): string | null {
    return this.getStorage().getItem(key)
  }

  setItem(key: string, value: string): void {
    this.getStorage().setItem(key, value)
  }

  removeItem(key: string): void {
    this.getStorage().removeItem(key)
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new RememberMeStorage(),
    autoRefreshToken: true,
    persistSession: true,
  },
})

export const clearAllAuthStorage = () => {
  const clear = (storage: Storage) => {
    for (let i = storage.length - 1; i >= 0; i--) {
      const key = storage.key(i)
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        storage.removeItem(key)
      }
    }
  }
  clear(localStorage)
  clear(sessionStorage)
  localStorage.removeItem(REMEMBER_ME_KEY)
}
