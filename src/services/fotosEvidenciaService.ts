// services/fotosEvidenciaService.ts
import { supabase } from '@/lib/supabase'

async function comprimirImagen(file: File, maxWidth = 1280, quality = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const canvas = document.createElement('canvas')
      let { width, height } = img

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg'
          })
          resolve(compressed)
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }

    img.src = url
  })
}

export const fotosEvidenciaService = {
  async subirFoto(visitaId: string, file: File) {
    try {
      const fileToUpload = file.type.startsWith('image/')
        ? await comprimirImagen(file)
        : file

      const fileName = `${visitaId}-${Date.now()}.jpg`
      const filePath = `evidencias/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('evidencias')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('evidencias')
        .getPublicUrl(filePath)

      if (!urlData.publicUrl) throw new Error('No se pudo obtener la URL pública')

      const { data: fotoData, error: dbError } = await supabase
        .from('fotos_evidencia')
        .insert({
          visita_id: visitaId,
          url_storage: urlData.publicUrl
        })
        .select()
        .single()

      if (dbError) throw dbError

      return {
        id: fotoData.id,
        url: urlData.publicUrl,
        filePath
      }
    } catch (error) {
      console.error('Error subiendo foto:', error)
      throw error
    }
  },

  async getFotosByVisita(visitaId: string) {
    const { data, error } = await supabase
      .from('fotos_evidencia')
      .select('*')
      .eq('visita_id', visitaId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async eliminarFoto(fotoId: string, filePath: string) {
    try {
      const { error: storageError } = await supabase.storage
        .from('evidencias')
        .remove([filePath])

      if (storageError) console.warn('Error eliminando archivo del storage:', storageError)

      const { error: dbError } = await supabase
        .from('fotos_evidencia')
        .delete()
        .eq('id', fotoId)

      if (dbError) throw dbError

      return true
    } catch (error) {
      console.error('Error eliminando foto:', error)
      throw error
    }
  },

  async verificarBucket() {
    try {
      const { error } = await supabase.storage
        .from('evidencias')
        .list('', { limit: 1 })

      if (error) {
        console.error('Error verificando bucket:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error verificando bucket:', error)
      return false
    }
  }
}