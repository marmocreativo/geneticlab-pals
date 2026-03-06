import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types/database.types'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  nombre_completo: string
  telefono: string | null
  activo: boolean
  created_at: string
}

export function useUsers() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const createUser = async (userData: {
    email: string
    password: string
    nombre_completo: string
    role: UserRole
    telefono?: string
  }) => {
    try {
      // Crear usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            role: userData.role,
            nombre_completo: userData.nombre_completo,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Actualizar información adicional
        const { error: updateError } = await supabase
          .from('users')
          .update({
            telefono: userData.telefono || null,
          })
          .eq('id', authData.user.id)

        if (updateError) throw updateError
      }

      await fetchUsers()
      return { success: true }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error al crear usuario' 
      }
    }
  }

  const updateUser = async (id: string, updates: Partial<UserProfile>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      await fetchUsers()
      return { success: true }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error al actualizar usuario' 
      }
    }
  }

  const toggleUserStatus = async (id: string, activo: boolean) => {
    return updateUser(id, { activo })
  }

  const deleteUserComplete = async (id: string) => {
    try {
      const { error } = await supabase.rpc('delete_user_complete', { user_id: id })
      if (error) throw error
      await fetchUsers()
      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error al eliminar usuario'
      }
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUserComplete,
  }
}