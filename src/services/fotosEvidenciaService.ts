// services/fotosEvidenciaService.ts
import { supabase } from '@/lib/supabase'

export const fotosEvidenciaService = {
  async subirFoto(visitaId: string, file: File) {
    try {
      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${visitaId}-${Date.now()}.${fileExt}`
      const filePath = `evidencias/${fileName}`

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('evidencias')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Obtener URL pública del archivo
      const { data: urlData } = supabase.storage
        .from('evidencias')
        .getPublicUrl(filePath)

      if (!urlData.publicUrl) throw new Error('No se pudo obtener la URL pública')

      // Guardar registro en la tabla fotos_evidencia
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
      // Eliminar archivo del storage
      const { error: storageError } = await supabase.storage
        .from('evidencias')
        .remove([filePath])

      if (storageError) console.warn('Error eliminando archivo del storage:', storageError)

      // Eliminar registro de la base de datos
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

  // Verificar si el bucket existe y está configurado correctamente
  async verificarBucket() {
    try {
      const {  error } = await supabase.storage
        .from('evidencias')
        .list('', {
          limit: 1
        })

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