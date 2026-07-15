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
  },

  // Fusiona dos contactos: reasigna todo lo relacionado con idEliminar hacia idConservar, luego borra idEliminar
  async fusionarContactos(idConservar: string, idEliminar: string) {
    // 1. Actividades donde el contacto es el contacto principal
    const { error: errorActividades } = await supabase
      .from('actividades')
      .update({ contacto_id: idConservar })
      .eq('contacto_id', idEliminar)

    if (errorActividades) throw new Error(`Error actualizando actividades: ${errorActividades.message}`)

    // 2. Fichas donde el contacto es el paciente
    const { error: errorFichaPaciente } = await supabase
      .from('ficha_paciente')
      .update({ paciente_id: idConservar })
      .eq('paciente_id', idEliminar)

    if (errorFichaPaciente) throw new Error(`Error actualizando fichas (paciente): ${errorFichaPaciente.message}`)

    // 3. Fichas donde el contacto es el doctor
    const { error: errorFichaDoctor } = await supabase
      .from('ficha_paciente')
      .update({ doctor_id: idConservar })
      .eq('doctor_id', idEliminar)

    if (errorFichaDoctor) throw new Error(`Error actualizando fichas (doctor): ${errorFichaDoctor.message}`)

    // 4. Relación ficha_contactos
    const { error: errorFichaContactos } = await supabase
      .from('ficha_contactos')
      .update({ contacto_id: idConservar })
      .eq('contacto_id', idEliminar)

    if (errorFichaContactos) throw new Error(`Error actualizando ficha_contactos: ${errorFichaContactos.message}`)

    // 5. Eliminar el contacto duplicado (sin .select(), evita falsos negativos por policy de SELECT)
    const { error: errorDelete, status } = await supabase
      .from('contactos')
      .delete()
      .eq('id', idEliminar)

    if (errorDelete) throw new Error(`Error eliminando contacto duplicado: ${errorDelete.message}`)

    console.log('Delete status:', status) // 204 = éxito sin body
  },
  
}
