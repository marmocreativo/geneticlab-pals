// src/components/admin/ContactosMapAdvanced.tsx

import { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow, Polyline, HeatmapLayer } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Map, Calendar, Flame, Route } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ContactoMapa {
  id: string;
  fecha_contacto: string;
  latitud_registro: number;
  longitud_registro: number;
  pal_id: string;
  users: {
    nombre_completo: string;
  } | null;
  instituciones: {
    nombre: string;
  } | null;
}

interface Pal {
  id: string;
  nombre_completo: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '600px',
};

const defaultCenter = {
  lat: 19.4326,
  lng: -99.1332,
};

const libraries: ("visualization" | "places" | "drawing" | "geometry")[] = ["visualization"];

const TODOS_VALUE = '__todos__';

const coloresPal = [
  '#FF0000', // Rojo
  '#0000FF', // Azul
  '#00FF00', // Verde
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Naranja
  '#800080', // Púrpura
  '#008000', // Verde oscuro
];

export const ContactosMapAdvanced = () => {
  const [contactos, setContactos] = useState<ContactoMapa[]>([]);
  const [pals, setPals] = useState<Pal[]>([]);
  const [selectedContacto, setSelectedContacto] = useState<ContactoMapa | null>(null);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [palSeleccionado, setPalSeleccionado] = useState(TODOS_VALUE);
  const [center, setCenter] = useState(defaultCenter);
  const [vistaActual, setVistaActual] = useState<'marcadores' | 'heatmap' | 'rutas'>('marcadores');

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Cargar Google Maps con useLoadScript
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: apiKey || '',
    libraries,
  });

  useEffect(() => {
    cargarPals();
    cargarContactos();
  }, []);

  const cargarPals = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, nombre_completo')
        .eq('role', 'pal')
        .eq('activo', true)
        .order('nombre_completo');

      if (error) throw error;
      setPals(data || []);
    } catch (error) {
      console.error('Error cargando PALs:', error);
    }
  };

  const cargarContactos = async (filtroInicio?: string, filtroFin?: string, filtroPal?: string) => {
    try {
      setLoading(true);

      let query = supabase
        .from('contactos')
        .select(`
          id,
          fecha_contacto,
          latitud_registro,
          longitud_registro,
          pal_id,
          users!contactos_pal_id_fkey(nombre_completo),
          instituciones!contactos_institucion_id_fkey(nombre)
        `)
        .eq('estado', 'confirmado')
        .eq('tipo_contacto', 'presencial')
        .not('latitud_registro', 'is', null)
        .not('longitud_registro', 'is', null)
        .order('pal_id')
        .order('fecha_contacto');

      if (filtroInicio) {
        query = query.gte('fecha_contacto', filtroInicio);
      }
      if (filtroFin) {
        query = query.lte('fecha_contacto', filtroFin);
      }
      if (filtroPal && filtroPal !== TODOS_VALUE) {
        query = query.eq('pal_id', filtroPal);
      }

      const { data, error } = await query;

      if (error) throw error;

      const contactosValidos = (data || []).filter(
        (c: any) => c.latitud_registro && c.longitud_registro
      );

      setContactos(contactosValidos as any);

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
    const pal = palSeleccionado !== TODOS_VALUE ? palSeleccionado : undefined;
    cargarContactos(fechaInicio || undefined, fechaFin || undefined, pal);
  };

  const limpiarFiltros = () => {
    setFechaInicio('');
    setFechaFin('');
    setPalSeleccionado(TODOS_VALUE);
    cargarContactos();
  };

  // Preparar datos para heatmap - SOLO cuando isLoaded es true
  const heatmapData = useMemo(() => {
    if (!isLoaded || typeof google === 'undefined') return [];
    
    return contactos.map((contacto) => ({
      location: new google.maps.LatLng(
        Number(contacto.latitud_registro),
        Number(contacto.longitud_registro)
      ),
      weight: 1,
    }));
  }, [contactos, isLoaded]);

  // Preparar rutas por PAL
  const rutasPorPal = useMemo(() => {
    return contactos.reduce((acc: Record<string, ContactoMapa[]>, contacto) => {
      if (!acc[contacto.pal_id]) {
        acc[contacto.pal_id] = [];
      }
      acc[contacto.pal_id].push(contacto);
      return acc;
    }, {});
  }, [contactos]);

  if (!apiKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mapa Avanzado de Contactos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">
            Google Maps API Key no configurada. Por favor configura VITE_GOOGLE_MAPS_API_KEY en tu archivo .env
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Mapa Avanzado de Contactos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] bg-gray-200 rounded animate-pulse flex items-center justify-center">
            <p className="text-gray-600">Cargando Google Maps...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          Mapa Avanzado de Contactos
        </CardTitle>
        <p className="text-sm text-gray-600">
          Visualiza contactos en diferentes modalidades
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="advFechaInicio">Fecha Inicio</Label>
            <Input
              id="advFechaInicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="advFechaFin">Fecha Fin</Label>
            <Input
              id="advFechaFin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="advPal">PAL</Label>
            <Select value={palSeleccionado} onValueChange={setPalSeleccionado} disabled={loading}>
              <SelectTrigger id="advPal">
                <SelectValue placeholder="Todos los PALs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS_VALUE}>Todos los PALs</SelectItem>
                {pals.map((pal) => (
                  <SelectItem key={pal.id} value={pal.id}>
                    {pal.nombre_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

        {/* Tabs para cambiar de vista */}
        <Tabs value={vistaActual} onValueChange={(v) => setVistaActual(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="marcadores">
              <Map className="h-4 w-4 mr-2" />
              Marcadores
            </TabsTrigger>
            <TabsTrigger value="heatmap">
              <Flame className="h-4 w-4 mr-2" />
              Heatmap
            </TabsTrigger>
            <TabsTrigger value="rutas">
              <Route className="h-4 w-4 mr-2" />
              Rutas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="marcadores" className="mt-4">
            {loading ? (
              <div className="h-[600px] bg-gray-200 rounded animate-pulse flex items-center justify-center">
                <p className="text-gray-600">Cargando mapa...</p>
              </div>
            ) : (
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
            )}
          </TabsContent>

          <TabsContent value="heatmap" className="mt-4">
            {loading ? (
              <div className="h-[600px] bg-gray-200 rounded animate-pulse flex items-center justify-center">
                <p className="text-gray-600">Cargando heatmap...</p>
              </div>
            ) : contactos.length === 0 ? (
              <div className="h-[600px] bg-gray-100 rounded flex items-center justify-center">
                <p className="text-gray-600">No hay datos para mostrar</p>
              </div>
            ) : (
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
                <HeatmapLayer
                  data={heatmapData}
                  options={{
                    radius: 30,
                    opacity: 0.6,
                  }}
                />
              </GoogleMap>
            )}
            <p className="text-sm text-gray-600 mt-2">
              El heatmap muestra zonas con mayor concentración de contactos. Las áreas rojas indican mayor actividad.
            </p>
          </TabsContent>

          <TabsContent value="rutas" className="mt-4">
            {loading ? (
              <div className="h-[600px] bg-gray-200 rounded animate-pulse flex items-center justify-center">
                <p className="text-gray-600">Cargando rutas...</p>
              </div>
            ) : contactos.length === 0 ? (
              <div className="h-[600px] bg-gray-100 rounded flex items-center justify-center">
                <p className="text-gray-600">No hay datos para mostrar</p>
              </div>
            ) : (
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
                {/* Marcadores */}
                {contactos.map((contacto) => (
                  <Marker
                    key={contacto.id}
                    position={{
                      lat: Number(contacto.latitud_registro),
                      lng: Number(contacto.longitud_registro),
                    }}
                    onClick={() => setSelectedContacto(contacto)}
                    icon={{
                      url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                    }}
                  />
                ))}

                {/* Rutas por PAL */}
                {Object.entries(rutasPorPal).map(([palId, contactosPal], index) => {
                  if (contactosPal.length < 2) return null;

                  const path = contactosPal.map((c) => ({
                    lat: Number(c.latitud_registro),
                    lng: Number(c.longitud_registro),
                  }));

                  return (
                    <Polyline
                      key={palId}
                      path={path}
                      options={{
                        strokeColor: coloresPal[index % coloresPal.length],
                        strokeOpacity: 0.7,
                        strokeWeight: 3,
                      }}
                    />
                  );
                })}

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
            )}
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600">
                Las líneas conectan los contactos de cada PAL en orden cronológico.
              </p>
              {palSeleccionado === TODOS_VALUE && (
                <p className="text-sm text-gray-600">
                  Cada color representa un PAL diferente. Filtra por un PAL específico para ver su ruta individual.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};