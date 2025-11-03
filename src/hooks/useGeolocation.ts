import { useState, useCallback } from 'react';
import {
  obtenerUbicacionActual,
  soportaGeolocalizacion,
  type Coordenadas,
} from '@/lib/geolocation';

interface UseGeolocationReturn {
  coordenadas: Coordenadas | null;
  cargando: boolean;
  error: string | null;
  obtenerUbicacion: () => Promise<void>;
  soportado: boolean;
}

export const useGeolocation = (): UseGeolocationReturn => {
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const soportado = soportaGeolocalizacion();

  const obtenerUbicacion = useCallback(async () => {
    if (!soportado) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const coords = await obtenerUbicacionActual();
      setCoordenadas(coords);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido';
      setError(mensaje);
      setCoordenadas(null);
    } finally {
      setCargando(false);
    }
  }, [soportado]);

  return {
    coordenadas,
    cargando,
    error,
    obtenerUbicacion,
    soportado,
  };
};