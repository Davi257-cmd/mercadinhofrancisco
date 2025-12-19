import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  type ReactNode 
} from 'react'
import { supabase } from '../services/supabase'
import { db, getLocalAuth, saveLocalAuth, clearLocalAuth } from '../db/dexie'
import type { LocalAuth, UserRole } from '../types'

interface AuthContextType {
  user: LocalAuth | null
  isAuthenticated: boolean
  isLoading: boolean
  isOnline: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  loginWithPin: (pin: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalAuth | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load user from local storage on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const localAuth = await getLocalAuth()
        if (localAuth) {
          setUser(localAuth)
        }
      } catch (error) {
        console.error('Error loading local auth:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadUser()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Try online login first
      if (isOnline) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          return { success: false, error: error.message }
        }

        if (data.user) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('users_profile')
            .select('*')
            .eq('id', data.user.id)
            .single()

          const localAuth: LocalAuth = {
            id: crypto.randomUUID(),
            userId: data.user.id,
            email: data.user.email || email,
            name: profile?.name || email.split('@')[0] || 'Usuário',
            role: (profile?.role as UserRole) || 'operator',
            companyId: profile?.company_id || '00000000-0000-0000-0000-000000000001',
            lastLoginAt: new Date().toISOString(),
          }

          await saveLocalAuth(localAuth)
          setUser(localAuth)
          return { success: true }
        }
      }

      return { success: false, error: 'Sem conexão com a internet' }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Erro ao fazer login' }
    } finally {
      setIsLoading(false)
    }
  }, [isOnline])

  const loginWithPin = useCallback(async (pin: string) => {
    try {
      const localAuth = await getLocalAuth()
      if (localAuth && localAuth.pin === pin) {
        setUser(localAuth)
        return { success: true }
      }
      return { success: false, error: 'PIN incorreto' }
    } catch (error) {
      console.error('PIN login error:', error)
      return { success: false, error: 'Erro ao fazer login com PIN' }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      if (isOnline) {
        await supabase.auth.signOut()
      }
      await clearLocalAuth()
      await db.events.where('syncStatus').equals('synced').delete()
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }, [isOnline])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isOnline,
        login,
        logout,
        loginWithPin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

