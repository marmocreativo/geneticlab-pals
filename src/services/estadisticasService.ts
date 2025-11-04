// src/services/estadisticasService.ts

import { supabase } from '@/lib/supabase';

export interface EstadisticasGenerales {
  totalContactos: number;
  totalProgramados: number;
  totalConfirmados: number;
  totalCancelados: number;
  totalPresenciales: number;
  totalTelefonicos: number;
}

export interface ContactoPorPal {
  pal_id: string;
  pal_nombre: string;
  total: number;
  confirmados: number;
  programados: number;
}

export interface ContactoPorInstitucion {
  institucion_id: string;
  institucion_nombre: string;
  total: number;
}

export interface ContactoPorTipo {
  tipo: 'presencial' | 'telefonico';
  total: number;
}

export const estadisticasService = {
  // Obtener estadísticas generales por período
  async obtenerEstadisticasGenerales(
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<EstadisticasGenerales> {
    let query = supabase.from('contactos').select('estado, tipo_contacto');

    if (fechaInicio) {
      query = query.gte('fecha_contacto', fechaInicio);
    }
    if (fechaFin) {
      query = query.lte('fecha_contacto', fechaFin);
    }

    const { data, error } = await query;

    if (error) throw error;

    const estadisticas: EstadisticasGenerales = {
      totalContactos: data?.length || 0,
      totalProgramados: data?.filter((c) => c.estado === 'programado').length || 0,
      totalConfirmados: data?.filter((c) => c.estado === 'confirmado').length || 0,
      totalCancelados: data?.filter((c) => c.estado === 'cancelado').length || 0,
      totalPresenciales: data?.filter((c) => c.tipo_contacto === 'presencial').length || 0,
      totalTelefonicos: data?.filter((c) => c.tipo_contacto === 'telefonico').length || 0,
    };

    return estadisticas;
  },

  // Obtener contactos agrupados por PAL
  async obtenerContactosPorPal(
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<ContactoPorPal[]> {
    let query = supabase
      .from('contactos')
      .select(`
        pal_id,
        estado,
        users!contactos_pal_id_fkey(nombre_completo)
      `);

    if (fechaInicio) {
      query = query.gte('fecha_contacto', fechaInicio);
    }
    if (fechaFin) {
      query = query.lte('fecha_contacto', fechaFin);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Agrupar por PAL
    const agrupado = data?.reduce((acc: Record<string, any>, contacto: any) => {
      const palId = contacto.pal_id;
      if (!acc[palId]) {
        acc[palId] = {
          pal_id: palId,
          pal_nombre: contacto.users?.nombre_completo || 'Sin nombre',
          total: 0,
          confirmados: 0,
          programados: 0,
        };
      }
      acc[palId].total++;
      if (contacto.estado === 'confirmado') acc[palId].confirmados++;
      if (contacto.estado === 'programado') acc[palId].programados++;
      return acc;
    }, {});

    return Object.values(agrupado || {});
  },

  // Obtener contactos agrupados por institución
  async obtenerContactosPorInstitucion(
    fechaInicio?: string,
    fechaFin?: string,
    limite: number = 10
  ): Promise<ContactoPorInstitucion[]> {
    let query = supabase
      .from('contactos')
      .select(`
        institucion_id,
        instituciones!contactos_institucion_id_fkey(nombre)
      `);

    if (fechaInicio) {
      query = query.gte('fecha_contacto', fechaInicio);
    }
    if (fechaFin) {
      query = query.lte('fecha_contacto', fechaFin);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Agrupar por institución
    const agrupado = data?.reduce((acc: Record<string, any>, contacto: any) => {
      const instId = contacto.institucion_id;
      if (!acc[instId]) {
        acc[instId] = {
          institucion_id: instId,
          institucion_nombre: contacto.instituciones?.nombre || 'Sin nombre',
          total: 0,
        };
      }
      acc[instId].total++;
      return acc;
    }, {});

    // Ordenar por total y limitar
    return Object.values(agrupado || {})
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, limite);
  },

  // Obtener contactos agrupados por tipo
  async obtenerContactosPorTipo(
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<ContactoPorTipo[]> {
    let query = supabase.from('contactos').select('tipo_contacto');

    if (fechaInicio) {
      query = query.gte('fecha_contacto', fechaInicio);
    }
    if (fechaFin) {
      query = query.lte('fecha_contacto', fechaFin);
    }

    const { data, error } = await query;

    if (error) throw error;

    const presenciales = data?.filter((c) => c.tipo_contacto === 'presencial').length || 0;
    const telefonicos = data?.filter((c) => c.tipo_contacto === 'telefonico').length || 0;

    return [
      { tipo: 'presencial', total: presenciales },
      { tipo: 'telefonico', total: telefonicos },
    ];
  },
};