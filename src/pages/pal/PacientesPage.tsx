import { useState, useMemo, useEffect, useRef  } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import FichaForm from '@/components/pacientes/FichaForm'
import {
  ChevronLeft, ChevronRight, Check, X, Calendar,
  Pencil, Plus, Stethoscope, Building, Star, UserX
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

interface PacientePreseleccionado {
  id: string
  nombre: string
  apellido_pat?: string | null
  apellido_mat?: string | null
  telefono?: string | null
  fecha_nacimiento?: string | null
  institucion_id?: string | null
}

function IconoFecha({ estado }: { estado?: string }) {
  if (estado === 'asistio') return <Check className="h-4 w-4 text-green-600" />
  if (estado === 'falto') return <X className="h-4 w-4 text-red-500" />
  return <Calendar className="h-4 w-4 text-muted-foreground" />
}

function TablaDates({ ficha }: { ficha: FichaPaciente }) {
  const celdas: ({ fecha: string; estado?: string; esInicio?: boolean })[] = []

  if (ficha.fecha_inicio_tratamiento) {
    celdas.push({ fecha: ficha.fecha_inicio_tratamiento, estado: 'asistio', esInicio: true })
  } else {
    celdas.push({ fecha: '' })
  }

  const registradas = [...(ficha.fechas_tratamiento ?? [])]
    .sort((a, b) => new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime())
    .slice(0, 4)

  for (let i = 0; i < 4; i++) {
    const f = registradas[i]
    if (f) {
      celdas.push({ fecha: f.fecha_programada, estado: f.estado })
    } else {
      celdas.push({ fecha: '' })
    }
  }

  return (
    <div className="grid grid-cols-5 gap-1 mt-3">
      {celdas.map((c, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center border rounded p-1 min-h-[48px] bg-muted/30"
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
    </div>
  )
}

export default function PacientesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { fichas, loading, fetchFichas, updateFicha } = useFichas()
  const { instituciones } = useInstituciones()
  const { formatearNombreCompleto, createContacto } = useContactos()

  const [selectedInstitucion, setSelectedInstitucion] = useState<string>('all')
  const [busquedaInstitucion, setBusquedaInstitucion] = useState('')
  const [openInstitucionDropdown, setOpenInstitucionDropdown] = useState(false)
  const busquedaInstitucionRef = useRef<HTMLInputElement>(null)
  const [filtroEstadoRep, setFiltroEstadoRep] = useState<string>('all')
  const [filtroStatus, setFiltroStatus] = useState<string>('all')
  const [busquedaPaciente, setBusquedaPaciente] = useState('')
  const [pagina, setPagina] = useState(1)

  // Pacientes sin ficha
  const [pacientesSinFicha, setPacientesSinFicha] = useState<Contacto[]>([])
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

  // Cargar pacientes sin ficha cuando las fichas estén listas
  useEffect(() => {
    if (!user?.id || loading) return
    contactosService.getPacientesByUser(user.id).then(pacientes => {
      const idsConFicha = new Set(fichas.map(f => f.paciente_id))
      setPacientesSinFicha(pacientes.filter(p => !idsConFicha.has(p.id)))
    }).catch(() => setPacientesSinFicha([]))
  }, [fichas, user?.id, loading])

  const estadosRepublica = useMemo(() => {
    const estados = instituciones
      .map(i => i.estado)
      .filter((e): e is string => !!e)
    return [...new Set(estados)].sort()
  }, [instituciones])

  // Fichas filtradas y ordenadas
  const fichasFiltradas = useMemo(() => {
    let result = [...fichas]

    if (selectedInstitucion !== 'all') {
      result = result.filter(f => f.institucion_id === selectedInstitucion)
    }

    if (filtroEstadoRep !== 'all') {
      const idsInstitucion = new Set(
        instituciones.filter(i => i.estado === filtroEstadoRep).map(i => i.id)
      )
      result = result.filter(f => idsInstitucion.has(f.institucion_id))
    }

    if (filtroStatus !== 'all') {
      result = result.filter(f => f.status === filtroStatus)
    }

    if (busquedaPaciente.trim()) {
      const texto = busquedaPaciente.trim().toLowerCase()
      result = result.filter(f => {
        const p = f.paciente
        if (!p) return false
        const nombre = [p.nombre, p.apellido_pat, p.apellido_mat]
          .filter(Boolean).join(' ').toLowerCase()
        return nombre.includes(texto)
      })
    }

    result.sort((a, b) => {
      const fechaA = a.fecha_inicio_tratamiento ?? ''
      const fechaB = b.fecha_inicio_tratamiento ?? ''
      return fechaB.localeCompare(fechaA)
    })

    return result
  }, [fichas, selectedInstitucion, filtroEstadoRep, filtroStatus, busquedaPaciente, instituciones])

  const totalPaginas = Math.ceil(fichasFiltradas.length / PAGE_SIZE)
  const fichasPagina = fichasFiltradas.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)

  const handleInstitucionChange = (val: string) => {
    setSelectedInstitucion(val)
    setPagina(1)
  }

  const handleEstadoRepChange = (val: string) => {
    setFiltroEstadoRep(val)
    setPagina(1)
  }

  const handleStatusChange = (val: string) => {
    setFiltroStatus(val)
    setPagina(1)
  }

  const stats = useMemo(() => ({
    total: fichasFiltradas.length,
    enTratamiento: fichasFiltradas.filter(f => f.status === 'en_tx').length,
  }), [fichasFiltradas])

  const promedioVisitas = instituciones.length > 0
    ? instituciones.reduce((acc, i) => acc + (i.visitas_count ?? 0), 0) / instituciones.length
    : 0

  const institucionesFiltradas = [...instituciones]
    .sort((a, b) => (b.visitas_count ?? 0) - (a.visitas_count ?? 0))
    .filter(i =>
      busquedaInstitucion === '' ||
      i.nombre.toLowerCase().includes(busquedaInstitucion.toLowerCase()) ||
      i.direccion.toLowerCase().includes(busquedaInstitucion.toLowerCase())
    )

  const formatearNombre = (contacto: any) => {
    if (!contacto) return 'Sin datos'
    return [contacto.nombre, contacto.apellido_pat, contacto.apellido_mat].filter(Boolean).join(' ')
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
      let doctorId = editForm.doctor_id || undefined
      if (createNewMedico && nuevoMedicoData.nombre.trim()) {
        const nuevo = await createContacto({
          ...nuevoMedicoData,
          institucion_id: editingFicha.institucion_id
        })
        doctorId = nuevo.id
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

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Censo de Pacientes</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestión de fichas y seguimiento</p>
        </div>
        <div className="hidden md:block">
          <FichaForm onSuccess={fetchFichas} />
        </div>
      </div>

      <div className="md:hidden w-full">
        <FichaForm onSuccess={fetchFichas} />
      </div>

      {/* Filtro institución */}
      <div className="flex flex-col gap-3">
        <Input
          placeholder="Buscar paciente por nombre..."
          value={busquedaPaciente}
          onChange={e => { setBusquedaPaciente(e.target.value); setPagina(1) }}
          className="w-full md:w-80"
        />
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative w-full md:w-64">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start font-normal"
              onClick={() => setOpenInstitucionDropdown(prev => !prev)}
            >
              <Building className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
              <span className="truncate">
                {selectedInstitucion === 'all'
                  ? 'Todas las instituciones'
                  : instituciones.find(i => i.id === selectedInstitucion)?.nombre ?? 'Todas las instituciones'}
              </span>
            </Button>

            {openInstitucionDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-md max-h-72 overflow-y-auto">
                <div className="p-2 border-b sticky top-0 bg-popover">
                  <Input
                    ref={busquedaInstitucionRef}
                    placeholder="Buscar institución..."
                    defaultValue=""
                    onChange={e => setBusquedaInstitucion(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                    className="h-8 text-sm"
                    autoFocus
                  />
                </div>

                <div
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                  onClick={() => {
                    handleInstitucionChange('all')
                    setOpenInstitucionDropdown(false)
                    setBusquedaInstitucion('')
                  }}
                >
                  Todas las instituciones
                </div>

                {institucionesFiltradas.map((inst) => (
                  <div
                    key={inst.id}
                    className="flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-accent"
                    onClick={() => {
                      handleInstitucionChange(inst.id)
                      setOpenInstitucionDropdown(false)
                      setBusquedaInstitucion('')
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

          <Select value={filtroEstadoRep} onValueChange={handleEstadoRepChange}>
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

          <Select value={filtroStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Status tratamiento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="en_tx">En Tx</SelectItem>
              <SelectItem value="fuera_tx">Fuera Tx</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Total fichas</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">En Tratamiento</p>
            <p className="text-3xl font-bold">{stats.enTratamiento}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Sin ficha</p>
            <p className="text-3xl font-bold">{pacientesSinFicha.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de fichas */}
      {loading ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Cargando pacientes...
          </CardContent>
        </Card>
      ) : fichasFiltradas.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <p className="font-medium">No hay fichas registradas</p>
            <p className="text-sm mt-1">Crea la primera ficha con el botón de arriba</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {fichasPagina.map(ficha => (
              <Card key={ficha.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">

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
                    {formatearNombre(ficha.paciente)}
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

                  <TablaDates ficha={ficha} />

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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {pagina} de {totalPaginas} · {fichasFiltradas.length} fichas
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Pacientes sin ficha */}
      {pacientesSinFicha.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Sin ficha de tratamiento</h2>
            <Badge variant="outline">{pacientesSinFicha.length}</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pacientesSinFicha.map(paciente => (
              <Card key={paciente.id} className="border-dashed">
                <CardContent className="p-4 space-y-2">
                  <p className="font-semibold text-base leading-tight">
                    {formatearNombre(paciente)}
                  </p>
                  {paciente.telefono && (
                    <p className="text-xs text-muted-foreground">{paciente.telefono}</p>
                  )}
                  {paciente.institucion && (
                    <div className="flex items-start gap-1 text-xs text-muted-foreground">
                      <Building className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      <span>{paciente.institucion.nombre}</span>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* FichaForm controlado externamente para pacientes sin ficha */}
      <FichaForm
        onSuccess={() => {
          fetchFichas()
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
    </div>
  )
}