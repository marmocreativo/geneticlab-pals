// src/hooks/useFichasTratamiento.ts

import { useState, useEffect } from 'react';
import { fichasTratamientoService } from '@/services/fichasTratamientoService';
import type { 
  FichaTratamientoConRelaciones, 
  FichaTratamientoFormData,
  FechaTratamiento 
} from '@/types/fichaTratamiento';
import { toast } from 'sonner';

export function useFichasTratamiento() {
  const [fichas, setFichas] = useState<FichaTratamientoConRelaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFichas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fichasTratamientoService.getAll();
      setFichas(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar fichas';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getFichaById = async (id: string) => {
    try {
      setLoading(true);
      const data = await fichasTratamientoService.getById(id);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar ficha';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getFichasByContacto = async (contactoId: string) => {
    try {
      setLoading(true);
      const data = await fichasTratamientoService.getByContactoId(contactoId);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar fichas del contacto';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createFicha = async (formData: FichaTratamientoFormData) => {
    try {
      setLoading(true);
      const newFicha = await fichasTratamientoService.create(formData);
      toast.success('Ficha de tratamiento creada exitosamente');
      await fetchFichas();
      return newFicha;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear ficha';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateFicha = async (id: string, formData: Partial<FichaTratamientoFormData>) => {
    try {
      setLoading(true);
      const updatedFicha = await fichasTratamientoService.update(id, formData);
      toast.success('Ficha actualizada exitosamente');
      await fetchFichas();
      return updatedFicha;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar ficha';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteFicha = async (id: string) => {
    try {
      setLoading(true);
      await fichasTratamientoService.delete(id);
      toast.success('Ficha eliminada exitosamente');
      await fetchFichas();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar ficha';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const marcarAsistencia = async (fechaId: string, asistencia: boolean, notas?: string) => {
    try {
      await fichasTratamientoService.marcarAsistencia(fechaId, asistencia, notas);
      toast.success(asistencia ? 'Asistencia registrada' : 'Inasistencia registrada');
      await fetchFichas();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al marcar asistencia';
      toast.error(message);
      throw err;
    }
  };

  const getFechasByFicha = async (fichaId: string): Promise<FechaTratamiento[]> => {
    try {
      const data = await fichasTratamientoService.getFechasByFichaId(fichaId);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar fechas';
      toast.error(message);
      throw err;
    }
  };

  useEffect(() => {
    fetchFichas();
  }, []);

  return {
    fichas,
    loading,
    error,
    fetchFichas,
    getFichaById,
    getFichasByContacto,
    createFicha,
    updateFicha,
    deleteFicha,
    marcarAsistencia,
    getFechasByFicha,
  };
}