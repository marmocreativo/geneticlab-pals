import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, Plus, Calendar, User, FileText, Trash2, Edit } from 'lucide-react'
import { useFichas } from '@/hooks/useFichas'
import { useFechasTratamiento } from '@/hooks/useFechasTratamiento'
import { contactosService } from '@/services/contactosService'
import type { FechasTratamientoInsert } from '@/types/ficha'

export default function FechasTratamientoPage() {
  const { fichaId } = useParams<{ fichaId: string }>()
  const navigate = useNavigate()
  const { getFichaById } = useFichas()
  const { fechas, loading, createFecha, updateFecha, deleteFecha } = useFechasTratamiento()

  const [ficha, setFicha] = useState<any>(null)
  const [loadingFicha, setLoadingFicha] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingFecha, setEditingFecha] = useState<any>(null)

  const [formData, setFormData] = useState<FechasTratamientoInsert>({
    ficha_id: fichaId || '',
    fecha_programada: '',
    asistencia: false,
    notas: ''
  })

  // Cargar datos de la ficha
  useEffect(() => {
    const loadFicha = async () => {
        if (fichaId) {
        try {
            setLoadingFicha(true)
            const fichaData = await getFichaById(fichaId)
            setFicha(fichaData)
        } catch (error) {
            console.error('Error loading ficha:', error)
        } finally {
            setLoadingFicha(false)
        }
        }
    }

    loadFicha()
    }, [fichaId])

  const resetForm = () => {
    setFormData({
      ficha_id: fichaId || '',
      fecha_programada: '',
      asistencia: false,
      notas: ''
    })
    setEditingFecha(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingFecha) {
        await updateFecha(editingFecha.id, {
          fecha_programada: formData.fecha_programada,
          asistencia: formData.asistencia,
          notas: formData.notas
        })
      } else {
        await createFecha(formData)
      }
      setOpenDialog(false)
      resetForm()
    } catch (error) {
      console.error('Error saving fecha:', error)
    }
  }

  const handleEdit = (fecha: any) => {
    setEditingFecha(fecha)
    setFormData({
      ficha_id: fecha.ficha_id,
      fecha_programada: fecha.fecha_programada,
      asistencia: fecha.asistencia,
      notas: fecha.notas || ''
    })
    setOpenDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta fecha?')) {
      await deleteFecha(id)
    }
  }

  const formatearNombre = (paciente: any) => {
    if (!paciente) return 'Sin datos'
    return contactosService.formatearNombreCompleto(paciente)
  }

  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return null
    return contactosService.calcularEdad(fechaNacimiento)
  }

  if (loadingFicha) {
    return (
      <div className="p-6">
        <div className="text-center">Cargando datos del paciente...</div>
      </div>
    )
  }

  if (!ficha) {
    return (
      <div className="p-6">
        <div className="text-center">No se encontró la ficha del paciente</div>
      </div>
    )
  }

  const edad = ficha.paciente?.fecha_nacimiento 
    ? calcularEdad(ficha.paciente.fecha_nacimiento)
    : null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/pal/pacientes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Fechas de Tratamiento</h1>
          <p className="text-muted-foreground">
            Folio: {ficha.folio}
          </p>
        </div>
      </div>

      {/* Información del paciente y ficha */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Nombre completo</Label>
              <p className="text-lg">{formatearNombre(ficha.paciente)}</p>
            </div>
            {edad && (
              <div>
                <Label className="text-sm font-medium">Edad</Label>
                <p>{edad} años</p>
              </div>
            )}
            {ficha.paciente?.telefono && (
              <div>
                <Label className="text-sm font-medium">Teléfono</Label>
                <p>{ficha.paciente.telefono}</p>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium">Institución</Label>
              <Badge variant="secondary">{ficha.institucion?.nombre}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información de la Ficha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Folio</Label>
              <p className="text-lg font-mono">{ficha.folio}</p>
            </div>
            {ficha.diagnostico && (
              <div>
                <Label className="text-sm font-medium">Diagnóstico</Label>
                <p>{ficha.diagnostico}</p>
              </div>
            )}
            {ficha.terapia && (
              <div>
                <Label className="text-sm font-medium">Terapia</Label>
                <p>{ficha.terapia}</p>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium">Fecha de registro</Label>
              <p>{new Date(ficha.created_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fechas de tratamiento */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Fechas de Tratamiento ({fechas.length})
            </CardTitle>
            
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Fecha
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingFecha ? 'Editar Fecha' : 'Nueva Fecha de Tratamiento'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="fecha_programada">Fecha programada *</Label>
                    <Input
                      id="fecha_programada"
                      type="date"
                      value={formData.fecha_programada}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        fecha_programada: e.target.value 
                      }))}
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="asistencia"
                      checked={formData.asistencia}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          asistencia: checked as boolean 
                        }))
                      }
                    />
                    <Label htmlFor="asistencia">Paciente asistió</Label>
                  </div>

                  <div>
                    <Label htmlFor="notas">Notas</Label>
                    <Textarea
                      id="notas"
                      value={formData.notas}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        notas: e.target.value 
                      }))}
                      placeholder="Observaciones del tratamiento..."
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingFecha ? 'Actualizar' : 'Agregar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando fechas...</p>
            </div>
          ) : fechas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay fechas de tratamiento registradas</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Asistencia</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead>Registrado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fechas.map((fecha) => (
                    <TableRow key={fecha.id}>
                      <TableCell className="font-medium">
                        {new Date(fecha.fecha_programada).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={fecha.asistencia ? "default" : "secondary"}>
                          {fecha.asistencia ? "Asistió" : "No asistió"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {fecha.notas ? (
                          <div className="truncate" title={fecha.notas}>
                            {fecha.notas}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(fecha.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(fecha)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(fecha.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}