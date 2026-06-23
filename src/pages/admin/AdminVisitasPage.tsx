import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { MapPin, User, Eye, Edit, Trash2, Plus, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useVisitas } from '@/hooks/useVisitas'
import { useUsers } from '@/hooks/useUsers'
import { useInstituciones } from '@/hooks/useInstituciones'

export default function AdminVisitasPage() {
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroPal, setFiltroPal] = useState<string>('todos')
  const [filtroInstitucion, setFiltroInstitucion] = useState<string>('todos')

  const { visitas, loading, deleteVisita } = useVisitas()
  const { users } = useUsers()
  const { instituciones } = useInstituciones()

  const pals = users.filter(user => user.role === 'pal')

  const visitasFiltradas = visitas?.filter(visita => {
    if (filtroEstado !== 'todos' && visita.estado !== filtroEstado) return false
    if (filtroPal !== 'todos' && visita.pal_id !== filtroPal) return false
    if (filtroInstitucion !== 'todos' && visita.institucion_id !== filtroInstitucion) return false
    return true
  }) || []

  const getEstadoBadge = (estado: string) => {
    const variants = {
      'asistio': 'default',
      'falto': 'destructive', 
      'programada': 'secondary'
    } as const

    const labels = {
      'asistio': 'Asistió',
      'falto': 'Faltó',
      'programada': 'Programada'
    }

    return (
      <Badge variant={variants[estado as keyof typeof variants] || 'secondary'}>
        {labels[estado as keyof typeof labels] || estado}
      </Badge>
    )
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta visita?')) {
      await deleteVisita(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Visitas</h1>
          <p className="text-muted-foreground">
            Administra todas las visitas del sistema
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Visita
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="programada">Programada</SelectItem>
                  <SelectItem value="asistio">Asistió</SelectItem>
                  <SelectItem value="falto">Faltó</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">PAL</label>
              <Select value={filtroPal} onValueChange={setFiltroPal}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar PAL" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los PALs</SelectItem>
                  {pals.map((pal) => (
                    <SelectItem key={pal.id} value={pal.id}>
                      {pal.nombre_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Institución</label>
              <Select value={filtroInstitucion} onValueChange={setFiltroInstitucion}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar institución" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las instituciones</SelectItem>
                  {instituciones.map((institucion) => (
                    <SelectItem key={institucion.id} value={institucion.id}>
                      {institucion.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visitas ({visitasFiltradas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando visitas...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>PAL</TableHead>
                  <TableHead>Institución</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitasFiltradas.map((visita) => (
                  <TableRow key={visita.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {format(new Date(visita.fecha_visita), "dd MMM yyyy", { locale: es })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(visita.fecha_visita), "HH:mm")}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{visita.pal?.nombre_completo || 'N/A'}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{visita.institucion?.nombre || 'Home office'}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {getEstadoBadge(visita.estado)}
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(visita.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}