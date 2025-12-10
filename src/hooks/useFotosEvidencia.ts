// hooks/useFotosEvidencia.ts
import { useState, useEffect } from 'react'
import { fotosEvidenciaService } from '@/services/fotosEvidenciaService'
import { toast } from 'sonner'

interface FotoEvidencia {
  id: string
  visita_id: string
  url_storage: string
  created_at: string
}

interface UploadResult {
  id: string
  url: string
  filePath: string
}

export function useFotosEvidencia() {
  const [fotos, setFotos] = useState<FotoEvidencia[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [bucketReady, setBucketReady] = useState<boolean | null>(null)

  // Verificar si el bucket está disponible
  useEffect(() => {
    verificarBucket()
  }, [])

  const verificarBucket = async () => {
    try {
      const isReady = await fotosEvidenciaService.verificarBucket()
      setBucketReady(isReady)
      
      if (!isReady) {
        toast.error('El sistema de fotos no está disponible. Contacta al administrador.')
      }
    } catch (error) {
      console.error('Error verificando bucket:', error)
      setBucketReady(false)
    }
  }

  const fetchFotosByVisita = async (visitaId: string) => {
    if (!bucketReady) return

    try {
      setLoading(true)
      const data = await fotosEvidenciaService.getFotosByVisita(visitaId)
      setFotos(data)
    } catch (error) {
      console.error('Error cargando fotos:', error)
      toast.error('Error al cargar las fotos de evidencia')
    } finally {
      setLoading(false)
    }
  }

  const subirFoto = async (visitaId: string, file: File): Promise<UploadResult | null> => {
    if (!bucketReady) {
      toast.error('El sistema de fotos no está disponible')
      return null
    }

    // Validar archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen')
      return null
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB')
      return null
    }

    try {
      setUploading(true)
      toast.loading('Subiendo foto...', { id: 'upload-foto' })

      const result = await fotosEvidenciaService.subirFoto(visitaId, file)
      
      // Actualizar estado local
      const nuevaFoto: FotoEvidencia = {
        id: result.id,
        visita_id: visitaId,
        url_storage: result.url,
        created_at: new Date().toISOString()
      }
      
      setFotos(prev => [nuevaFoto, ...prev])
      
      toast.success('Foto subida exitosamente', { id: 'upload-foto' })
      return result

    } catch (error) {
      console.error('Error subiendo foto:', error)
      toast.error('Error al subir la foto', { id: 'upload-foto' })
      return null
    } finally {
      setUploading(false)
    }
  }

  const eliminarFoto = async (fotoId: string, url: string) => {
    if (!bucketReady) {
      toast.error('El sistema de fotos no está disponible')
      return false
    }

    try {
      // Extraer el filePath de la URL
      const filePath = url.split('/').slice(-2).join('/')
      
      await fotosEvidenciaService.eliminarFoto(fotoId, filePath)
      
      // Actualizar estado local
      setFotos(prev => prev.filter(foto => foto.id !== fotoId))
      
      toast.success('Foto eliminada')
      return true
    } catch (error) {
      console.error('Error eliminando foto:', error)
      toast.error('Error al eliminar la foto')
      return false
    }
  }

  const limpiarFotos = () => {
    setFotos([])
  }

  return {
    fotos,
    loading,
    uploading,
    bucketReady,
    fetchFotosByVisita,
    subirFoto,
    eliminarFoto,
    limpiarFotos
  }
}