import { useState, useEffect } from 'react';
import { contactosService } from '@/services/contactosService';
import type { Contacto, ContactoFormData, ContactoConfirmData } from '@/types/contacto';
import { toast } from 'sonner';

export function useContactos(palId: string) {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [contactosProgramados, setContactosProgramados] = useState<Contacto[]>([]);
  const [contactosConfirmados, setContactosConfirmados] = useState<Contacto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContactos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contactosService.getContactos(palId);
      console.log('📊 Total contactos cargados:', data.length, data); // AGREGAR ESTO
      setContactos(data);

      const programados = await contactosService.getContactosProgramados(palId);
      console.log('📊 Contactos programados:', programados.length, programados); // AGREGAR ESTO
      setContactosProgramados(programados);

      const confirmados = await contactosService.getContactosConfirmados(palId);
      console.log('📊 Contactos confirmados:', confirmados.length, confirmados); // AGREGAR ESTO
      setContactosConfirmados(confirmados);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar contactos';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (palId) {
      fetchContactos();
    }
  }, [palId]);

  const createContacto = async (formData: ContactoFormData) => {
    try {
      setLoading(true);
      const contacto = await contactosService.createContacto(palId, formData);
      await fetchContactos();
      toast.success('Visita programada exitosamente');
      return contacto;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear contacto';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const confirmContacto = async (
    id: string,
    formData: ContactoConfirmData,
    fotos?: File[]
  ) => {
    try {
      setLoading(true);
      const contacto = await contactosService.confirmContacto(id, formData);

      // Subir fotos si existen
      if (fotos && fotos.length > 0) {
        for (const foto of fotos) {
          const url = await contactosService.uploadFoto(contacto.id, foto);
          await contactosService.saveFotoEvidencia(contacto.id, url);
        }
      }

      await fetchContactos();
      toast.success('Visita confirmada exitosamente');
      return contacto;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al confirmar contacto';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateContacto = async (
    id: string,
    formData: Partial<ContactoFormData>
  ) => {
    try {
      setLoading(true);
      await contactosService.updateContacto(id, formData);
      await fetchContactos();
      toast.success('Contacto actualizado exitosamente');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar contacto';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteContacto = async (id: string) => {
    try {
      setLoading(true);
      await contactosService.deleteContacto(id);
      await fetchContactos();
      toast.success('Contacto eliminado exitosamente');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar contacto';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    contactos,
    contactosProgramados,
    contactosConfirmados,
    loading,
    error,
    createContacto,
    confirmContacto,
    updateContacto,
    deleteContacto,
    refetch: fetchContactos,
  };
}