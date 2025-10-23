import { useState, useEffect } from 'react';
import { pacientesService, type Paciente, type PacienteInput } from '@/services/pacientesService';
import { toast } from 'sonner';

export const usePacientes = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadPacientes = async () => {
    try {
      setLoading(true);
      const data = await pacientesService.getAll();
      setPacientes(data);
    } catch (error) {
      console.error('Error loading pacientes:', error);
      toast.error('Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const searchPacientes = async (query: string) => {
    if (!query.trim()) {
      loadPacientes();
      return;
    }

    try {
      setLoading(true);
      const data = await pacientesService.search(query);
      setPacientes(data);
    } catch (error) {
      console.error('Error searching pacientes:', error);
      toast.error('Error al buscar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const createPaciente = async (paciente: PacienteInput) => {
    try {
      await pacientesService.create(paciente);
      toast.success('Paciente creado exitosamente');
      loadPacientes();
    } catch (error) {
      console.error('Error creating paciente:', error);
      toast.error('Error al crear paciente');
      throw error;
    }
  };

  const updatePaciente = async (id: string, paciente: Partial<PacienteInput>) => {
    try {
      await pacientesService.update(id, paciente);
      toast.success('Paciente actualizado exitosamente');
      loadPacientes();
    } catch (error) {
      console.error('Error updating paciente:', error);
      toast.error('Error al actualizar paciente');
      throw error;
    }
  };

  const deletePaciente = async (id: string) => {
    try {
      await pacientesService.delete(id);
      toast.success('Paciente eliminado exitosamente');
      loadPacientes();
    } catch (error) {
      console.error('Error deleting paciente:', error);
      toast.error('Error al eliminar paciente');
      throw error;
    }
  };

  useEffect(() => {
    loadPacientes();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchPacientes(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return {
    pacientes,
    loading,
    searchQuery,
    setSearchQuery,
    createPaciente,
    updatePaciente,
    deletePaciente,
    refreshPacientes: loadPacientes
  };
};