// pages/pal/VisitaDetailsPage.tsx
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { logError } from '@/lib/errorHandler'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  MapPin, 
  Navigation,
  CheckCircle,
  AlertCircle,
  XCircle,
  CalendarX,
  Trash2,
  MoreHorizontal,
  Clock,
  Calendar,
  Wifi,
  Camera
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useVisitas } from '@/hooks/useVisitas'
import { useConfiguraciones } from '@/hooks/useConfiguraciones'
import { useFotosEvidencia } from '@/hooks/useFotosEvidencia'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Visita } from '@/types/visita'

const iconoHospital = L.divIcon({
  className: '',
  html: `<div style="background:#1d71b8;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

const iconoUsuario = L.divIcon({
  className: '',
  html: `<div style="background:#e8308a;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

interface UbicacionUsuario {
  lat: number
  lng: number
}

// Componente interno para ajustar zoom automáticamente
function FitBounds({ puntos }: { puntos: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (puntos.length < 2) return
    const bounds = L.latLngBounds(puntos)
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [puntos, map])
  return null
}

const VisitaDetailsPage: React.FC = () => {
  const { visitaId } = useParams<{ visitaId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { getVisitaById, validarGPS, confirmarAsistencia, marcarFalta, updateVisita, createVisita } = useVisitas()
  const { getConfiguracionNumber } = useConfiguraciones()
  const { fotos, loading: fotosLoading, uploading, bucketReady, fetchFotosByVisita, subirFoto, eliminarFoto } = useFotosEvidencia()

  const [visita, setVisita] = useState<Visita | null>(null)
  const [loading, setLoading] = useState(true)
  const [validandoGPS, setValidandoGPS] = useState(false)
  const [ubicacionUsuario, setUbicacionUsuario] = useState<UbicacionUsuario | null>(null)
  const [ubicacionValidada, setUbicacionValidada] = useState<UbicacionUsuario | null>(null)
  const [horaValidacion, setHoraValidacion] = useState<string | null>(null)
  const [showDireccion, setShowDireccion] = useState(false)
  const [showReagendarDialog, setShowReagendarDialog] = useState(false)
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [nuevaHora, setNuevaHora] = useState('')
  const [showCamaraDialog, setShowCamaraDialog] = useState(false)
  const [notasReagendado, setNotasReagendado] = useState('')

  // Camera states (inline, sin CameraCapture)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraLoading, setCameraLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  const selectedDate = location.state?.selectedDate

  useEffect(() => {
    if (visitaId) fetchVisitaDetails()
  }, [visitaId])

  useEffect(() => {
    if (visita?.estado === 'asistio' && bucketReady) {
      fetchFotosByVisita(visita.id)
    }
  }, [visita, bucketReady])

  // Obtener ubicación automáticamente para el mapa
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUbicacionUsuario({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn('No se pudo obtener ubicación:', err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    )
  }, [])

  // Configurar video cuando hay stream
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(console.error)
    }
  }, [stream])

  // Limpiar stream al desmontar
  useEffect(() => {
    return () => stopCamera()
  }, [])

  const fetchVisitaDetails = async () => {
    if (!visitaId) return
    try {
      setLoading(true)
      const visitaData = await getVisitaById(visitaId)
      setVisita(visitaData)
      // Si ya tiene validación registrada, mostrar su ubicación
      if (visitaData.latitud_registro && visitaData.longitud_registro) {
        setUbicacionValidada({ lat: visitaData.latitud_registro, lng: visitaData.longitud_registro })
      }
      if (visitaData.fecha_hora_registro) {
        setHoraValidacion(visitaData.fecha_hora_registro)
      } else if (visitaData.updated_at) {
        setHoraValidacion(visitaData.updated_at)
      }
    } catch (error) {
      console.error('Error fetching visita:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVolver = () => {
    if (selectedDate) {
      navigate(`/pal/visitas-dia/${format(selectedDate, 'yyyy-MM-dd')}`)
    } else {
      navigate('/pal/calendario')
    }
  }

  const handleReagendar = async () => {
    if (!visita || !nuevaFecha || !nuevaHora) return
    try {
      const offsetMinutes = new Date().getTimezoneOffset()
      const offsetSign = offsetMinutes <= 0 ? '+' : '-'
      const absOffset = Math.abs(offsetMinutes)
      const tzOffset = `${offsetSign}${String(Math.floor(absOffset / 60)).padStart(2, '0')}:${String(absOffset % 60).padStart(2, '0')}`

      // Marcar visita original como reagendada
      await updateVisita(visita.id, {
        estado: 'reagendada',
        notas_reagendado: notasReagendado
      })

      // Crear nueva visita
      await createVisita({
        pal_id: visita.pal_id,
        institucion_id: visita.institucion_id,
        fecha_visita: `${nuevaFecha}T${nuevaHora}:00${tzOffset}`,
        estado: 'programada',
        reagendado_de: visita.id
      })

      toast.success('Visita reagendada correctamente')
      setShowReagendarDialog(false)
      navigate(selectedDate 
        ? `/pal/visitas-dia/${format(selectedDate, 'yyyy-MM-dd')}`
        : '/pal/calendario'
      )
    } catch {
      toast.error('Error al reagendar la visita')
    }
  }

  const handleValidarYFoto = async () => {
    if (!visita) return
    if (!navigator.geolocation) {
      toast.error('Tu dispositivo no tiene GPS disponible')
      return
    }

    setValidandoGPS(true)
    toast.info('Obteniendo tu ubicación...', { duration: 2000 })

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const distanciaPermitida = getConfiguracionNumber('distancia_validacion_gps') || 100

        setUbicacionUsuario({ lat: latitude, lng: longitude })

        try {
          const resultado = await validarGPS(visita.id, latitude, longitude, distanciaPermitida)

          // Guardar ubicación y hora de validación
          setUbicacionValidada({ lat: latitude, lng: longitude })
          setHoraValidacion(new Date().toISOString())

          setVisita(prev => prev ? {
            ...prev,
            validacion_gps: resultado.validacion_gps,
            latitud_registro: resultado.latitud_registro,
            longitud_registro: resultado.longitud_registro,
            distancia_metros: resultado.distancia_metros
          } : null)

          // Abrir cámara inmediatamente
          setShowCamaraDialog(true)
          if (!isMobile) {
            startCamera()
          }

        } catch (error) {
          console.error('Error en validarGPS:', error)
          toast.error('Error al validar ubicación')
        } finally {
          setValidandoGPS(false)
        }
      },
      (error) => {
        setValidandoGPS(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Debes permitir el acceso a la ubicación')
            break
          case error.POSITION_UNAVAILABLE:
            toast.error('No se pudo obtener tu ubicación')
            break
          case error.TIMEOUT:
            toast.error('Tiempo de espera agotado')
            break
          default:
            toast.error('Error al obtener la ubicación')
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    )
  }

  const startCamera = async () => {
    try {
      setCameraLoading(true)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      })
      setStream(mediaStream)
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast.error('No se pudo acceder a la cámara')
      // fallback a input file
      setTimeout(() => document.getElementById('camera-input-fallback')?.click(), 500)
    } finally {
      setCameraLoading(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      setStream(null)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !stream) return
    const video = videoRef.current

    const MAX_DIM = 1280
    const origWidth = video.videoWidth || 640
    const origHeight = video.videoHeight || 480
    const scale = Math.min(1, MAX_DIM / Math.max(origWidth, origHeight))

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(origWidth * scale)
    canvas.height = Math.round(origHeight * scale)

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      canvas.width = 0
      canvas.height = 0
      if (blob) {
        const file = new File([blob], `evidencia-${Date.now()}.jpg`, { type: 'image/jpeg' })
        handleFotoCapturada(file)
      } else {
        handleFotoFallida()
      }
    }, 'image/jpeg', 0.75)
  }

  const handleFotoCapturada = async (file: File) => {
  if (!visita) return
  stopCamera()
  setShowCamaraDialog(false)

  try {
    const result = await subirFoto(visita.id, file)
    if (!result) {
      await handleFotoFallida()
      return
    }
    const visitaActualizada = await confirmarAsistencia(visita.id)
    setVisita(visitaActualizada)
    toast.success('Visita confirmada con evidencia fotográfica')
    fetchFotosByVisita(visita.id)
  } catch (error) {
    console.error('Error subiendo evidencia:', error)
    await handleFotoFallida(error)
  }
}

const handleFotoFallida = async (error?: unknown) => {
  if (!visita) return
  try {
    await logError('VisitaDetailsPage.handleFotoCapturada', error ?? new Error('Fallo al subir/capturar foto'), visita.pal_id)
  } catch {
    // si falla el log, no bloquea el flujo
  }
  try {
    const visitaActualizada = await confirmarAsistencia(visita.id)
    setVisita(visitaActualizada)
    toast.error('No se pudo subir la foto, se ha registrado tu visita y soporte técnico ya fue notificado', {
      duration: 6000
    })
  } catch (err) {
    console.error('Error confirmando asistencia sin foto:', err)
    toast.error('No se pudo registrar la visita. Intenta de nuevo.')
  }
}

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFotoCapturada(file)
    e.target.value = ''
  }

  const handleMarcarFalta = async () => {
    if (!visita) return
    try {
      const visitaActualizada = await marcarFalta(visita.id)
      setVisita(visitaActualizada)
    } catch (error) {
      console.error('Error marking absence:', error)
    }
  }

  const handleEliminarFoto = async (fotoId: string, url: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta foto?')) {
      await eliminarFoto(fotoId, url)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'programada':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Programada</Badge>
      case 'asistio':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Asistió</Badge>
      case 'falto':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Faltó</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!visita) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <h3 className="font-medium mb-2">Visita no encontrada</h3>
          <Button onClick={handleVolver} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    )
  }

  const distanciaPermitida = getConfiguracionNumber('distancia_validacion_gps') || 100

  const puntosMapa: [number, number][] = []
  if (visita.institucion) puntosMapa.push([visita.institucion.latitud, visita.institucion.longitud])
  if (ubicacionUsuario && visita.estado === 'programada') puntosMapa.push([ubicacionUsuario.lat, ubicacionUsuario.lng])
  if (ubicacionValidada && visita.estado === 'asistio') puntosMapa.push([ubicacionValidada.lat, ubicacionValidada.lng])

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col">

      {/* Header */}
      <div className="bg-background border-b p-4 z-10">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleVolver}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          {getEstadoBadge(visita.estado)}
        </div>
      </div>

      <div className="flex-1 p-4 space-y-6">

        {/* Institución */}
        <Card className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-base font-semibold truncate flex-1">{visita.institucion?.nombre ?? 'Home office'}</h1>
              {visita.estado === 'programada' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-primary-foreground hover:bg-white/20 flex-shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowReagendarDialog(true)}>
                      <CalendarX className="h-4 w-4 mr-2" />
                      Reagendar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowDireccion(!showDireccion)}>
                      <MapPin className="h-4 w-4 mr-2" />
                      {showDireccion ? 'Ocultar dirección' : 'Ver dirección'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Datos */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3" />
            {format(new Date(visita.fecha_visita), 'dd MMM yyyy', { locale: es })}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" />
            {format(new Date(visita.fecha_visita), 'HH:mm')}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
            <Wifi className="h-3 w-3" />
            {visita.institucion ? 'Presencial' : 'Home office'}
          </Badge>
          {getEstadoBadge(visita.estado)}
        </div>
        {showDireccion && (
          <Card>
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground">{visita.institucion?.direccion}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botón validar — arriba del mapa */}
          {visita.estado === 'programada' && (
            <Button
              className="w-full"
              onClick={handleValidarYFoto}
              disabled={validandoGPS}
            >
              {validandoGPS ? (
                <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Navigation className="h-4 w-4 mr-2" />
              )}
              {validandoGPS ? 'Validando...' : 'Validar ubicación y foto'}
            </Button>
          )}

          {visita.estado === 'asistio' && ubicacionValidada && (
            <CardContent className="p-4">
              <div className="flex gap-3">
                
                {/* Foto */}
                {bucketReady && !fotosLoading && fotos.length > 0 && (
                  <div className="relative group flex-shrink-0">
                    <img
                      src={fotos[0].url_storage}
                      alt="Evidencia"
                      className="w-24 h-24 object-cover rounded border border-green-200"
                    />
                    <Button
                      onClick={() => handleEliminarFoto(fotos[0].id, fotos[0].url_storage)}
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {/* Datos */}
                <div className="flex items-start gap-2 text-green-700 flex-1">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Visita confirmada</p>
                    {horaValidacion && (
                      <p className="text-sm text-green-600">
                        {format(new Date(horaValidacion), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    )}
                    {visita.distancia_metros !== undefined && visita.distancia_metros !== null && (
                      <p className="text-sm text-green-600">
                        {visita.distancia_metros}m del hospital
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </CardContent>
            )}

          {/* MAPA */}
          {visita.institucion && (
            <Card className="overflow-hidden relative z-0 py-0">
              <CardContent className="p-0">
                <MapContainer
                  center={[visita.institucion.latitud, visita.institucion.longitud]}
                  zoom={15}
                  style={{ height: '200px', width: '100%' }}
                  zoomControl={false}
                  key={visita.estado}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                  />
                  <FitBounds puntos={puntosMapa} />

                  <Marker
                    position={[visita.institucion.latitud, visita.institucion.longitud]}
                    icon={iconoHospital}
                  >
                    <Popup>{visita.institucion.nombre}</Popup>
                  </Marker>

                  {visita.estado === 'programada' && (
                    <Circle
                      center={[visita.institucion.latitud, visita.institucion.longitud]}
                      radius={distanciaPermitida}
                      pathOptions={{ color: '#1d71b8', fillColor: '#1d71b8', fillOpacity: 0.1 }}
                    />
                  )}

                  {visita.estado === 'programada' && ubicacionUsuario && (
                    <Marker position={[ubicacionUsuario.lat, ubicacionUsuario.lng]} icon={iconoUsuario}>
                      <Popup>Tu ubicación</Popup>
                    </Marker>
                  )}

                  {visita.estado === 'asistio' && ubicacionValidada && (
                    <Marker position={[ubicacionValidada.lat, ubicacionValidada.lng]} icon={iconoUsuario}>
                      <Popup>Ubicación registrada</Popup>
                    </Marker>
                  )}
                </MapContainer>

                {/* Leyenda */}
                <div className="flex items-center gap-4 px-3 py-2 text-xs text-muted-foreground border-t">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span>Hospital</span>
                  </div>
                  {visita.estado === 'programada' && ubicacionUsuario && (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-accent"></div>
                      <span>Tu ubicación</span>
                    </div>
                  )}
                  {visita.estado === 'asistio' && ubicacionValidada && (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-accent"></div>
                      <span>Ubicación registrada</span>
                    </div>
                  )}
                  {visita.estado === 'programada' && (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full border border-primary bg-primary/10"></div>
                      <span>Zona válida ({distanciaPermitida}m)</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        
        
        {/* Marcar falta — solo visible si GPS ya validado pero aún programada */}
        {visita.estado === 'programada' && visita.validacion_gps && (
          <Button
            onClick={handleMarcarFalta}
            variant="outline"
            size="sm"
            className="w-full text-muted-foreground border-muted-foreground/20 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Marcar falta
          </Button>
        )}

        {visita.estado === 'falto' && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-red-700">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Falta registrada</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog Reagendar */}
      <Dialog open={showReagendarDialog} onOpenChange={setShowReagendarDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reagendar visita — {visita.institucion?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-700">
              <AlertCircle className="h-4 w-4 inline mr-2 text-blue-600" />
              Solo reagenda si realizarás la visita otro día. Si llegaste antes o después de la hora, no es necesario.
            </div>
            <div>
              <Label htmlFor="nueva-fecha">Nueva Fecha</Label>
              <Input id="nueva-fecha" type="date" value={nuevaFecha} onChange={e => setNuevaFecha(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="nueva-hora">Nueva Hora</Label>
              <Input id="nueva-hora" type="time" value={nuevaHora} onChange={e => setNuevaHora(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="notas-reagendado">Razón del reagendado</Label>
              <Input
                id="notas-reagendado"
                placeholder="Ej: El doctor no se encontraba disponible"
                value={notasReagendado}
                onChange={e => setNotasReagendado(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowReagendarDialog(false)} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={handleReagendar} 
                disabled={!nuevaFecha || !nuevaHora || !notasReagendado}
                className="flex-1"
              >
                Reagendar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Cámara */}
      <Dialog open={showCamaraDialog} onOpenChange={(open) => {
        if (!open) { stopCamera(); setShowCamaraDialog(false) }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Foto de Evidencia
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {isMobile ? (
              // En móvil usar input nativo
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Toma una foto como evidencia de tu visita
                </p>
                <Button
                  className="w-full"
                  onClick={() => document.getElementById('camera-input-mobile')?.click()}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Abrir Cámara
                </Button>
                <input
                  type="file"
                  id="camera-input-mobile"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            ) : (
              // En escritorio usar stream
              <div className="space-y-3">
                <div className="relative bg-black rounded overflow-hidden" style={{ aspectRatio: '4/3' }}>
                  {stream ? (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  ) : cameraLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm">Iniciando cámara...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button onClick={startCamera}>
                        <Camera className="h-4 w-4 mr-2" />
                        Activar cámara
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { stopCamera(); setShowCamaraDialog(false) }} className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={capturePhoto} disabled={!stream} className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Capturar
                  </Button>
                </div>
              </div>
            )}

            {/* Fallback file input */}
            <input
              type="file"
              id="camera-input-fallback"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />

            {uploading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Subiendo foto...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default VisitaDetailsPage