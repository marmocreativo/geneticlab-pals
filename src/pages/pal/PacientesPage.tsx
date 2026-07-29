import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import FichaForm from '@/components/pacientes/FichaForm'
import {
  ChevronLeft, ChevronRight, Check, X, Calendar,
  Pencil, Plus, Stethoscope, Building, Star, Trash2, Search, Users
} from 'lucide-react'
import { useFichas } from '@/hooks/useFichas'
import { useInstituciones } from '@/hooks/useInstituciones'
import { useContactos } from '@/hooks/useContactos'
import { useAuth } from '@/contexts/AuthContext'
import { contactosService } from '@/services/contactosService'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { FichaPaciente, FichaPacienteUpdate } from '@/types/ficha'
import type { ContactoInsert, Contacto } from '@/types/contacto'
import type { PeriodicidadFicha } from '@/types/database.types'

const PERIODICIDAD_OPTIONS: { value: PeriodicidadFicha; label: string }[] = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'cada_2_semanas', label: 'Cada 2 semanas' },
  { value: 'cada_3_semanas', label: 'Cada 3 semanas' },
  { value: 'cada_4_semanas', label: 'Cada 4 semanas' },
]

const STATUS_LABELS: Record<string, string> = {
  en_tx: 'En Tx',
  fuera_tx: 'Fuera Tx',
}

const PAGE_SIZE = 12

type QuickFilter = 'todas' | 'en_tx' | 'sin_ficha'

interface EditFormState {
  doctor_id: string
  diagnostico: string
  terapia: string
  dosis: string
  fecha_inicio_tratamiento: string
  fecha_final_tratamiento: string
  numero_pm: string
  status: 'en_tx' | 'fuera_tx'
  periodicidad: PeriodicidadFicha | ''
}

interface ContactoEditForm {
  nombre: string
  apellido_pat: string
  apellido_mat: string
  telefono: string
  fecha_nacimiento: string
}

interface PacientePreseleccionado {
  id: string
  nombre: string
  apellido_pat?: string | null
  apellido_mat?: string | null
  telefono?: string | null
  fecha_nacimiento?: string | null
  institucion_id?: string | null
}

const CONTACTO_EDIT_EMPTY: ContactoEditForm = {
  nombre: '', apellido_pat: '', apellido_mat: '', telefono: '', fecha_nacimiento: '',
}

function IconoFecha({ estado }: { estado?: string }) {
  if (estado === 'asistio') return <Check className="h-4 w-4 text-green-600" />
  if (estado === 'falto') return <X className="h-4 w-4 text-red-500" />
  return <Calendar className="h-4 w-4 text-muted-foreground" />
}

function TablaDates({ ficha, onClick }: { ficha: FichaPaciente; onClick: () => void }) {
  const celdas: ({ fecha: string; estado?: string; esInicio?: boolean })[] = []

  const registradas = [...(ficha.fechas_tratamiento ?? [])]
    .sort((a, b) => new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime())

  const primeraRegistrada = registradas[0]
  const coincideConInicio = ficha.fecha_inicio_tratamiento &&
    primeraRegistrada?.fecha_programada === ficha.fecha_inicio_tratamiento

  if (ficha.fecha_inicio_tratamiento) {
    celdas.push({
      fecha: ficha.fecha_inicio_tratamiento,
      estado: coincideConInicio ? primeraRegistrada.estado : 'asistio',
      esInicio: true,
    })
  } else {
    celdas.push({ fecha: '' })
  }

  const restantes = coincideConInicio ? registradas.slice(1) : registradas
  const siguientes = restantes.slice(0, 4)

  for (let i = 0; i < 4; i++) {
    const f = siguientes[i]
    if (f) {
      celdas.push({ fecha: f.fecha_programada, estado: f.estado })
    } else {
      celdas.push({ fecha: '' })
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="grid grid-cols-5 gap-1 mt-3 w-full text-left"
    >
      {celdas.map((c, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center border rounded p-1 min-h-[48px] bg-muted/30 hover:bg-muted transition-colors"
        >
          {c.fecha ? (
            <>
              <IconoFecha estado={c.estado} />
              <span className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">
                {format(new Date(c.fecha), 'd MMM', { locale: es })}
              </span>
              {c.esInicio && (
                <span className="text-[9px] text-primary font-medium">inicio</span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </div>
      ))}
    </button>
  )
}

export default function PacientesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { fichas, loading: loadingFichas, fetchFichas, updateFicha, deleteFicha } = useFichas()
  const { instituciones } = useInstituciones()
  const { formatearNombreCompleto, createContacto, updateContacto } = useContactos()

  const listTopRef = useRef<HTMLDivElement>(null)

  // Pacientes (fuente principal ahora)
  const [pacientes, setPacientes] = useState<Contacto[]>([])
  const [loadingPacientes, setLoadingPacientes] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    setLoadingPacientes(true)
    contactosService.getPacientesByUser(user.id)
      .then(setPacientes)
      .catch(() => setPacientes([]))
      .finally(() => setLoadingPacientes(false))
  }, [user?.id])

  const loading = loadingFichas || loadingPacientes

  const refetchPacientes = () => {
    if (!user?.id) return
    contactosService.getPacientesByUser(user.id).then(setPacientes).catch(() => {})
  }

  // Filtros de búsqueda (draft refs -> se comprometen solo al presionar "Buscar")
  const nombreRef = useRef<HTMLInputElement>(null)
  const [busquedaInstitucionDraft, setBusquedaInstitucionDraft] = useState<string>('all')
  const [busquedaInstitucionTexto, setBusquedaInstitucionTexto] = useState('')
  const [openInstitucionDropdown, setOpenInstitucionDropdown] = useState(false)
  const estadoRepRef = useRef<string>('all')

  const [busquedaActiva, setBusquedaActiva] = useState<{
    nombre: string
    institucion: string
    estado: string
  }>({ nombre: '', institucion: 'all', estado: 'all' })

  const [quickFilter, setQuickFilter] = useState<QuickFilter>('todas')
  const [pagina, setPagina] = useState(1)

  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<PacientePreseleccionado | null>(null)
  const [openFichaForm, setOpenFichaForm] = useState(false)

  // Dialog edición
  const [editingFicha, setEditingFicha] = useState<FichaPaciente | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({
    doctor_id: '',
    diagnostico: '',
    terapia: '',
    dosis: '',
    fecha_inicio_tratamiento: '',
    fecha_final_tratamiento: '',
    numero_pm: '',
    status: 'en_tx',
    periodicidad: '',
  })
  const [editErrors, setEditErrors] = useState<Partial<Pick<EditFormState, 'dosis' | 'fecha_inicio_tratamiento'>>>({})
  const [saving, setSaving] = useState(false)
  const [medicosEdit, setMedicosEdit] = useState<Contacto[]>([])
  const [loadingMedicos, setLoadingMedicos] = useState(false)
  const [createNewMedico, setCreateNewMedico] = useState(false)
  const [nuevoMedicoData, setNuevoMedicoData] = useState<ContactoInsert>({
    tipo_contacto: 'medico',
    nombre: '',
    apellido_pat: '',
    apellido_mat: '',
    telefono: '',
    pal_id: user?.id || ''
  })

  const [pacienteEditForm, setPacienteEditForm] = useState<ContactoEditForm>(CONTACTO_EDIT_EMPTY)
  const [doctorEditForm, setDoctorEditForm] = useState<ContactoEditForm>(CONTACTO_EDIT_EMPTY)

  const [fichaAEliminar, setFichaAEliminar] = useState<FichaPaciente | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const estadosRepublica = useMemo(() => {
    const estados = instituciones
      .map(i => i.estado)
      .filter((e): e is string => !!e)
    return [...new Set(estados)].sort()
  }, [instituciones])

  const promedioVisitas = instituciones.length > 0
    ? instituciones.reduce((acc, i) => acc + (i.visitas_count ?? 0), 0) / instituciones.length
    : 0

  const institucionesFiltradas = [...instituciones]
    .sort((a, b) => (b.visitas_count ?? 0) - (a.visitas_count ?? 0))
    .filter(i =>
      busquedaInstitucionTexto === '' ||
      i.nombre.toLowerCase().includes(busquedaInstitucionTexto.toLowerCase()) ||
      i.direccion.toLowerCase().includes(busquedaInstitucionTexto.toLowerCase())
    )

  const formatearNombre = (contacto: any) => {
    if (!contacto) return 'Sin datos'
    return [contacto.nombre, contacto.apellido_pat, contacto.apellido_mat].filter(Boolean).join(' ')
  }

  const fichaPorPacienteId = useMemo(() => {
    const map = new Map<string, FichaPaciente>()
    fichas.forEach(f => map.set(f.paciente_id, f))
    return map
  }, [fichas])

  // Lista combinada: cada paciente con su ficha (si tiene)
  const listaCombinada = useMemo(() => {
    return pacientes.map(paciente => ({
      paciente,
      ficha: fichaPorPacienteId.get(paciente.id) ?? null,
    }))
  }, [pacientes, fichaPorPacienteId])

  // Stats globales — SIEMPRE sobre el total, sin filtros de búsqueda
  const stats = useMemo(() => ({
    total: listaCombinada.length,
    enTratamiento: listaCombinada.filter(item => item.ficha?.status === 'en_tx').length,
    sinFicha: listaCombinada.filter(item => !item.ficha).length,
  }), [listaCombinada])

  // Lista filtrada: búsqueda comprometida + filtro rápido
  const listaFiltrada = useMemo(() => {
    let result = listaCombinada

    if (busquedaActiva.nombre.trim()) {
      const texto = busquedaActiva.nombre.trim().toLowerCase()
      result = result.filter(({ paciente }) =>
        formatearNombre(paciente).toLowerCase().includes(texto)
      )
    }

    if (busquedaActiva.institucion !== 'all') {
      result = result.filter(({ paciente }) => paciente.institucion_id === busquedaActiva.institucion)
    }

    if (busquedaActiva.estado !== 'all') {
      const idsInstitucion = new Set(
        instituciones.filter(i => i.estado === busquedaActiva.estado).map(i => i.id)
      )
      result = result.filter(({ paciente }) =>
        paciente.institucion_id ? idsInstitucion.has(paciente.institucion_id) : false
      )
    }

    if (quickFilter === 'en_tx') {
      result = result.filter(({ ficha }) => ficha?.status === 'en_tx')
    } else if (quickFilter === 'sin_ficha') {
      result = result.filter(({ ficha }) => !ficha)
    }

    result = [...result].sort((a, b) => {
      const fechaA = a.ficha?.fecha_inicio_tratamiento ?? ''
      const fechaB = b.ficha?.fecha_inicio_tratamiento ?? ''
      if (fechaA || fechaB) return fechaB.localeCompare(fechaA)
      return formatearNombre(a.paciente).localeCompare(formatearNombre(b.paciente))
    })

    return result
  }, [listaCombinada, busquedaActiva, quickFilter, instituciones])

  const totalPaginas = Math.ceil(listaFiltrada.length / PAGE_SIZE)
  const paginaActual = listaFiltrada.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)

  const scrollToList = () => {
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleBuscar = () => {
    setBusquedaActiva({
      nombre: nombreRef.current?.value ?? '',
      institucion: busquedaInstitucionDraft,
      estado: estadoRepRef.current,
    })
    setPagina(1)
    scrollToList()
  }

  const resetBusqueda = () => {
    if (nombreRef.current) nombreRef.current.value = ''
    setBusquedaInstitucionDraft('all')
    estadoRepRef.current = 'all'
    setBusquedaActiva({ nombre: '', institucion: 'all', estado: 'all' })
  }

  const handleQuickFilter = (filtro: QuickFilter) => {
    resetBusqueda()
    setQuickFilter(filtro)
    setPagina(1)
  }

  const handleOpenEdit = async (ficha: FichaPaciente) => {
    setEditingFicha(ficha)
    setEditForm({
      doctor_id: ficha.doctor_id || '',
      diagnostico: ficha.diagnostico || '',
      terapia: ficha.terapia || '',
      dosis: ficha.dosis || '',
      fecha_inicio_tratamiento: ficha.fecha_inicio_tratamiento || '',
      fecha_final_tratamiento: ficha.fecha_final_tratamiento || '',
      numero_pm: ficha.numero_pm || '',
      status: ficha.status || 'en_tx',
      periodicidad: ficha.periodicidad || '',
    })
    setEditErrors({})
    setCreateNewMedico(false)
    setNuevoMedicoData({
      tipo_contacto: 'medico',
      nombre: '',
      apellido_pat: '',
      apellido_mat: '',
      telefono: '',
      pal_id: user?.id || ''
    })
    setPacienteEditForm({
      nombre: ficha.paciente?.nombre || '',
      apellido_pat: ficha.paciente?.apellido_pat || '',
      apellido_mat: ficha.paciente?.apellido_mat || '',
      telefono: ficha.paciente?.telefono || '',
      fecha_nacimiento: ficha.paciente?.fecha_nacimiento || '',
    })
    setDoctorEditForm({
      nombre: ficha.doctor?.nombre || '',
      apellido_pat: ficha.doctor?.apellido_pat || '',
      apellido_mat: ficha.doctor?.apellido_mat || '',
      telefono: '',
      fecha_nacimiento: '',
    })
    setLoadingMedicos(true)
    try {
      const data = await contactosService.getContactosByInstitucion(ficha.institucion_id)
      setMedicosEdit(data.filter(c => c.tipo_contacto === 'medico'))
    } catch {
      setMedicosEdit([])
    } finally {
      setLoadingMedicos(false)
    }
  }

  const handleCloseEdit = () => {
    setEditingFicha(null)
    setEditForm({
      doctor_id: '', diagnostico: '', terapia: '', dosis: '',
      fecha_inicio_tratamiento: '', fecha_final_tratamiento: '',
      numero_pm: '', status: 'en_tx', periodicidad: '',
    })
    setEditErrors({})
    setMedicosEdit([])
    setCreateNewMedico(false)
    setPacienteEditForm(CONTACTO_EDIT_EMPTY)
    setDoctorEditForm(CONTACTO_EDIT_EMPTY)
  }

  const validateEdit = (): boolean => {
    const errors: typeof editErrors = {}
    if (!editForm.dosis.trim()) errors.dosis = 'Requerido'
    if (!editForm.fecha_inicio_tratamiento) errors.fecha_inicio_tratamiento = 'Requerido'
    setEditErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveEdit = async () => {
    if (!editingFicha || !validateEdit()) return
    setSaving(true)
    try {
      if (editingFicha.paciente_id) {
        await updateContacto(editingFicha.paciente_id, {
          nombre: pacienteEditForm.nombre,
          apellido_pat: pacienteEditForm.apellido_pat || undefined,
          apellido_mat: pacienteEditForm.apellido_mat || undefined,
          telefono: pacienteEditForm.telefono || undefined,
          fecha_nacimiento: pacienteEditForm.fecha_nacimiento || undefined,
        })
      }

      let doctorId = editForm.doctor_id || undefined
      if (createNewMedico && nuevoMedicoData.nombre.trim()) {
        const nuevo = await createContacto({
          ...nuevoMedicoData,
          institucion_id: editingFicha.institucion_id
        })
        doctorId = nuevo.id
      } else if (doctorId) {
        await updateContacto(doctorId, {
          nombre: doctorEditForm.nombre,
          apellido_pat: doctorEditForm.apellido_pat || undefined,
          apellido_mat: doctorEditForm.apellido_mat || undefined,
          telefono: doctorEditForm.telefono || undefined,
        })
      }

      const updates: FichaPacienteUpdate = {
        doctor_id: doctorId,
        diagnostico: editForm.diagnostico || undefined,
        terapia: editForm.terapia || undefined,
        dosis: editForm.dosis,
        fecha_inicio_tratamiento: editForm.fecha_inicio_tratamiento,
        fecha_final_tratamiento: editForm.fecha_final_tratamiento || undefined,
        numero_pm: editForm.numero_pm || undefined,
        status: editForm.status,
        periodicidad: editForm.periodicidad || undefined,
      }
      await updateFicha(editingFicha.id, updates)
      refetchPacientes()
      handleCloseEdit()
    } catch {
      // el hook ya muestra el toast
    } finally {
      setSaving(false)
    }
  }

  const fieldEdit = (key: keyof EditFormState, value: string) => {
    setEditForm(prev => ({ ...prev, [key]: value }))
    if (key === 'dosis' || key === 'fecha_inicio_tratamiento') {
      setEditErrors(prev => ({ ...prev, [key]: undefined }))
    }
  }

  const handleAbrirFichaParaPaciente = (paciente: Contacto) => {
    setPacienteSeleccionado({
      id: paciente.id,
      nombre: paciente.nombre,
      apellido_pat: paciente.apellido_pat,
      apellido_mat: paciente.apellido_mat,
      telefono: paciente.telefono,
      fecha_nacimiento: paciente.fecha_nacimiento,
      institucion_id: paciente.institucion_id,
    })
    setOpenFichaForm(true)
  }

  const handleConfirmDelete = async () => {
    if (!fichaAEliminar) return
    try {
      setEliminando(true)
      await deleteFicha(fichaAEliminar.id)
      setFichaAEliminar(null)
    } catch {
      // el hook ya muestra el toast
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">

      {/* Fila 1: Título */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Censo de Pacientes</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestión de fichas y seguimiento</p>
        </div>
        <div className="hidden md:block">
          <FichaForm onSuccess={() => { fetchFichas(); refetchPacientes() }} />
        </div>
      </div>

      {/* Fila 2: Buscadores */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            ref={nombreRef}
            placeholder="Buscar paciente por nombre..."
            defaultValue=""
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleBuscar() } }}
            className="w-full md:w-64"
          />

          <div className="relative w-full md:w-64">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start font-normal"
              onClick={() => setOpenInstitucionDropdown(prev => !prev)}
            >
              <Building className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
              <span className="truncate">
                {busquedaInstitucionDraft === 'all'
                  ? 'Todas las instituciones'
                  : instituciones.find(i => i.id === busquedaInstitucionDraft)?.nombre ?? 'Todas las instituciones'}
              </span>
            </Button>

            {openInstitucionDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-md max-h-72 overflow-y-auto">
                <div className="p-2 border-b sticky top-0 bg-popover">
                  <Input
                    placeholder="Buscar institución..."
                    defaultValue=""
                    onChange={e => setBusquedaInstitucionTexto(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                    className="h-8 text-sm"
                    autoFocus
                  />
                </div>

                <div
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                  onClick={() => {
                    setBusquedaInstitucionDraft('all')
                    setOpenInstitucionDropdown(false)
                    setBusquedaInstitucionTexto('')
                  }}
                >
                  Todas las instituciones
                </div>

                {institucionesFiltradas.map((inst) => (
                  <div
                    key={inst.id}
                    className="flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-accent"
                    onClick={() => {
                      setBusquedaInstitucionDraft(inst.id)
                      setOpenInstitucionDropdown(false)
                      setBusquedaInstitucionTexto('')
                    }}
                  >
                    <Building className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm flex items-center gap-1 truncate">
                        {(inst.visitas_count ?? 0) > promedioVisitas && (
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                        )}
                        {inst.nombre}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {inst.direccion}
                      </div>
                    </div>
                  </div>
                ))}

                {institucionesFiltradas.length === 0 && (
                  <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                    Sin resultados
                  </div>
                )}
              </div>
            )}
          </div>

          <Select
            defaultValue="all"
            onValueChange={(v) => { estadoRepRef.current = v }}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Estado de la república" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {estadosRepublica.map(estado => (
                <SelectItem key={estado} value={estado}>{estado}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleBuscar} className="md:w-32">
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
        </div>
      </div>

      {/* Fila 3: Stats como filtros rápidos */}
      <div className="grid grid-cols-3 gap-4">
        <Card
          className={`py-0 cursor-pointer transition-colors ${quickFilter === 'todas' ? 'border-primary' : ''}`}
          onClick={() => handleQuickFilter('todas')}
        >
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Total de fichas</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card
          className={`py-0 cursor-pointer transition-colors ${quickFilter === 'en_tx' ? 'border-primary' : ''}`}
          onClick={() => handleQuickFilter('en_tx')}
        >
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">En Tratamiento</p>
            <p className="text-3xl font-bold">{stats.enTratamiento}</p>
          </CardContent>
        </Card>
        <Card
          className={`py-0 cursor-pointer transition-colors ${quickFilter === 'sin_ficha' ? 'border-primary' : ''}`}
          onClick={() => handleQuickFilter('sin_ficha')}
        >
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Sin ficha</p>
            <p className="text-3xl font-bold">{stats.sinFicha}</p>
          </CardContent>
        </Card>
      </div>

      {/* Ancla de scroll */}
      <div ref={listTopRef} />

      {/* Lista de pacientes */}
      {loading ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Cargando pacientes...
          </CardContent>
        </Card>
      ) : listaFiltrada.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="font-medium">No hay pacientes para mostrar</p>
            <p className="text-sm mt-1">Ajusta los filtros o crea un nuevo paciente</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paginaActual.map(({ paciente, ficha }) => (
              <Card key={paciente.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">

                  {ficha ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Folio: {ficha.numero_pm}
                        </span>
                        <Badge
                          variant={ficha.status === 'en_tx' ? 'default' : 'outline'}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {STATUS_LABELS[ficha.status] ?? ficha.status}
                        </Badge>
                      </div>

                      <p className="font-semibold text-base leading-tight">
                        {formatearNombre(paciente)}
                      </p>

                      {ficha.doctor && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Stethoscope className="h-3 w-3 flex-shrink-0" />
                          <span>{formatearNombre(ficha.doctor)}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Building className="h-3 w-3 flex-shrink-0" />
                        <span className="max-w-[180px] truncate">{ficha.institucion?.nombre}</span>
                      </div>

                      {ficha.fecha_inicio_tratamiento && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span>
                            Inicio: {format(new Date(ficha.fecha_inicio_tratamiento + 'T12:00:00'), "d 'de' MMMM yyyy", { locale: es })}
                          </span>
                        </div>
                      )}

                      <TablaDates ficha={ficha} onClick={() => navigate(`/pal/pacientes/${ficha.id}/fechas`)} />

                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handleOpenEdit(ficha)}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Editar ficha
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => navigate(`/pal/pacientes/${ficha.id}/fechas`)}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Ver fechas
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs text-destructive hover:text-destructive"
                          onClick={() => setFichaAEliminar(ficha)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 w-fit">
                        Sin ficha
                      </Badge>

                      <p className="font-semibold text-base leading-tight">
                        {formatearNombre(paciente)}
                      </p>

                      {paciente.telefono && (
                        <p className="text-xs text-muted-foreground">{paciente.telefono}</p>
                      )}

                      {paciente.institucion && (
                        <div className="flex items-start gap-1 text-xs text-muted-foreground">
                          <Building className="h-3 w-3 flex-shrink-0 mt-0.5" />
                          <span>
                            {paciente.institucion.nombre.length > 30
                              ? `${paciente.institucion.nombre.slice(0, 30)}...`
                              : paciente.institucion.nombre}
                          </span>
                        </div>
                      )}

                      <Button
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => handleAbrirFichaParaPaciente(paciente)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Crear ficha
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
  variant="outline"
  size="sm"
  onClick={() => { setPagina(p => Math.max(1, p - 1)); scrollToList() }}
  disabled={pagina === 1}
>
  <ChevronLeft className="h-4 w-4 mr-1" />
  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                   {pagina} de {totalPaginas} · {listaFiltrada.length} total
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setPagina(p => Math.min(totalPaginas, p + 1)); scrollToList() }}
                  disabled={pagina === totalPaginas}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
          )}
        </>
      )}

      {/* FichaForm controlado externamente para pacientes sin ficha */}
      <FichaForm
        onSuccess={() => {
          fetchFichas()
          refetchPacientes()
          setOpenFichaForm(false)
          setPacienteSeleccionado(null)
        }}
        pacientePreseleccionado={pacienteSeleccionado ?? undefined}
        externalOpen={openFichaForm}
        onExternalOpenChange={(v) => {
          setOpenFichaForm(v)
          if (!v) setPacienteSeleccionado(null)
        }}
      />

      {/* Dialog de edición */}
      <Dialog open={!!editingFicha} onOpenChange={(open) => { if (!open) handleCloseEdit() }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Ficha {editingFicha?.folio}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">

            <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
              <Label className="text-sm font-semibold">Datos del paciente</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Nombre</Label>
                  <Input
                    value={pacienteEditForm.nombre}
                    onChange={(e) => setPacienteEditForm(prev => ({ ...prev, nombre: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Apellido Paterno</Label>
                  <Input
                    value={pacienteEditForm.apellido_pat}
                    onChange={(e) => setPacienteEditForm(prev => ({ ...prev, apellido_pat: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Apellido Materno</Label>
                  <Input
                    value={pacienteEditForm.apellido_mat}
                    onChange={(e) => setPacienteEditForm(prev => ({ ...prev, apellido_mat: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Teléfono</Label>
                  <Input
                    value={pacienteEditForm.telefono}
                    onChange={(e) => setPacienteEditForm(prev => ({ ...prev, telefono: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fecha de nacimiento</Label>
                  <Input
                    type="date"
                    value={pacienteEditForm.fecha_nacimiento}
                    onChange={(e) => setPacienteEditForm(prev => ({ ...prev, fecha_nacimiento: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Doctor</Label>
              {!createNewMedico && (
                <Select
                  value={editForm.doctor_id || 'none'}
                  onValueChange={(v) => fieldEdit('doctor_id', v === 'none' ? '' : v)}
                  disabled={loadingMedicos}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingMedicos ? 'Cargando...' : 'Sin doctor asignado'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin doctor asignado</SelectItem>
                    {medicosEdit.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {formatearNombreCompleto(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                variant={createNewMedico ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setCreateNewMedico(!createNewMedico)
                  if (!createNewMedico) fieldEdit('doctor_id', '')
                }}
              >
                {createNewMedico
                  ? <><X className="h-3 w-3 mr-1" /> Cancelar nuevo</>
                  : <><Plus className="h-3 w-3 mr-1" /> Nuevo médico</>}
              </Button>
              {createNewMedico && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs">Nombre <span className="text-destructive">*</span></Label>
                    <Input
                      value={nuevoMedicoData.nombre}
                      onChange={(e) => setNuevoMedicoData(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Nombre"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Apellido Paterno</Label>
                    <Input
                      value={nuevoMedicoData.apellido_pat || ''}
                      onChange={(e) => setNuevoMedicoData(prev => ({ ...prev, apellido_pat: e.target.value }))}
                      placeholder="Apellido paterno"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Apellido Materno</Label>
                    <Input
                      value={nuevoMedicoData.apellido_mat || ''}
                      onChange={(e) => setNuevoMedicoData(prev => ({ ...prev, apellido_mat: e.target.value }))}
                      placeholder="Apellido materno"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Teléfono</Label>
                    <Input
                      value={nuevoMedicoData.telefono || ''}
                      onChange={(e) => setNuevoMedicoData(prev => ({ ...prev, telefono: e.target.value }))}
                      placeholder="Teléfono"
                    />
                  </div>
                </div>
              )}
              {!createNewMedico && editForm.doctor_id && (
                <div className="space-y-2 border rounded-lg p-3 bg-muted/30 mt-2">
                  <Label className="text-sm font-semibold">Datos del doctor</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs">Nombre</Label>
                      <Input
                        value={doctorEditForm.nombre}
                        onChange={(e) => setDoctorEditForm(prev => ({ ...prev, nombre: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Apellido Paterno</Label>
                      <Input
                        value={doctorEditForm.apellido_pat}
                        onChange={(e) => setDoctorEditForm(prev => ({ ...prev, apellido_pat: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Apellido Materno</Label>
                      <Input
                        value={doctorEditForm.apellido_mat}
                        onChange={(e) => setDoctorEditForm(prev => ({ ...prev, apellido_mat: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs">Teléfono</Label>
                      <Input
                        value={doctorEditForm.telefono}
                        onChange={(e) => setDoctorEditForm(prev => ({ ...prev, telefono: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => fieldEdit('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_tx">En Tx</SelectItem>
                    <SelectItem value="fuera_tx">Fuera Tx</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Núm. PM</Label>
                <Input
                  value={editForm.numero_pm}
                  onChange={(e) => fieldEdit('numero_pm', e.target.value)}
                  placeholder="ID en CRM externo"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Dosis <span className="text-destructive">*</span></Label>
                <Input
                  value={editForm.dosis}
                  onChange={(e) => fieldEdit('dosis', e.target.value)}
                  placeholder="Ej. 100mg cada 8h"
                  className={editErrors.dosis ? 'border-destructive' : ''}
                />
                {editErrors.dosis && <p className="text-xs text-destructive">{editErrors.dosis}</p>}
              </div>
              <div className="space-y-1">
                <Label>Periodicidad</Label>
                <Select
                  value={editForm.periodicidad || 'none'}
                  onValueChange={(v) => fieldEdit('periodicidad', v === 'none' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin especificar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin especificar</SelectItem>
                    {PERIODICIDAD_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Inicio de Tratamiento <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={editForm.fecha_inicio_tratamiento}
                  onChange={(e) => fieldEdit('fecha_inicio_tratamiento', e.target.value)}
                  className={editErrors.fecha_inicio_tratamiento ? 'border-destructive' : ''}
                />
                {editErrors.fecha_inicio_tratamiento && (
                  <p className="text-xs text-destructive">{editErrors.fecha_inicio_tratamiento}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Fin de Tratamiento</Label>
                <Input
                  type="date"
                  value={editForm.fecha_final_tratamiento}
                  onChange={(e) => fieldEdit('fecha_final_tratamiento', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Diagnóstico</Label>
              <Textarea
                value={editForm.diagnostico}
                onChange={(e) => fieldEdit('diagnostico', e.target.value)}
                placeholder="Diagnóstico del paciente"
                rows={2}
              />
            </div>

            <div className="space-y-1">
              <Label>Terapia</Label>
              <Textarea
                value={editForm.terapia}
                onChange={(e) => fieldEdit('terapia', e.target.value)}
                placeholder="Terapia indicada"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleCloseEdit} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                <Check className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de confirmación de borrado */}
      <AlertDialog open={!!fichaAEliminar} onOpenChange={(open) => { if (!open) setFichaAEliminar(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta ficha?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la ficha de <strong>{formatearNombre(fichaAEliminar?.paciente)}</strong>
              {' '}(folio {fichaAEliminar?.numero_pm}) junto con todas sus fechas de tratamiento registradas.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={eliminando}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}