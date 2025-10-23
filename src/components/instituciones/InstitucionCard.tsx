import { Building2, MapPin, Edit, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Institucion } from '@/types/institucion';

interface InstitucionCardProps {
  institucion: Institucion & { catalogos?: { nombre: string } };
  onEdit?: (institucion: Institucion) => void;
  onDelete?: (id: string) => void;
  onView?: (institucion: Institucion) => void;
}

export function InstitucionCard({
  institucion,
  onEdit,
  onDelete,
  onView,
}: InstitucionCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView?.(institucion)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {institucion.nombre}
            </CardTitle>
            {institucion.catalogos && (
              <Badge variant="secondary">{institucion.catalogos.nombre}</Badge>
            )}
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(institucion);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(institucion.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{institucion.direccion}</span>
        </div>
      </CardContent>
    </Card>
  );
}