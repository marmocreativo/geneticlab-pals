import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Activity, User, MapPin, Calendar, Filter, Eye, Edit, Trash2, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useActividades } from '@/hooks/useActividades'
import { useUsers } from '@/hooks/useUsers'
import { useInstituciones } from '@/hooks/useInstituciones'
import { useCatalogos } from '@/hooks/useCatalogos'



export default function AdminActividadesPage() {
  const [filtroInstitucion, setFiltroInstitucion] = useState<string>('todos')
  const [filtroPal, setFiltroPal] = useState<string>('todos')
  const [filtroActividad, setFiltroActividad] = useState<string>('todos')

  const { actividades, loading, fetchAllActividades, formatearFechaHora  } = useActividades()
  const { users } = useUsers()
  const { instituciones } = useInstituciones()
  const { catalogos } = useCatalogos()

  const pals = users.filter(user => user.role === 'pal')
  const tiposActividad = catalogos.filter(cat => cat.tipo === 'descripcion_actividad')

  const actividadesFiltradas = actividades?.filter(actividad => {
    if (filtroInstitucion !== 'todos' && actividad.institucion?.id !== filtroInstitucion) return false
    if (filtroPal !== 'todos' && actividad.pal?.id !== filtroPal) return false
    if (filtroActividad !== 'todos' && actividad.entrega_sobres_id !== filtroActividad) return false
    return true
  }) || []

  useEffect(() => {
    fetchAllActividades()
  }, [fetchAllActividades])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Actividades</h1>
          <p className="text-muted-foreground">
            Administra todas las actividades
          </p>
        </div>
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
              <label className="text-sm font-medium">Tipo de Actividad</label>
              <Select value={filtroActividad} onValueChange={setFiltroActividad}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar actividad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las actividades</SelectItem>
                  {tiposActividad.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
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
          <CardTitle>Actividades ({actividadesFiltradas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando actividades...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>PAL</TableHead>
                  <TableHead>Institución</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Actividad</TableHead>
                  <TableHead>Temas</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actividadesFiltradas.map((actividad) => (
                  <TableRow key={actividad.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div className="text-sm">
                          {formatearFechaHora(actividad)}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{actividad.pal?.nombre_completo || 'N/A'}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{actividad.institucion?.nombre || 'N/A'}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{actividad.contacto?.nombre || 'N/A'}</div>
                        <Badge variant="outline" className="text-xs">
                          {actividad.contacto?.tipo_contacto || 'N/A'}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{actividad.descripcion_actividad || 'Sin descripción'}</div>
                        {actividad.entrega_sobres && (
                          <Badge variant="secondary" className="text-xs">
                            {actividad.entrega_sobres.nombre}
                          </Badge>
                        )}
                        {actividad.entrega_kit_rash && (
                          <Badge variant="secondary" className="text-xs">
                            {actividad.entrega_kit_rash.nombre}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm max-w-40 truncate" title={actividad.temas_impartidos || ''}>
                        {actividad.temas_impartidos || 'Sin temas'}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {actividadesFiltradas.length === 0 && !loading && (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron actividades</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}