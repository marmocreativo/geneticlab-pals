// src/components/admin/ContactosMap.tsx

import { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Map, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ContactoMapa {
  id: string;
  fecha_contacto: string;
  latitud_registro: number;
  longitud_registro: number;
  users: {
    nombre_completo: string;
  } | null;
  instituciones: {
    nombre: string;
  } | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '600px',
};

const defaultCenter = {
  lat: 19.4326,
  lng: -99.1332, // Ciudad de México por defecto
};

export const ContactosMap = () => {
  const [contactos, setContactos] = useState<ContactoMapa[]>([]);
  const [selectedContacto, setSelectedContacto] = useState<ContactoMapa | null>(null);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [center, setCenter] = useState(defaultCenter);

  useEffect(() => {
    cargarContactos();
  }, []);

  const cargarContactos = async (filtroInicio?: string, filtroFin?: string) => {
    try {
      setLoading(true);

      let query = supabase
        .from('contactos')
        .select(`
          id,
          fecha_contacto,
          latitud_registro,
          longitud_registro,
          users!contactos_pal_id_fkey(nombre_completo),
          instituciones!contactos_institucion_id_fkey(nombre)
        `)
        .eq('estado', 'confirmado')
        .eq('tipo_contacto', 'presencial')
        .not('latitud_registro', 'is', null)
        .not('longitud_registro', 'is', null);

      if (filtroInicio) {
        query = query.gte('fecha_contacto', filtroInicio);
      }
      if (filtroFin) {
        query = query.lte('fecha_contacto', filtroFin);
      }

      const { data, error } = await query;

      if (error) throw error;

      const contactosValidos = (data || []).filter(
        (c: any) => c.latitud_registro && c.longitud_registro
      );

      setContactos(contactosValidos as any);

      // Centrar el mapa en el primer contacto si existe
      if (contactosValidos.length > 0) {
        setCenter({
          lat: Number(contactosValidos[0].latitud_registro),
          lng: Number(contactosValidos[0].longitud_registro),
        });
      }
    } catch (error) {
      console.error('Error cargando contactos:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    cargarContactos(fechaInicio || undefined, fechaFin || undefined);
  };

  const limpiarFiltros = () => {
    setFechaInicio('');
    setFechaFin('');
    cargarContactos();
  };

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Contactos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">
            Google Maps API Key no configurada. Por favor configura VITE_GOOGLE_MAPS_API_KEY en tu archivo .env
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          Mapa de Contactos
        </CardTitle>
        <p className="text-sm text-gray-600">
          Mostrando {contactos.length} contacto{contactos.length !== 1 ? 's' : ''} confirmado{contactos.length !== 1 ? 's' : ''} con ubicación GPS
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="mapFechaInicio">Fecha Inicio</Label>
            <Input
              id="mapFechaInicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mapFechaFin">Fecha Fin</Label>
            <Input
              id="mapFechaFin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={aplicarFiltros} disabled={loading} className="flex-1">
              <Calendar className="h-4 w-4 mr-2" />
              Aplicar
            </Button>
            <Button onClick={limpiarFiltros} disabled={loading} variant="outline">
              Limpiar
            </Button>
          </div>
        </div>

        {/* Mapa */}
        {loading ? (
          <div className="h-[600px] bg-gray-200 rounded animate-pulse flex items-center justify-center">
            <p className="text-gray-600">Cargando mapa...</p>
          </div>
        ) : (
          <LoadScript googleMapsApiKey={apiKey}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={12}
              options={{
                streetViewControl: false,
                mapTypeControl: true,
                fullscreenControl: true,
              }}
            >
              {contactos.map((contacto) => (
                <Marker
                  key={contacto.id}
                  position={{
                    lat: Number(contacto.latitud_registro),
                    lng: Number(contacto.longitud_registro),
                  }}
                  onClick={() => setSelectedContacto(contacto)}
                  icon={{
                    url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                  }}
                />
              ))}

              {selectedContacto && (
                <InfoWindow
                  position={{
                    lat: Number(selectedContacto.latitud_registro),
                    lng: Number(selectedContacto.longitud_registro),
                  }}
                  onCloseClick={() => setSelectedContacto(null)}
                >
                  <div className="p-2">
                    <h3 className="font-semibold text-sm">
                      {selectedContacto.instituciones?.nombre || 'Sin institución'}
                    </h3>
                    <p className="text-xs text-gray-600">
                      PAL: {selectedContacto.users?.nombre_completo || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-600">
                      Fecha: {new Date(selectedContacto.fecha_contacto).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </LoadScript>
        )}
      </CardContent>
    </Card>
  );
};