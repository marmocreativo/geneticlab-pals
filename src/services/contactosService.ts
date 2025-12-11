import { supabase } from '@/lib/supabase'
import type { Contacto, ContactoInsert, ContactoUpdate } from '@/types/contacto'

export const contactosService = {
  async getContactos() {
    const { data, error } = await supabase
      .from('contactos')
      .select(`
        *,
        institucion:instituciones (
          id,
          nombre
        )
      `)
      .order('nombre', { ascending: true })

    if (error) throw error
    return data as Contacto[]
  },

  // Obtener solo pacientes de un PAL específico
async getPacientesByUser(userId: string) {
  const { data, error } = await supabase
    .from('contactos')
    .select(`
      *,
      institucion:instituciones (
        id,
        nombre
      )
    `)
    .eq('pal_id', userId)
    .eq('tipo_contacto', 'paciente')
    .order('nombre', { ascending: true })

  if (error) throw error
  return data as Contacto[]
},

// Obtener pacientes de una institución específica para un PAL
async getPacientesByUserAndInstitucion(userId: string, institucionId: string) {
  const { data, error } = await supabase
    .from('contactos')
    .select(`
      *,
      institucion:instituciones (
        id,
        nombre
      )
    `)
    .eq('pal_id', userId)
    .eq('tipo_contacto', 'paciente')
    .eq('institucion_id', institucionId)
    .order('nombre', { ascending: true })

  if (error) throw error
  return data as Contacto[]
},

// Buscar pacientes de un PAL con filtro de texto
async buscarPacientesByUser(userId: string, texto: string) {
  const { data, error } = await supabase
    .from('contactos')
    .select(`
      *,
      institucion:instituciones (
        id,
        nombre
      )
    `)
    .eq('pal_id', userId)
    .eq('tipo_contacto', 'paciente')
    .or(`nombre.ilike.%${texto}%,apellido_pat.ilike.%${texto}%,apellido_mat.ilike.%${texto}%`)
    .order('nombre', { ascending: true })

  if (error) throw error
  return data as Contacto[]
},

  async getContactosByTipo(tipo: string) {
    const { data, error } = await supabase
      .from('contactos')
      .select(`
        *,
        institucion:instituciones (
          id,
          nombre
        )
      `)
      .eq('tipo_contacto', tipo)
      .order('nombre', { ascending: true })

    if (error) throw error
    return data as Contacto[]
  },

  // NUEVO: Obtener contactos por institución
  async getContactosByInstitucion(institucionId: string) {
    const { data, error } = await supabase
      .from('contactos')
      .select(`
        *,
        institucion:instituciones (
          id,
          nombre
        )
      `)
      .eq('institucion_id', institucionId)
      .order('nombre', { ascending: true })

    if (error) throw error
    return data as Contacto[]
  },

  async getContactoById(id: string) {
    const { data, error } = await supabase
      .from('contactos')
      .select(`
        *,
        institucion:instituciones (
          id,
          nombre
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Contacto
  },

  async createContacto(contacto: ContactoInsert) {
    const { data, error } = await supabase
      .from('contactos')
      .insert(contacto)
      .select(`
        *,
        institucion:instituciones (
          id,
          nombre
        )
      `)
      .single()

    if (error) throw error
    return data as Contacto
  },

  async updateContacto(id: string, updates: ContactoUpdate) {
    const { data, error } = await supabase
      .from('contactos')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        institucion:instituciones (
          id,
          nombre
        )
      `)
      .single()

    if (error) throw error
    return data as Contacto
  },

  async deleteContacto(id: string) {
    const { error } = await supabase
      .from('contactos')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Método para calcular edad a partir de fecha de nacimiento
  calcularEdad(fechaNacimiento: string): number {
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    
    return edad
  },

  // Método para formatear nombre completo
  formatearNombreCompleto(contacto: Contacto): string {
    const partes = [
      contacto.nombre,
      contacto.apellido_pat,
      contacto.apellido_mat
    ].filter(Boolean)
    
    return partes.join(' ')
  },

  // Buscar contactos por texto
  async buscarContactos(texto: string) {
    const { data, error } = await supabase
      .from('contactos')
      .select(`
        *,
        institucion:instituciones (
          id,
          nombre
        )
      `)
      .or(`nombre.ilike.%${texto}%,apellido_pat.ilike.%${texto}%,apellido_mat.ilike.%${texto}%`)
      .order('nombre', { ascending: true })

    if (error) throw error
    return data as Contacto[]
  },

  // NUEVO: Buscar contactos por texto dentro de una institución específica
  async buscarContactosEnInstitucion(texto: string, institucionId: string) {
    const { data, error } = await supabase
      .from('contactos')
      .select(`
        *,
        institucion:instituciones (
          id,
          nombre
        )
      `)
      .eq('institucion_id', institucionId)
      .or(`nombre.ilike.%${texto}%,apellido_pat.ilike.%${texto}%,apellido_mat.ilike.%${texto}%`)
      .order('nombre', { ascending: true })

    if (error) throw error
    return data as Contacto[]
  }
}