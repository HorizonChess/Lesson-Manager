import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Custom storage wrapper with quota error handling
const createStorageWithCleanup = () => {
  return {
    getItem: (key: string) => {
      try {
        return window.localStorage.getItem(key)
      } catch (error) {
        console.error('Storage getItem error:', error)
        return null
      }
    },
    setItem: (key: string, value: string) => {
      try {
        window.localStorage.setItem(key, value)
      } catch (error) {
        // Check if it's a quota exceeded error
        if (error instanceof DOMException && (
          error.name === 'QuotaExceededError' ||
          error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
        )) {
          console.warn('localStorage quota exceeded, clearing old auth data...')

          // Clear all Supabase auth-related keys
          const keysToRemove: string[] = []
          for (let i = 0; i < window.localStorage.length; i++) {
            const storageKeyAtIndex = window.localStorage.key(i)
            if (storageKeyAtIndex && storageKeyAtIndex.startsWith('sb-')) {
              keysToRemove.push(storageKeyAtIndex)
            }
          }

          keysToRemove.forEach(k => window.localStorage.removeItem(k))

          // Retry setting the item
          try {
            window.localStorage.setItem(key, value)
          } catch (retryError) {
            console.error('Failed to set item after cleanup:', retryError)
            throw retryError
          }
        } else {
          throw error
        }
      }
    },
    removeItem: (key: string) => {
      try {
        window.localStorage.removeItem(key)
      } catch (error) {
        console.error('Storage removeItem error:', error)
      }
    }
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorageWithCleanup(),
    storageKey: 'sb-rabfrsssjxcjnmzhyscb-auth-token',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // PKCE returns ?code= instead of tokens in the #hash, which HashRouter would treat as a route
    flowType: 'pkce'
  }
})