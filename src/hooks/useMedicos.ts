import { useState, useEffect } from 'react';
import { medicosService, type Medico, type MedicoInput } from '@/services/medicosService';
import { toast } from 'sonner';

export const useMedicos = () => {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadMedicos = async () => {
    try {
      setLoading(true);
      const data = await medicosService.getAll();
      setMedicos(data);
    } catch (error) {
      console.error('Error loading medicos:', error);
      toast.error('Error al cargar médicos');
    } finally {
      setLoading(false);
    }
  };

  const searchMedicos = async (query: string) => {
    if (!query.trim()) {
      loadMedicos();
      return;
    }

    try {
      setLoading(true);
      const data = await medicosService.search(query);
      setMedicos(data);
    } catch (error) {
      console.error('Error searching medicos:', error);
      toast.error('Error al buscar médicos');
    } finally {
      setLoading(false);
    }
  };

  const createMedico = async (medico: MedicoInput) => {
    try {
      await medicosService.create(medico);
      toast.success('Médico creado exitosamente');
      loadMedicos();
    } catch (error) {
      console.error('Error creating medico:', error);
      toast.error('Error al crear médico');
      throw error;
    }
  };

  const updateMedico = async (id: string, medico: Partial<MedicoInput>) => {
    try {
      await medicosService.update(id, medico);
      toast.success('Médico actualizado exitosamente');
      loadMedicos();
    } catch (error) {
      console.error('Error updating medico:', error);
      toast.error('Error al actualizar médico');
      throw error;
    }
  };

  const deleteMedico = async (id: string) => {
    try {
      await medicosService.delete(id);
      toast.success('Médico eliminado exitosamente');
      loadMedicos();
    } catch (error) {
      console.error('Error deleting medico:', error);
      toast.error('Error al eliminar médico');
      throw error;
    }
  };

  useEffect(() => {
    loadMedicos();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchMedicos(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return {
    medicos,
    loading,
    searchQuery,
    setSearchQuery,
    createMedico,
    updateMedico,
    deleteMedico,
    refreshMedicos: loadMedicos
  };
};