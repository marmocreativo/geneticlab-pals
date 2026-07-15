import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Contacto } from '@/types/contacto'

const normalizar = (texto: string) =>
  texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

interface VerificarParams {
  nombre: string
  apellido_pat?: string
  apellido_mat?: string
  institucion_id?: string | null
}

export function useVerificarContactoDuplicado() {
  const { user } = useAuth()
  const [verificando, setVerificando] = useState(false)

  const verificar = useCallback(async ({
    nombre,
    apellido_pat,
    apellido_mat,
    institucion_id,
  }: VerificarParams): Promise<Contacto[]> => {
    if (!user?.id || !nombre.trim()) return []

    try {
      setVerificando(true)

      const { data, error } = await supabase
        .from('contactos')
        .select('*, institucion:instituciones(id, nombre)')
        .eq('pal_id', user.id)

      if (error) throw error

      const nombreBuscado = normalizar(
        [nombre, apellido_pat, apellido_mat].filter(Boolean).join(' ')
      )

      const coincidencias = (data || []).filter((c) => {
        const nombreExistente = normalizar(
          [c.nombre, c.apellido_pat, c.apellido_mat].filter(Boolean).join(' ')
        )
        return nombreExistente === nombreBuscado
      })

      // Si se especifica institución, prioriza coincidencias de la misma institución primero
      if (institucion_id) {
        coincidencias.sort((a, b) => {
          const aMatch = a.institucion_id === institucion_id ? -1 : 0
          const bMatch = b.institucion_id === institucion_id ? -1 : 0
          return aMatch - bMatch
        })
      }

      return coincidencias
    } catch (err) {
      console.error('Error verificando contacto duplicado:', err)
      return []
    } finally {
      setVerificando(false)
    }
  }, [user?.id])

  return { verificar, verificando }
}