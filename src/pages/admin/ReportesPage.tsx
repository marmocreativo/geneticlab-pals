import { useState, useEffect } from 'react'
import { BarChart3, Download, FileSpreadsheet, Users, Building, Activity, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useVisitas } from '@/hooks/useVisitas'
import { useActividades } from '@/hooks/useActividades'
import { useContactos } from '@/hooks/useContactos'
import { useFichas } from '@/hooks/useFichas'
import { useInstituciones } from '@/hooks/useInstituciones'
import { exportService } from '@/services/exportService'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

import { toast } from 'sonner'

export default function ReportesPage() {
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [tipoReporte, setTipoReporte] = useState('visitas')
  const [loading, setLoading] = useState(false)

  const { visitas, fetchVisitasByDateRange } = useVisitas()
  const { actividades, fetchAllActividades } = useActividades()
  const { contactos } = useContactos()
  const { fichas } = useFichas()
  const { instituciones } = useInstituciones()

  // Inicializar fechas (último mes)
  useEffect(() => {
    const now = new Date()
    const inicio = startOfMonth(subMonths(now, 1))
    const fin = endOfMonth(now)
    
    setFechaInicio(format(inicio, 'yyyy-MM-dd'))
    setFechaFin(format(fin, 'yyyy-MM-dd'))
  }, [])

  const generateVisitasReport = async () => {
    try {
      setLoading(true)
      
      if (fechaInicio && fechaFin) {
        await fetchVisitasByDateRange(fechaInicio, fechaFin)
      }

      const reportData = visitas.map(visita => ({
        fecha_contacto: visita.fecha_visita,
        pal_nombre: visita.pal?.nombre_completo || 'N/A',
        institucion_nombre: visita.institucion?.nombre || 'N/A',
        tipo_contacto: 'presencial',
        estado: visita.estado,
        validacion_gps: visita.validacion_gps,
        distancia_metros: visita.distancia_metros || 0
      }))

      exportService.exportarContactosExcel(reportData, 'reporte_visitas')
      toast.success('Reporte de visitas descargado exitosamente')
      
    } catch (error) {
      console.error('Error generando reporte:', error)
      toast.error('Error al generar el reporte')
    } finally {
      setLoading(false)
    }
  }

  const generateActividadesReport = async () => {
    try {
      setLoading(true)
      await fetchAllActividades()

      const reportData = actividades
        .filter(actividad => {
          if (!fechaInicio || !fechaFin) return true
          const fechaActividad = new Date(actividad.fecha_actividad)
          return fechaActividad >= new Date(fechaInicio) && fechaActividad <= new Date(fechaFin)
        })
        .map(actividad => ({
          fecha_contacto: actividad.fecha_actividad,
          pal_nombre: actividad.pal?.nombre_completo || 'N/A',
          institucion_nombre: actividad.institucion?.nombre || 'N/A',
          contacto_con: actividad.contacto ? 
            `${actividad.contacto.nombre} ${actividad.contacto.apellido_pat || ''}`.trim() : 'N/A',
          tipo_contacto: actividad.tipo_actividad,
          estado: 'completada',
          descripcion_actividad: actividad.descripcion_actividad || '',
          tema_impartido: actividad.temas_impartidos || '',
          entrega_sobres: actividad.entrega_sobres?.nombre || '',
          entrega_kit_rash: actividad.entrega_kit_rash?.nombre || ''
        }))

      exportService.exportarContactosExcel(reportData, 'reporte_actividades')
      toast.success('Reporte de actividades descargado exitosamente')
      
    } catch (error) {
      console.error('Error generando reporte:', error)
      toast.error('Error al generar el reporte')
    } finally {
      setLoading(false)
    }
  }

  const generateContactosReport = async () => {
    try {
      setLoading(true)

      const reportData = contactos
        .filter(contacto => {
          if (!fechaInicio || !fechaFin) return true
          const fechaContacto = new Date(contacto.created_at)
          return fechaContacto >= new Date(fechaInicio) && fechaContacto <= new Date(fechaFin)
        })
        .map(contacto => ({
          fecha_contacto: contacto.created_at,
          pal_nombre: 'N/A', // Los contactos no tienen PAL directo
          institucion_nombre: contacto.institucion?.nombre || 'N/A',
          nombre_completo: `${contacto.nombre} ${contacto.apellido_pat || ''} ${contacto.apellido_mat || ''}`.trim(),
          telefono: contacto.telefono || '',
          tipo_contacto: contacto.tipo_contacto,
          estado: 'registrado'
        }))

      exportService.exportarContactosExcel(reportData, 'reporte_contactos')
      toast.success('Reporte de contactos descargado exitosamente')
      
    } catch (error) {
      console.error('Error generando reporte:', error)
      toast.error('Error al generar el reporte')
    } finally {
      setLoading(false)
    }
  }

  const generateFichasReport = async () => {
    try {
      setLoading(true)

      const reportData = fichas
        .filter(ficha => {
          if (!fechaInicio || !fechaFin) return true
          const fechaFicha = new Date(ficha.created_at)
          return fechaFicha >= new Date(fechaInicio) && fechaFicha <= new Date(fechaFin)
        })
        .map(ficha => ({
          fecha_contacto: ficha.created_at,
          pal_nombre: 'N/A',
          institucion_nombre: ficha.institucion?.nombre || 'N/A',
          folio: ficha.folio,
          nombre_completo: ficha.paciente ? 
            `${ficha.paciente.nombre} ${ficha.paciente.apellido_pat || ''} ${ficha.paciente.apellido_mat || ''}`.trim() : 'N/A',
          telefono: ficha.paciente?.telefono || '',
          diagnostico: ficha.diagnostico || '',
          terapia: ficha.terapia || '',
          tipo_contacto: 'paciente',
          estado: 'registrado'
        }))

      exportService.exportarContactosExcel(reportData, 'reporte_pacientes')
      toast.success('Reporte de pacientes descargado exitosamente')
      
    } catch (error) {
      console.error('Error generando reporte:', error)
      toast.error('Error al generar el reporte')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    switch (tipoReporte) {
      case 'visitas':
        generateVisitasReport()
        break
      case 'actividades':
        generateActividadesReport()
        break
      case 'contactos':
        generateContactosReport()
        break
      case 'pacientes':
        generateFichasReport()
        break
      default:
        toast.error('Selecciona un tipo de reporte válido')
    }
  }

  // Estadísticas rápidas
  const stats = {
    totalVisitas: visitas.length,
    totalActividades: actividades.length,
    totalContactos: contactos.length,
    totalPacientes: fichas.length,
    totalInstituciones: instituciones.length
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes y Exportaciones</h1>
        <p className="text-muted-foreground">
          Genera reportes en Excel de toda la información del sistema
        </p>
      </div>

      {/* Estadísticas generales */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{stats.totalVisitas}</div>
            <p className="text-sm text-muted-foreground">Visitas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{stats.totalActividades}</div>
            <p className="text-sm text-muted-foreground">Actividades</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">{stats.totalContactos}</div>
            <p className="text-sm text-muted-foreground">Contactos</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <FileSpreadsheet className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold">{stats.totalPacientes}</div>
            <p className="text-sm text-muted-foreground">Pacientes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Building className="h-6 w-6 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold">{stats.totalInstituciones}</div>
            <p className="text-sm text-muted-foreground">Instituciones</p>
          </CardContent>
        </Card>
      </div>

      {/* Generador de reportes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Generador de Reportes Excel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Reporte</label>
              <Select value={tipoReporte} onValueChange={setTipoReporte}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visitas">Visitas Programadas</SelectItem>
                  <SelectItem value="actividades">Actividades Realizadas</SelectItem>
                  <SelectItem value="contactos">Base de Contactos</SelectItem>
                  <SelectItem value="pacientes">Fichas de Pacientes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Inicio</label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Fin</label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">&nbsp;</label>
              <Button 
                onClick={handleDownload}
                disabled={loading}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {loading ? 'Generando...' : 'Descargar Excel'}
              </Button>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Descripción del Reporte:</h4>
            <div className="text-sm text-muted-foreground">
              {tipoReporte === 'visitas' && 
                'Exporta todas las visitas programadas con información de PAL, institución, estado y validación GPS.'
              }
              {tipoReporte === 'actividades' && 
                'Exporta todas las actividades realizadas incluyendo contactos, temas impartidos y entregas.'
              }
              {tipoReporte === 'contactos' && 
                'Exporta la base completa de contactos con información personal y de ubicación.'
              }
              {tipoReporte === 'pacientes' && 
                'Exporta las fichas de pacientes con datos médicos y de tratamiento.'
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Los archivos se descargan automáticamente en formato Excel (.xlsx)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}