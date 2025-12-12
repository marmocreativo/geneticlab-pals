// src/types/institucion.ts
export interface Institucion {
  id: string;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  sector_id?: string;
  google_place_id?: string;
  photo_reference?: string;
  contactos_count?: number
  visitas_count?: number
  sector_nombre?: string
  created_at: string;
}

export interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photo_reference?: string;
}

export interface CreateInstitucionInput {
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  sector_id?: string;
  google_place_id?: string;
  photo_reference?: string;
  contactos_count?: number
  visitas_count?: number
  sector_nombre?: string
}