import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { mantenimientoService, type InstitucionCoordInvalida } from '@/services/mantenimientoService'
import { useGooglePlaces } from '@/hooks/useGooglePlaces'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, MapPin, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function RepararCoordenadasPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const inst: InstitucionCoordInvalida | null = state?.institucion ?? null

  const { isLoaded } = useGooglePlaces()

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)

  const [latitud, setLatitud] = useState<string>(inst?.latitud ? String(inst.latitud) : '')
  const [longitud, setLongitud] = useState<string>(inst?.longitud ? String(inst.longitud) : '')
  const [guardando, setGuardando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [sugerencias, setSugerencias] = useState<google.maps.places.AutocompletePrediction[]>([])

  const autocompleteRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesRef = useRef<google.maps.places.PlacesService | null>(null)

  // Centro inicial: México si coordenadas inválidas
  const latInicial = inst?.latitud && inst.latitud !== 0 ? inst.latitud : 23.6345
  const lonInicial = inst?.longitud && inst.longitud !== 0 ? inst.longitud : -102.5528

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: latInicial, lng: lonInicial },
      zoom: inst?.latitud && inst.latitud !== 0 ? 15 : 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })

    const marker = new google.maps.Marker({
      position: { lat: latInicial, lng: lonInicial },
      map,
      draggable: true,
      title: inst?.nombre,
    })

    marker.addListener('dragend', () => {
      const pos = marker.getPosition()
      if (!pos) return
      const lat = pos.lat().toFixed(6)
      const lon = pos.lng().toFixed(6)
      setLatitud(lat)
      setLongitud(lon)
    })

    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return
      marker.setPosition(e.latLng)
      setLatitud(e.latLng.lat().toFixed(6))
      setLongitud(e.latLng.lng().toFixed(6))
    })

    mapInstanceRef.current = map
    markerRef.current = marker
    autocompleteRef.current = new google.maps.places.AutocompleteService()
    placesRef.current = new google.maps.places.PlacesService(map)
  }, [isLoaded])

  const moverMarcador = (lat: number, lon: number) => {
    const pos = { lat, lng: lon }
    markerRef.current?.setPosition(pos)
    mapInstanceRef.current?.panTo(pos)
    mapInstanceRef.current?.setZoom(16)
    setLatitud(lat.toFixed(6))
    setLongitud(lon.toFixed(6))
  }

  const onBusquedaChange = (valor: string) => {
    setBusqueda(valor)
    if (!valor || !autocompleteRef.current) { setSugerencias([]); return }
    autocompleteRef.current.getPlacePredictions(
      { input: valor, componentRestrictions: { country: 'mx' } },
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSugerencias(predictions)
        } else {
          setSugerencias([])
        }
      }
    )
  }

  const seleccionarSugerencia = (placeId: string, descripcion: string) => {
    if (!placesRef.current) return
    placesRef.current.getDetails(
      { placeId, fields: ['geometry'] },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          moverMarcador(place.geometry.location.lat(), place.geometry.location.lng())
          setBusqueda(descripcion)
          setSugerencias([])
        }
      }
    )
  }

  const onLatLonManual = (campo: 'lat' | 'lon', valor: string) => {
    if (campo === 'lat') setLatitud(valor)
    else setLongitud(valor)

    const lat = campo === 'lat' ? parseFloat(valor) : parseFloat(latitud)
    const lon = campo === 'lon' ? parseFloat(valor) : parseFloat(longitud)

    if (!isNaN(lat) && !isNaN(lon) && markerRef.current && mapInstanceRef.current) {
      const pos = { lat, lng: lon }
      markerRef.current.setPosition(pos)
      mapInstanceRef.current.panTo(pos)
    }
  }

  const guardar = async () => {
    const lat = parseFloat(latitud)
    const lon = parseFloat(longitud)

    if (isNaN(lat) || isNaN(lon)) {
      toast.error('Coordenadas inválidas')
      return
    }
    if (lat < 14 || lat > 33 || lon < -118 || lon > -86) {
      toast.error('Las coordenadas están fuera del territorio mexicano')
      return
    }
    if (!inst) return

    try {
      setGuardando(true)
      await mantenimientoService.repararCoordenadas(inst.id, lat, lon)
      toast.success('Coordenadas actualizadas y visitas recalculadas')
      navigate('/admin/mantenimiento')
    } catch (err) {
      toast.error('Error al guardar')
      console.error(err)
    } finally {
      setGuardando(false)
    }
  }

  if (!inst) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <p className="text-sm text-muted-foreground">No se recibió institución para editar.</p>
        <Button variant="outline" onClick={() => navigate('/admin/mantenimiento')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/mantenimiento')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Reparar coordenadas</h1>
          <p className="text-sm text-muted-foreground truncate">{inst.nombre}</p>
        </div>
      </div>

      <div className="border rounded-lg p-3 space-y-2 text-sm">
        <p className="text-muted-foreground text-xs font-medium">Datos actuales</p>
        <div className="space-y-1">
            <p className="text-xs"><span className="text-muted-foreground">Dirección: </span>{inst.direccion || '—'}</p>
            <p className="text-xs"><span className="text-muted-foreground">Ciudad: </span>{inst.ciudad || '—'}</p>
            <p className="text-xs"><span className="text-muted-foreground">Estado: </span>{inst.estado || '—'}</p>
            <div className="flex items-center gap-1 text-xs">
            <MapPin className="w-3 h-3 text-destructive" />
            <span className="text-muted-foreground">Coords: </span>
            <span>{inst.latitud ?? 'null'}, {inst.longitud ?? 'null'}</span>
            </div>
        </div>
        </div>

      {/* Buscador */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar dirección o lugar..."
          value={busqueda}
          onChange={e => onBusquedaChange(e.target.value)}
          className="w-full text-sm border rounded-md px-3 py-2 bg-background"
        />
        {sugerencias.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg divide-y max-h-52 overflow-y-auto">
            {sugerencias.map(s => (
              <button
                key={s.place_id}
                onClick={() => seleccionarSugerencia(s.place_id, s.description)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
              >
                {s.description}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mapa */}
      <div className="border rounded-lg overflow-hidden">
        {!isLoaded && (
          <div className="h-72 flex items-center justify-center bg-muted">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
        <div
          ref={mapRef}
          className="w-full h-72"
          style={{ display: isLoaded ? 'block' : 'none' }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Haz clic en el mapa o arrastra el pin para ajustar la ubicación.
      </p>

      {/* Coordenadas manuales */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Latitud</label>
          <input
            type="text"
            value={latitud}
            onChange={e => onLatLonManual('lat', e.target.value)}
            className="w-full text-sm border rounded-md px-3 py-2 bg-background"
            placeholder="19.432608"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Longitud</label>
          <input
            type="text"
            value={longitud}
            onChange={e => onLatLonManual('lon', e.target.value)}
            className="w-full text-sm border rounded-md px-3 py-2 bg-background"
            placeholder="-99.133209"
          />
        </div>
      </div>

      <Button onClick={guardar} disabled={guardando} className="w-full">
        {guardando ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        Guardar y recalcular visitas
      </Button>
    </div>
  )
}