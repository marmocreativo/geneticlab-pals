import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types/database.types'

interface AuthContextType {
  user: User | null
  session: Session | null
  role: UserRole | null
  nombreCompleto: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [nombreCompleto, setNombreCompleto] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  const ensureUserExists = useCallback(async (_userId: string) => {
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
  }, [])

  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      const cached = localStorage.getItem(`user-profile-${userId}`)
      if (cached) {
        const { role, nombreCompleto } = JSON.parse(cached)
        setRole(role as UserRole)
        setNombreCompleto(nombreCompleto)
        setLoading(false)
      }

      const { data, error } = await supabase
        .from('users')
        .select('role, nombre_completo, activo')
        .eq('id', userId)
        .single()

      if (error || !data) {
        if (!cached) await ensureUserExists(userId)
      } else {
        setRole(data.role)
        setNombreCompleto(data.nombre_completo)
        localStorage.setItem(`user-profile-${userId}`, JSON.stringify({
          role: data.role,
          nombreCompleto: data.nombre_completo
        }))
        setLoading(false)
      }
    } catch (error) {
      console.error('❌ Error al obtener rol:', error)
      setLoading(false)
    }
  }, [ensureUserExists])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserRole(session.user.id)
      } else {
        setRole(null)
        setLoading(false)
      }
    })

    // NUEVO: forzar re-check al volver al frente
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setUser(null)
          setSession(null)
          setRole(null)
        }
        // Si hay sesión, onAuthStateChange ya la manejará si hubo refresh
      } catch {
        // Error de red al volver — no hacer nada, el usuario puede reintentar
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchUserRole])

  

  

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const savedEmail = localStorage.getItem('last_login_email')
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.warn('Error al cerrar sesión en Supabase:', error)
    } finally {
      if (user) localStorage.removeItem(`user-profile-${user.id}`)
      localStorage.removeItem('control-pals-auth')
      if (savedEmail) localStorage.setItem('last_login_email', savedEmail)
      setRole(null)
      setNombreCompleto(null)
      setUser(null)
      setSession(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, role, nombreCompleto, loading, signIn, signOut }}>
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