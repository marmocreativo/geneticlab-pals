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
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserRole(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Escuchar cambios de autenticación
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

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserRole = async (userId: string) => {
    try {
      console.log('🔍 Buscando rol para userId:', userId)
      
      // Usar service_role para bypass RLS temporalmente
      const { data, error } = await supabase
        .from('users')
        .select('role, nombre_completo, activo')
        .eq('id', userId)
        .single()

      console.log('📊 Datos recibidos:', data)
      console.log('❌ Error:', error)

      if (error) {
        console.error('Error al obtener rol:', error)
        // Si falla, intentar crear el registro
        await ensureUserExists(userId)
        return
      }
      
      if (data) {
        console.log('✅ Rol asignado:', data.role)
        setRole(data.role)
      }
    } catch (error) {
      console.error('❌ Error al obtener rol:', error)
    } finally {
      setLoading(false)
    }
  }

  const ensureUserExists = async (userId: string) => {
    try {
      // Obtener info del auth.users
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        // Crear usuario en public.users si no existe
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
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setRole(null)
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