import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types/database.types'

interface AuthContextType {
  user: User | null
  session: Session | null
  role: UserRole | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      setLoading(false)
    }, 10000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(safetyTimeout)
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserRole(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserRole(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setRole(null)
        setLoading(false)
      }
    })

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            setSession(session)
            setUser(session.user)
          } else {
            setSession(null)
            setUser(null)
            setRole(null)
          }
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const fetchUserRole = async (userId: string) => {
    try {
      const cachedRole = localStorage.getItem(`role-${userId}`)
      if (cachedRole) {
        setRole(cachedRole as UserRole)
        setLoading(false)
      }

      const { data, error } = await supabase
        .from('users')
        .select('role, nombre_completo, activo')
        .eq('id', userId)
        .single()

      if (error || !data) {
        if (!cachedRole) await ensureUserExists(userId)
      } else {
        setRole(data.role)
        localStorage.setItem(`role-${userId}`, data.role)
        setLoading(false)
      }
    } catch (error) {
      console.error('❌ Error al obtener rol:', error)
      setLoading(false)
    }
  }

  const ensureUserExists = async (_userId: string) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const { error } = await supabase
          .from('users')
          .upsert({
            id: authUser.id,
            email: authUser.email!,
            role: 'pal',
            nombre_completo: authUser.email!,
            activo: true
          })
        
        if (!error) {
          setRole('pal')
        }
      }
    } catch (error) {
      console.error('Error al crear usuario:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.warn('Error al cerrar sesión en Supabase:', error)
    } finally {
      if (user) localStorage.removeItem(`role-${user.id}`)
      localStorage.removeItem('control-pals-auth')
      setRole(null)
      setUser(null)
      setSession(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}