import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Contacto } from '@/types/contacto'

const normalizarNombre = (c: Pick<Contacto, 'nombre' | 'apellido_pat' | 'apellido_mat'>) =>
  [c.nombre, c.apellido_pat, c.apellido_mat]
    .filter(Boolean)
    .join(' ')
    .trim()
    .toLowerCase()

export function useContactosDuplicados() {
  const { user } = useAuth()
  const [cantidadDuplicados, setCantidadDuplicados] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchDuplicados = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('contactos')
        .select('id, nombre, apellido_pat, apellido_mat')
        .eq('pal_id', user.id)

      if (error) throw error

      const grupos = (data || []).reduce((acc, c) => {
        const key = normalizarNombre(c)
        if (!key) return acc
        if (!acc[key]) acc[key] = 0
        acc[key]++
        return acc
      }, {} as Record<string, number>)

      const duplicados = Object.values(grupos).filter(count => count > 1).length
      setCantidadDuplicados(duplicados)
    } catch (err) {
      console.error('Error verificando duplicados:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchDuplicados()
  }, [fetchDuplicados])

  return { cantidadDuplicados, loading, refetch: fetchDuplicados }
}