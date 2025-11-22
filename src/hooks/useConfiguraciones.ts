import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Configuracion {
  id: string
  clave: string
  valor: string
  tipo: 'numero' | 'texto' | 'boolean'
  descripcion: string | null
  updated_at: string
}

export function useConfiguraciones() {
  const [configuraciones, setConfiguraciones] = useState<Configuracion[]>([])
  const [loading, setLoading] = useState(true)

  const fetchConfiguraciones = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('configuraciones')
        .select('*')
        .order('clave')

      if (error) throw error
      setConfiguraciones(data || [])
    } catch (err) {
      console.error('Error fetching configuraciones:', err)
      toast.error('Error al cargar configuraciones')
    } finally {
      setLoading(false)
    }
  }

  const getConfiguracion = (clave: string): string | null => {
    const config = configuraciones.find(c => c.clave === clave)
    return config ? config.valor : null
  }

  const getConfiguracionNumber = (clave: string): number => {
    const valor = getConfiguracion(clave)
    return valor ? parseFloat(valor) : 0
  }

  useEffect(() => {
    fetchConfiguraciones()
  }, [])

  return {
    configuraciones,
    loading,
    getConfiguracion,
    getConfiguracionNumber,
    fetchConfiguraciones
  }
}