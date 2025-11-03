/**
 * Utilidades para manejo de geolocalización y cálculo de distancias
 */

export interface Coordenadas {
  latitud: number;
  longitud: number;
}

export interface ResultadoGPS {
  coordenadas: Coordenadas;
  distanciaMetros: number;
  dentroRango: boolean;
}

/**
 * Convierte grados a radianes
 */
const toRadianes = (grados: number): number => {
  return grados * (Math.PI / 180);
};

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 * @param punto1 Coordenadas del primer punto
 * @param punto2 Coordenadas del segundo punto
 * @returns Distancia en metros
 */
export const calcularDistancia = (
  punto1: Coordenadas,
  punto2: Coordenadas
): number => {
  const RADIO_TIERRA_KM = 6371; // Radio de la Tierra en kilómetros

  const dLat = toRadianes(punto2.latitud - punto1.latitud);
  const dLon = toRadianes(punto2.longitud - punto1.longitud);

  const lat1Rad = toRadianes(punto1.latitud);
  const lat2Rad = toRadianes(punto2.latitud);

  // Fórmula de Haversine
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) *
      Math.sin(dLon / 2) *
      Math.cos(lat1Rad) *
      Math.cos(lat2Rad);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanciaKm = RADIO_TIERRA_KM * c;
  const distanciaMetros = distanciaKm * 1000;

  return Math.round(distanciaMetros);
};

/**
 * Obtiene la ubicación actual del dispositivo
 * @returns Promise con las coordenadas actuales
 */
export const obtenerUbicacionActual = (): Promise<Coordenadas> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no soportada por el navegador'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
        });
      },
      (error) => {
        let mensaje = 'Error al obtener ubicación';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            mensaje = 'Permiso de ubicación denegado';
            break;
          case error.POSITION_UNAVAILABLE:
            mensaje = 'Ubicación no disponible';
            break;
          case error.TIMEOUT:
            mensaje = 'Tiempo de espera agotado';
            break;
        }
        
        reject(new Error(mensaje));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Valida si la ubicación actual está dentro del rango permitido
 * @param ubicacionActual Coordenadas actuales del usuario
 * @param ubicacionObjetivo Coordenadas del objetivo (institución)
 * @param distanciaMaxima Distancia máxima permitida en metros
 * @returns Resultado de la validación GPS
 */
export const validarUbicacion = (
  ubicacionActual: Coordenadas,
  ubicacionObjetivo: Coordenadas,
  distanciaMaxima: number
): ResultadoGPS => {
  const distanciaMetros = calcularDistancia(ubicacionActual, ubicacionObjetivo);
  
  return {
    coordenadas: ubicacionActual,
    distanciaMetros,
    dentroRango: distanciaMetros <= distanciaMaxima,
  };
};

/**
 * Formatea la distancia en una cadena legible
 * @param metros Distancia en metros
 * @returns String formateado (ej: "50m" o "1.2km")
 */
export const formatearDistancia = (metros: number): string => {
  if (metros < 1000) {
    return `${metros}m`;
  }
  
  const km = (metros / 1000).toFixed(1);
  return `${km}km`;
};

/**
 * Verifica si el navegador soporta geolocalización
 */
export const soportaGeolocalizacion = (): boolean => {
  return 'geolocation' in navigator;
};  