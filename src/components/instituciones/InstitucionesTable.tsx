import { useState } from 'react'
import { Pencil, Trash2, MapPin, Users, Calendar, Building2 } from 'lucide-react'
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
  if (loading) {
    return <div>Cargando...</div>
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
          <TableRow key={institucion.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
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
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                {institucion.contactos_count || 0}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {institucion.visitas_count || 0}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onEdit(institucion)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onDelete(institucion.id)}
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