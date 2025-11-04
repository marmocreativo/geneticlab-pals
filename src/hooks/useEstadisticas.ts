// src/hooks/useEstadisticas.ts

import { useState, useEffect } from 'react';
import { estadisticasService, type EstadisticasGenerales, type ContactoPorPal, type ContactoPorInstitucion, type ContactoPorTipo } from '@/services/estadisticasService';

interface FiltrosFecha {
  fechaInicio?: string;
  fechaFin?: string;
}

export const useEstadisticas = (filtros?: FiltrosFecha) => {
  const [estadisticasGenerales, setEstadisticasGenerales] = useState<EstadisticasGenerales | null>(null);
  const [contactosPorPal, setContactosPorPal] = useState<ContactoPorPal[]>([]);
  const [contactosPorInstitucion, setContactosPorInstitucion] = useState<ContactoPorInstitucion[]>([]);
  const [contactosPorTipo, setContactosPorTipo] = useState<ContactoPorTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);

      const [generales, porPal, porInstitucion, porTipo] = await Promise.all([
        estadisticasService.obtenerEstadisticasGenerales(
          filtros?.fechaInicio,
          filtros?.fechaFin
        ),
        estadisticasService.obtenerContactosPorPal(
          filtros?.fechaInicio,
          filtros?.fechaFin
        ),
        estadisticasService.obtenerContactosPorInstitucion(
          filtros?.fechaInicio,
          filtros?.fechaFin
        ),
        estadisticasService.obtenerContactosPorTipo(
          filtros?.fechaInicio,
          filtros?.fechaFin
        ),
      ]);

      setEstadisticasGenerales(generales);
      setContactosPorPal(porPal);
      setContactosPorInstitucion(porInstitucion);
      setContactosPorTipo(porTipo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
      console.error('Error cargando estadísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
  }, [filtros?.fechaInicio, filtros?.fechaFin]);

  return {
    estadisticasGenerales,
    contactosPorPal,
    contactosPorInstitucion,
    contactosPorTipo,
    loading,
    error,
    refetch: cargarEstadisticas,
  };
};