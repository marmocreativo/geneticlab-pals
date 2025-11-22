import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Calendar, 
  Clock, 
  Navigation,
  CheckCircle,
  AlertCircle,
  XCircle,
  Activity,
  Plus, 
  User, 
  Package, 
  Clipboard,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ActividadForm from '@/components/actividades/ActividadForm'
import { useVisitas } from '@/hooks/useVisitas'
import { useConfiguraciones } from '@/hooks/useConfiguraciones'
import { useActividades } from '@/hooks/useActividades'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Visita } from '@/types/visita'
import type { ActividadInsert } from '@/types/actividad'

const VisitaDetailsPage: React.FC = () => {
  const { visitaId } = useParams<{ visitaId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { getVisitaById, validarGPS, confirmarAsistencia, marcarFalta } = useVisitas()
  const { getConfiguracionNumber } = useConfiguraciones()
  const [visita, setVisita] = useState<Visita | null>(null)
  const [loading, setLoading] = useState(true)
  const [validandoGPS, setValidandoGPS] = useState(false)
  const { actividades, fetchActividadesByVisita, createActividad } = useActividades()
  const [showActividadForm, setShowActividadForm] = useState(false)
  const [showDireccion, setShowDireccion] = useState(false)

  // Obtener fecha del estado de navegación
  const selectedDate = location.state?.selectedDate

  useEffect(() => {
    if (visitaId) {
      fetchVisitaDetails()
    }
  }, [visitaId])

  useEffect(() => {
    if (visita && visita.estado === 'asistio') {
      fetchActividadesByVisita(visita.id)
    }
  }, [visita])

  const fetchVisitaDetails = async () => {
    if (!visitaId) return
    
    try {
      setLoading(true)
      const visitaData = await getVisitaById(visitaId)
      setVisita(visitaData)
    } catch (error) {
      console.error('Error fetching visita:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateActividad = async (actividadData: ActividadInsert) => {
    await createActividad(actividadData)
    if (visita) {
      fetchActividadesByVisita(visita.id)
    }
  }

  const handleVolver = () => {
    if (selectedDate) {
      navigate('/pal', { state: { selectedDate } })
    } else {
      navigate('/pal')
    }
  }

  const handleValidarGPS = async () => {
    if (!visita) return

    setValidandoGPS(true)
    
    try {
      if (!navigator.geolocation) {
        toast.error('Tu dispositivo no tiene GPS disponible')
        setValidandoGPS(false)
        return
      }

      toast.info('Obteniendo tu ubicación...', { duration: 2000 })

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          const distanciaPermitida = getConfiguracionNumber('distancia_validacion_gps') || 100

          try {
            const resultado = await validarGPS(visita.id, latitude, longitude, distanciaPermitida)

            setVisita(prev => prev ? {
              ...prev,
              validacion_gps: resultado.validacion_gps,
              latitud_registro: resultado.latitud_registro,
              longitud_registro: resultado.longitud_registro,
              distancia_metros: resultado.distancia_metros
            } : null)

          } catch (error) {
            console.error('Error en validarGPS:', error)
          } finally {
            setValidandoGPS(false)
          }
        },
        (error) => {
          console.error('Error de geolocalización:', error)
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
              break
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000
        }
      )
    } catch (error) {
      console.error('Error general:', error)
      toast.error('Error inesperado al validar ubicación')
      setValidandoGPS(false)
    }
  }

  const handleConfirmarAsistencia = async () => {
    if (!visita) return
    try {
      const visitaActualizada = await confirmarAsistencia(visita.id)
      setVisita(visitaActualizada)
    } catch (error) {
      console.error('Error confirming attendance:', error)
    }
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

  const puedeValidarGPS = visita.tipo_visita === 'presencial' && !visita.validacion_gps && visita.estado === 'programada'
  const puedeConfirmarAsistencia = visita.estado === 'programada' && (visita.tipo_visita === 'telefono' || visita.validacion_gps)

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={handleVolver}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
        {getEstadoBadge(visita.estado)}
      </div>

      {/* Información básica */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            {visita.tipo_visita === 'presencial' ? (
              <MapPin className="h-5 w-5 text-blue-600" />
            ) : (
              <Phone className="h-5 w-5 text-green-600" />
            )}
            <div className="flex-1">
              <h2 className="font-medium text-sm">{visita.institucion?.nombre}</h2>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span>{format(new Date(visita.fecha_visita), 'dd MMM', { locale: es })}</span>
                <span>{format(new Date(visita.fecha_visita), 'HH:mm')}</span>
                <Badge variant="outline" className="text-xs">
                  {visita.tipo_visita === 'presencial' ? 'Presencial' : 'Telefónica'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Dirección colapsable */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDireccion(!showDireccion)}
            className="w-full justify-between h-8 text-xs p-2"
          >
            Ver dirección
            {showDireccion ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>

          {showDireccion && (
            <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
              {visita.institucion?.direccion}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones y Actividades */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Acciones y Actividades
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          
          {/* Validación GPS para visitas presenciales */}
          {visita.tipo_visita === 'presencial' && visita.estado === 'programada' && (
            <div className="space-y-2">
              {visita.validacion_gps ? (
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span className="text-green-700">Ubicación validada ({visita.distancia_metros}m)</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <AlertCircle className="h-3 w-3 text-yellow-600" />
                    <span className="text-yellow-700">Valida tu ubicación GPS</span>
                  </div>
                  <Button 
                    onClick={handleValidarGPS}
                    disabled={validandoGPS}
                    size="sm"
                    className="w-full h-8"
                  >
                    {validandoGPS ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Navigation className="h-3 w-3 mr-2" />
                    )}
                    {validandoGPS ? 'Validando...' : 'Validar GPS'}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Confirmación de asistencia */}
          {visita.estado === 'programada' && (
            <div className="space-y-2">
              {visita.tipo_visita === 'telefono' || visita.validacion_gps ? (
                <div className="flex gap-2">
                  <Button 
                    onClick={handleConfirmarAsistencia}
                    size="sm"
                    className="flex-1 h-8"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Confirmar
                  </Button>
                  <Button 
                    onClick={handleMarcarFalta}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-red-600 border-red-200"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Marcar Falta
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-gray-50 border rounded text-xs">
                  <AlertCircle className="h-3 w-3 text-gray-600" />
                  <span className="text-gray-700">Valida GPS primero</span>
                </div>
              )}
            </div>
          )}

          {/* Actividades */}
          {visita.estado === 'asistio' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-muted-foreground">ACTIVIDADES</h4>
                <Button 
                  onClick={() => setShowActividadForm(true)}
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Nueva
                </Button>
              </div>

              {actividades.length === 0 ? (
                <div className="text-center py-6">
                  <Clipboard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-3">No hay actividades registradas</p>
                  <Button 
                    onClick={() => setShowActividadForm(true)}
                    variant="outline"
                    size="sm"
                    className="h-8"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Primera Actividad
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {actividades.map((actividad) => (
                    <div
                      key={actividad.id}
                      className="border rounded p-3 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-3 w-3 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium">
                            {actividad.contacto ? 
                              `${actividad.contacto.nombre} ${actividad.contacto.apellido_pat || ''}` : 
                              'Sin contacto'
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(actividad.created_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>

                      {actividad.descripcion_actividad && (
                        <p className="text-xs bg-muted/50 rounded p-2">{actividad.descripcion_actividad}</p>
                      )}

                      {actividad.temas_impartidos && (
                        <p className="text-xs"><strong>Temas:</strong> {actividad.temas_impartidos}</p>
                      )}

                      {(actividad.entrega_sobres_id || actividad.entrega_kit_rash_id) && (
                        <div className="flex gap-1">
                          {actividad.entrega_sobres_id && (
                            <Badge variant="outline" className="text-xs bg-blue-50">
                              <Package className="h-2 w-2 mr-1" />
                              Sobres
                            </Badge>
                          )}
                          {actividad.entrega_kit_rash_id && (
                            <Badge variant="outline" className="text-xs bg-green-50">
                              <Package className="h-2 w-2 mr-1" />
                              Kit Rash
                            </Badge>
                          )}
                        </div>
                      )}

                      {actividad.notas && (
                        <p className="text-xs text-muted-foreground italic">{actividad.notas}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mensaje si no se puede agregar actividades */}
          {visita.estado === 'programada' && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <AlertCircle className="h-3 w-3 text-yellow-600" />
              <span className="text-yellow-700">Confirma asistencia para registrar actividades</span>
            </div>
          )}

          {visita.estado === 'falto' && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
              <XCircle className="h-3 w-3 text-red-600" />
              <span className="text-red-700">No se pueden registrar actividades</span>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Modal de formulario de actividades */}
      {visita && (
        <ActividadForm
          open={showActividadForm}
          onOpenChange={setShowActividadForm}
          onSubmit={handleCreateActividad}
          visitaId={visita.id}
          institucionId={visita.institucion_id} // AGREGAR ESTA LÍNEA
        />
      )}
    </div>
  )
}

export default VisitaDetailsPage