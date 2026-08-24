// src/pages/admin/ReportesPage.tsx
import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { BarChart3, Download, FileSpreadsheet, Users, Building, Activity, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useContactos } from '@/hooks/useContactos'
import { useFichas } from '@/hooks/useFichas'
import { useInstituciones } from '@/hooks/useInstituciones'
import { supabase } from '@/lib/supabase'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { toast } from 'sonner'

const TIPO_CONTACTO_LABELS: Record<string, string> = {
  medico: 'Médico',
  paciente: 'Paciente',
  familiar: 'Familiar',
  cuidador: 'Cuidador',
  enfermera: 'Enfermero (a)',
  kam: 'KAM',
  otro: 'Otro',
}

function getTipoContactoLabel(tipo?: string) {
  if (!tipo) return ''
  return TIPO_CONTACTO_LABELS[tipo] || tipo
}

export default function ReportesPage() {
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [tipoReporte, setTipoReporte] = useState('visitas')
  const [loading, setLoading] = useState(false)

  const { contactos } = useContactos()
  const { fichas } = useFichas()
  const { instituciones } = useInstituciones()

  useEffect(() => {
    const now = new Date()
    const inicio = startOfMonth(subMonths(now, 1))
    const fin = endOfMonth(now)
    setFechaInicio(format(inicio, 'yyyy-MM-dd'))
    setFechaFin(format(fin, 'yyyy-MM-dd'))
  }, [])

  const descargarExcel = (sheets: { nombre: string; datos: Record<string, unknown>[] }[], nombreArchivo: string) => {
    const workbook = XLSX.utils.book_new()
    for (const sheet of sheets) {
      const worksheet = XLSX.utils.json_to_sheet(sheet.datos)
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.nombre)
    }
    const fecha = format(new Date(), 'yyyy-MM-dd')
    XLSX.writeFile(workbook, `${nombreArchivo}_${fecha}.xlsx`)
  }

  const generateVisitasReport = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('visitas')
        .select(`
          id,
          fecha_visita,
          estado,
          validacion_gps,
          distancia_metros,
          updated_at,
          tipo_dia,
          pal:users(nombre_completo),
          institucion:instituciones(nombre),
          fotos_evidencia(id, url_storage)
        `)
        .gte('fecha_visita', `${fechaInicio}T00:00:00`)
        .lte('fecha_visita', `${fechaFin}T23:59:59`)
        .order('fecha_visita', { ascending: true })

      if (error) throw error
      if (!data?.length) {
        toast.warning('No hay visitas en el período seleccionado')
        return
      }

      const datos = data.map((v: any) => ({
        'ID': v.id,
        'PAL': v.pal?.nombre_completo || 'N/A',
        'Institución': v.institucion?.nombre || (v.tipo_dia === 'vacaciones' ? 'Vacaciones' : (v.tipo_dia === 'home_office' ? 'Home office' : 'N/A')),
        'Fecha': format(new Date(v.fecha_visita), 'dd/MM/yyyy HH:mm'),
        'Estado': v.estado,
        'Validación GPS': v.validacion_gps ? 'Sí' : 'No',
        'Distancia (m)': v.distancia_metros ?? '',
        'Fotos Evidencia': v.fotos_evidencia?.map((f: any) => f.url_storage).join(', ') || '',
        'Última Actualización': format(new Date(v.updated_at), 'dd/MM/yyyy HH:mm'),
      }))

      descargarExcel([{ nombre: 'Visitas', datos }], 'reporte_visitas')
      toast.success('Reporte de visitas descargado')
    } catch (err) {
      console.error(err)
      toast.error('Error al generar el reporte')
    } finally {
      setLoading(false)
    }
  }

  const generateActividadesReport = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('actividades')
        .select(`
          id,
          descripcion_actividad,
          temas_impartidos,
          notas,
          fecha_actividad,
          hora_actividad,
          tipo_actividad,
          pal:users(nombre_completo),
          contacto:contactos(nombre, apellido_pat, apellido_mat, tipo_contacto),
          entrega_sobres:catalogos!actividades_entrega_sobres_id_fkey(nombre),
          entrega_kit_rash:catalogos!actividades_entrega_kit_rash_id_fkey(nombre),
          institucion:instituciones(nombre),
          created_at
        `)
        .gte('fecha_actividad', fechaInicio)
        .lte('fecha_actividad', fechaFin)
        .order('fecha_actividad', { ascending: true })

      if (error) throw error
      if (!data?.length) {
        toast.warning('No hay actividades en el período seleccionado')
        return
      }

      const datos = data.map((a: any) => ({
        'ID': a.id,
        'Tipo de Actividad': a.tipo_actividad === 'presencial' ? 'Presencial' : 'Telefónica',
        'PAL': a.pal?.nombre_completo || 'N/A',
        'Institución': a.institucion?.nombre || 'N/A',
        'Contacto': a.contacto
          ? [a.contacto.nombre, a.contacto.apellido_pat, a.contacto.apellido_mat].filter(Boolean).join(' ')
          : 'N/A',
        'Tipo Contacto': getTipoContactoLabel(a.contacto?.tipo_contacto) || 'N/A',
        'Descripción Actividad': a.descripcion_actividad || '',
        'Temas Impartidos': a.temas_impartidos || '',
        'Entrega Sobres': a.entrega_sobres?.nombre || '',
        'Entrega Kit Rash': a.entrega_kit_rash?.nombre || '',
        'Notas': a.notas || '',
        'Fecha Actividad': a.fecha_actividad,
        'Hora Actividad': a.hora_actividad || '',
        'Fecha Registro': format(new Date(a.created_at), 'dd/MM/yyyy HH:mm'),
      }))

      descargarExcel([{ nombre: 'Actividades', datos }], 'reporte_actividades')
      toast.success('Reporte de actividades descargado')
    } catch (err) {
      console.error(err)
      toast.error('Error al generar el reporte')
    } finally {
      setLoading(false)
    }
  }

  const generateContactosReport = () => {
    try {
      setLoading(true)

      if (!contactos.length) {
        toast.warning('No hay contactos registrados')
        return
      }

      const datos = contactos.map(c => ({
        'Nombre': c.nombre,
        'Apellido Paterno': c.apellido_pat || '',
        'Apellido Materno': c.apellido_mat || '',
        'Institución': c.institucion?.nombre || 'N/A',
        'Tipo Contacto': getTipoContactoLabel(c.tipo_contacto),
      }))

      descargarExcel([{ nombre: 'Contactos', datos }], 'reporte_contactos')
      toast.success('Reporte de contactos descargado')
    } catch (err) {
      console.error(err)
      toast.error('Error al generar el reporte')
    } finally {
      setLoading(false)
    }
  }

  const generateFichasReport = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('ficha_paciente')
        .select(`
          id,
          folio,
          diagnostico,
          terapia,
          dosis,
          fecha_inicio_tratamiento,
          institucion:instituciones(nombre),
          paciente:contactos!paciente_id(
            nombre, apellido_pat, apellido_mat,
            pal:users(nombre_completo)
          ),
          doctor:contactos!doctor_id(nombre, apellido_pat, apellido_mat),
          fechas_tratamiento(id, fecha_programada, asistencia)
        `)
        .gte('fecha_inicio_tratamiento', fechaInicio)
        .lte('fecha_inicio_tratamiento', fechaFin)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (!data?.length) {
        toast.warning('No hay fichas en el período seleccionado')
        return
      }

      // Hoja 1: datos principales
      const datosFichas = data.map((f: any) => {
        const pacienteNombre = f.paciente
          ? [f.paciente.nombre, f.paciente.apellido_pat, f.paciente.apellido_mat].filter(Boolean).join(' ')
          : 'N/A'
        const doctorNombre = f.doctor
          ? [f.doctor.nombre, f.doctor.apellido_pat, f.doctor.apellido_mat].filter(Boolean).join(' ')
          : 'N/A'
        const palNombre = f.paciente?.pal?.nombre_completo || 'N/A'

        return {
          'ID': f.id,
          'Folio': f.folio,
          'Paciente': pacienteNombre,
          'Médico': doctorNombre,
          'PAL': palNombre,
          'Institución': f.institucion?.nombre || 'N/A',
          'Diagnóstico': f.diagnostico || '',
          'Terapia': f.terapia || '',
          'Dosis': f.dosis || '',
          'Fecha Inicio Tratamiento': f.fecha_inicio_tratamiento || '',
        }
      })

      // Hoja 2: fechas de tratamiento agrupadas por paciente
      const datosFechas = data.map((f: any) => {
        const pacienteNombre = f.paciente
          ? [f.paciente.nombre, f.paciente.apellido_pat, f.paciente.apellido_mat].filter(Boolean).join(' ')
          : 'N/A'

        const fechas = (f.fechas_tratamiento || [])
          .sort((a: any, b: any) => a.fecha_programada.localeCompare(b.fecha_programada))
          .slice(0, 5)

        const fila: Record<string, unknown> = {
          'ID': f.id,
          'Folio': f.folio,
          'Paciente': pacienteNombre,
        }

        for (let i = 0; i < 5; i++) {
          const ft = fechas[i]
          fila[`Fecha ${i + 1}`] = ft?.fecha_programada || ''
          fila[`Estado ${i + 1}`] = ft ? (ft.asistencia ? 'Asistió' : 'No asistió') : ''
        }

        return fila
      })

      descargarExcel([
        { nombre: 'Fichas', datos: datosFichas },
        { nombre: 'Fechas Tratamiento', datos: datosFechas },
      ], 'reporte_pacientes')

      toast.success('Reporte de pacientes descargado')
    } catch (err) {
      console.error(err)
      toast.error('Error al generar el reporte')
    } finally {
      setLoading(false)
    }
  }

  const generateInstitucionesReport = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('instituciones')
        .select(`
          id,
          nombre,
          direccion,
          ciudad,
          estado,
          visitas(
            fecha_visita,
            pal:users(nombre_completo)
          )
        `)
        .order('nombre')

      if (error) throw error
      if (!data?.length) {
        toast.warning('No hay instituciones registradas')
        return
      }

      const datos = data.map((inst: any) => {
        const visitasOrdenadas = (inst.visitas || [])
          .sort((a: any, b: any) => new Date(b.fecha_visita).getTime() - new Date(a.fecha_visita).getTime())
        const ultimaVisita = visitasOrdenadas[0]

        return {
          'Institución': inst.nombre,
          'Dirección': inst.direccion || '',
          'Ciudad': inst.ciudad || '',
          'Estado': inst.estado || '',
          'PAL Asignado': ultimaVisita?.pal?.nombre_completo || 'Sin visitas',
          'Última Visita': ultimaVisita?.fecha_visita
            ? format(new Date(ultimaVisita.fecha_visita), 'dd/MM/yyyy')
            : '',
          'Total Visitas': inst.visitas?.length || 0,
        }
      })

      descargarExcel([{ nombre: 'Instituciones', datos }], 'reporte_instituciones')
      toast.success('Reporte de instituciones descargado')
    } catch (err) {
      console.error(err)
      toast.error('Error al generar el reporte')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    switch (tipoReporte) {
      case 'visitas': generateVisitasReport(); break
      case 'actividades': generateActividadesReport(); break
      case 'contactos': generateContactosReport(); break
      case 'pacientes': generateFichasReport(); break
      case 'instituciones': generateInstitucionesReport(); break
      default: toast.error('Selecciona un tipo de reporte válido')
    }
  }

  const mostrarFiltroFecha = tipoReporte !== 'contactos' && tipoReporte !== 'instituciones'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes y Exportaciones</h1>
        <p className="text-muted-foreground">
          Genera reportes en Excel de toda la información del sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{contactos.length}</div>
            <p className="text-sm text-muted-foreground">Contactos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">{fichas.length}</div>
            <p className="text-sm text-muted-foreground">Pacientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Building className="h-6 w-6 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold">{instituciones.length}</div>
            <p className="text-sm text-muted-foreground">Instituciones</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{fichas.length + contactos.length}</div>
            <p className="text-sm text-muted-foreground">Total registros</p>
          </CardContent>
        </Card>
      </div>

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
                  <SelectItem value="instituciones">Instituciones y PAL Asignado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mostrarFiltroFecha && (
              <>
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
              </>
            )}

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
            <p className="text-sm text-muted-foreground">
              {tipoReporte === 'visitas' && 'Exporta visitas del período con PAL, institución, estado, validación GPS, fotos de evidencia y fecha de actualización.'}
              {tipoReporte === 'actividades' && 'Exporta actividades del período con contacto, temas impartidos, entregas y notas.'}
              {tipoReporte === 'contactos' && 'Exporta la base completa de contactos sin filtro de fecha.'}
              {tipoReporte === 'pacientes' && 'Exporta fichas de pacientes con dos hojas: datos principales y fechas de tratamiento agrupadas por paciente.'}
              {tipoReporte === 'instituciones' && 'Exporta todas las instituciones con el PAL asignado según su última visita registrada.'}
            </p>
          </div>
        </CardContent>
      </Card>

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