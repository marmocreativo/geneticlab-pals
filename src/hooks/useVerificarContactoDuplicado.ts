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

export type TipoCoincidencia = 'exacta' | 'parcial' | 'ninguna'

interface ResultadoVerificacion {
  tipo: TipoCoincidencia
  coincidencias: Contacto[]
}

export function useVerificarContactoDuplicado() {
  const { user } = useAuth()
  const [verificando, setVerificando] = useState(false)

  const verificar = useCallback(async ({
    nombre,
    apellido_pat,
    apellido_mat,
    institucion_id,
  }: VerificarParams): Promise<ResultadoVerificacion> => {
    if (!user?.id || !nombre.trim()) return { tipo: 'ninguna', coincidencias: [] }

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
      const tokensBuscado = nombreBuscado.split(' ').filter(Boolean)

      const ordenar = (lista: Contacto[]) => {
        if (!institucion_id) return lista
        return [...lista].sort((a, b) => {
          const aMatch = a.institucion_id === institucion_id ? -1 : 0
          const bMatch = b.institucion_id === institucion_id ? -1 : 0
          return aMatch - bMatch
        })
      }

      const exactas: Contacto[] = []
      const parciales: Contacto[] = []

      for (const c of data || []) {
        const nombreExistente = normalizar(
          [c.nombre, c.apellido_pat, c.apellido_mat].filter(Boolean).join(' ')
        )

        if (nombreExistente === nombreBuscado) {
          exactas.push(c)
          continue
        }

        const tokensExistente = nombreExistente.split(' ').filter(Boolean)
        const coincidentes = tokensBuscado.filter(t => tokensExistente.includes(t)).length
        const minimoRequerido = Math.min(2, tokensBuscado.length)

        if (coincidentes >= minimoRequerido) {
          parciales.push(c)
        }
      }

      if (exactas.length > 0) return { tipo: 'exacta', coincidencias: ordenar(exactas) }
      if (parciales.length > 0) return { tipo: 'parcial', coincidencias: ordenar(parciales) }
      return { tipo: 'ninguna', coincidencias: [] }
    } catch (err) {
      console.error('Error verificando contacto duplicado:', err)
      return { tipo: 'ninguna', coincidencias: [] }
    } finally {
      setVerificando(false)
    }
  }, [user?.id])

  return { verificar, verificando }
}