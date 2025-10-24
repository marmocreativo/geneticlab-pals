import { supabase } from '@/lib/supabase';
import type { Contacto, ContactoFormData, ContactoConfirmData } from '@/types/contacto';

export const contactosService = {
  // Obtener todos los contactos del PAL actual
  async getContactos(palId: string): Promise<Contacto[]> {
    const { data, error } = await supabase
      .from('contactos')
      .select('*')
      .eq('pal_id', palId)
      .order('fecha_contacto', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Obtener contactos programados (pendientes de confirmar)
  async getContactosProgramados(palId: string): Promise<Contacto[]> {
    const { data, error } = await supabase
      .from('contactos')
      .select('*')
      .eq('pal_id', palId)
      .eq('estado', 'programado')
      .order('fecha_contacto', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Obtener contactos confirmados
  async getContactosConfirmados(palId: string): Promise<Contacto[]> {
    const { data, error } = await supabase
      .from('contactos')
      .select('*')
      .eq('pal_id', palId)
      .eq('estado', 'confirmado')
      .order('fecha_contacto', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Obtener un contacto por ID
  async getContactoById(id: string): Promise<Contacto | null> {
    const { data, error } = await supabase
      .from('contactos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Crear nuevo contacto (programado)
  async createContacto(
    palId: string,
    formData: ContactoFormData
  ): Promise<Contacto> {
    const { data, error } = await supabase
      .from('contactos')
      .insert({
        pal_id: palId,
        estado: 'programado',
        validacion_gps: false,
        ...formData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Confirmar contacto (después de la visita)
  async confirmContacto(
    id: string,
    formData: ContactoConfirmData
  ): Promise<Contacto> {
    // Verificar si hubo cambios en los datos originales
    const contactoOriginal = await this.getContactoById(id);
    
    const datosModificados =
      contactoOriginal?.nombre !== formData.nombre ||
      contactoOriginal?.apellido_paterno !== formData.apellido_paterno ||
      contactoOriginal?.apellido_materno !== formData.apellido_materno ||
      contactoOriginal?.telefono !== formData.telefono ||
      contactoOriginal?.numero_pm !== formData.numero_pm ||
      contactoOriginal?.contacto_con !== formData.contacto_con ||
      contactoOriginal?.tipo_contacto !== formData.tipo_contacto;

    const { data, error } = await supabase
      .from('contactos')
      .update({
        ...formData,
        estado: 'confirmado',
        confirmado_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Si hubo cambios, podrías agregar un flag o crear un log
        ...(datosModificados && { datos_modificados: true }),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // TODO: Aquí podrías enviar notificación a admins si datosModificados === true
    if (datosModificados) {
      console.log('Datos modificados, notificar a administradores');
      // await this.notifyAdmins(id, contactoOriginal, data);
    }

    return data;
  },

  // Actualizar contacto
  async updateContacto(
    id: string,
    formData: Partial<ContactoFormData>
  ): Promise<Contacto> {
    const { data, error } = await supabase
      .from('contactos')
      .update({
        ...formData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Eliminar contacto
  async deleteContacto(id: string): Promise<void> {
    const { error } = await supabase.from('contactos').delete().eq('id', id);

    if (error) throw error;
  },

  // Subir foto de evidencia
  async uploadFoto(contactoId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${contactoId}-${Date.now()}.${fileExt}`;

    // Obtener el ID del usuario actual
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Organizar por usuario: userId/contactoId-timestamp.ext
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('evidencias')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from('evidencias').getPublicUrl(filePath);

    return publicUrl;
  },

  // Guardar referencia de foto en BD
  async saveFotoEvidencia(
    contactoId: string,
    urlStorage: string
  ): Promise<void> {
    const { error } = await supabase
      .from('fotos_evidencia')
      .insert({ contacto_id: contactoId, url_storage: urlStorage });

    if (error) throw error;
  },

  // Obtener fotos de un contacto
  async getFotosContacto(contactoId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('fotos_evidencia')
      .select('url_storage')
      .eq('contacto_id', contactoId);

    if (error) throw error;
    return data?.map((f) => f.url_storage) || [];
  },
};