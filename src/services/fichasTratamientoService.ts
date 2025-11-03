// src/services/fichasTratamientoService.ts

import { supabase } from '@/lib/supabase';
import type { 
  FichaTratamiento, 
  FichaTratamientoFormData, 
  FichaTratamientoConRelaciones,
  FechaTratamiento 
} from '@/types/fichaTratamiento';

export const fichasTratamientoService = {
  // Obtener todas las fichas (con relaciones)
  async getAll(): Promise<FichaTratamientoConRelaciones[]> {
    const { data, error } = await supabase
      .from('fichas_tratamiento')
      .select(`
        *,
        contacto:contactos(id, pal_id),
        institucion:instituciones(id, nombre),
        sector:catalogos!fichas_tratamiento_sector_id_fkey(id, nombre),
        diagnostico:catalogos!fichas_tratamiento_diagnostico_id_fkey(id, nombre),
        terapia:catalogos!fichas_tratamiento_terapia_id_fkey(id, nombre),
        fechas_tratamiento(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Obtener ficha por ID
  async getById(id: string): Promise<FichaTratamientoConRelaciones | null> {
    const { data, error } = await supabase
      .from('fichas_tratamiento')
      .select(`
        *,
        contacto:contactos(id, pal_id),
        institucion:instituciones(id, nombre),
        sector:catalogos!fichas_tratamiento_sector_id_fkey(id, nombre),
        diagnostico:catalogos!fichas_tratamiento_diagnostico_id_fkey(id, nombre),
        terapia:catalogos!fichas_tratamiento_terapia_id_fkey(id, nombre),
        fechas_tratamiento(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Obtener fichas por contacto
  async getByContactoId(contactoId: string): Promise<FichaTratamientoConRelaciones[]> {
    const { data, error } = await supabase
      .from('fichas_tratamiento')
      .select(`
        *,
        contacto:contactos(id, pal_id),
        institucion:instituciones(id, nombre),
        sector:catalogos!fichas_tratamiento_sector_id_fkey(id, nombre),
        diagnostico:catalogos!fichas_tratamiento_diagnostico_id_fkey(id, nombre),
        terapia:catalogos!fichas_tratamiento_terapia_id_fkey(id, nombre),
        fechas_tratamiento(*)
      `)
      .eq('contacto_id', contactoId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Crear ficha con fechas automáticas
  async create(formData: FichaTratamientoFormData): Promise<FichaTratamiento> {
    console.log('🔵 Datos recibidos en servicio:', formData);
    
    const dataToInsert = {
        contacto_id: formData.contacto_id,
        nombre_paciente: formData.nombre_paciente,
        nombre_medico: formData.nombre_medico,
        institucion_id: formData.institucion_id,
        sector_id: formData.sector_id || null,
        diagnostico_id: formData.diagnostico_id || null,
        terapia_id: formData.terapia_id || null,
        dosis: formData.dosis || null,
        periodicidad: formData.periodicidad,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
    };
    
    console.log('🚀 Datos a enviar a Supabase:', dataToInsert);
    
    // 1. Crear la ficha
    const { data: ficha, error: fichaError } = await supabase
        .from('fichas_tratamiento')
        .insert(dataToInsert)
        .select()
        .single();

    if (fichaError) {
        console.error('❌ Error de Supabase:', fichaError);
        throw fichaError;
    }

    // 2. Generar fechas automáticamente
    const fechas = generarFechasTratamiento(
      formData.fecha_inicio,
      formData.fecha_fin,
      formData.periodicidad
    );

    // 3. Insertar fechas
    if (fechas.length > 0) {
      const fechasData = fechas.map(fecha => ({
        ficha_tratamiento_id: ficha.id,
        fecha_programada: fecha,
        asistencia: false,
      }));

      const { error: fechasError } = await supabase
        .from('fechas_tratamiento')
        .insert(fechasData);

      if (fechasError) throw fechasError;
    }

    return ficha;
  },

  // Actualizar ficha (sin modificar fechas)
  async update(id: string, formData: Partial<FichaTratamientoFormData>): Promise<FichaTratamiento> {
    const { data, error } = await supabase
        .from('fichas_tratamiento')
        .update({
        nombre_paciente: formData.nombre_paciente,
        nombre_medico: formData.nombre_medico,
        institucion_id: formData.institucion_id,
        sector_id: formData.sector_id && formData.sector_id.trim() !== '' ? formData.sector_id : null,
        diagnostico_id: formData.diagnostico_id && formData.diagnostico_id.trim() !== '' ? formData.diagnostico_id : null,
        terapia_id: formData.terapia_id && formData.terapia_id.trim() !== '' ? formData.terapia_id : null,
        dosis: formData.dosis && formData.dosis.trim() !== '' ? formData.dosis : null,
        periodicidad: formData.periodicidad,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
  },

  // Eliminar ficha (cascade eliminará las fechas automáticamente)
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('fichas_tratamiento')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Marcar asistencia en una fecha
  async marcarAsistencia(fechaId: string, asistencia: boolean, notas?: string): Promise<FechaTratamiento> {
    const { data, error } = await supabase
      .from('fechas_tratamiento')
      .update({
        asistencia,
        notas: notas || null,
      })
      .eq('id', fechaId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Obtener fechas de una ficha
  async getFechasByFichaId(fichaId: string): Promise<FechaTratamiento[]> {
    const { data, error } = await supabase
      .from('fechas_tratamiento')
      .select('*')
      .eq('ficha_tratamiento_id', fichaId)
      .order('fecha_programada', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};

// Función auxiliar para generar fechas automáticamente
function generarFechasTratamiento(
  fechaInicio: string,
  fechaFin: string,
  periodicidad: 'semanal' | 'bisemanal'
): string[] {
  const fechas: string[] = [];
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  
  const incrementoDias = periodicidad === 'semanal' ? 7 : 14;
  let fechaActual = new Date(inicio);

  // Limitar a máximo 20 fechas
  let contador = 0;
  const maxFechas = 20;

  while (fechaActual <= fin && contador < maxFechas) {
    fechas.push(fechaActual.toISOString().split('T')[0]);
    fechaActual.setDate(fechaActual.getDate() + incrementoDias);
    contador++;
  }

  return fechas;
}