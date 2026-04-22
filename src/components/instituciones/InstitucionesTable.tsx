import { Pencil, Trash2, MapPin, Users, Calendar, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface InstitucionesTableProps {
  instituciones: any[]
  loading: boolean
  onEdit: (institucion: any) => void
  onDelete: (id: string) => void
}

export function InstitucionesTable({ 
  instituciones, 
  loading, 
  onEdit, 
  onDelete 
}: InstitucionesTableProps) {
  const navigate = useNavigate()

  if (loading) {
    return <div className="text-center py-8 text-sm text-muted-foreground">Cargando...</div>
  }

  if (instituciones.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No hay instituciones registradas</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Institución</TableHead>
          <TableHead>Sector</TableHead>
          <TableHead>Contactos</TableHead>
          <TableHead>Visitas</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {instituciones.map((institucion) => (
          <TableRow
            key={institucion.id}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate(`/admin/instituciones/${institucion.id}`)}
          >
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{institucion.nombre}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{institucion.direccion}</span>
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">
                {institucion.sector_nombre || 'Sin sector'}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                {institucion.contactos_count || 0}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {institucion.visitas_count || 0}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onEdit(institucion) }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onDelete(institucion.id) }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}