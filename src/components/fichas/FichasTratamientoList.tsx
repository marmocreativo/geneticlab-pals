// src/components/fichas/FichasTratamientoList.tsx

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { FichaTratamientoConRelaciones } from '@/types/fichaTratamiento';
import { Eye, Trash2, Search, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface FichasTratamientoListProps {
  fichas: FichaTratamientoConRelaciones[];
  onView: (ficha: FichaTratamientoConRelaciones) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export function FichasTratamientoList({
  fichas,
  onView,
  onDelete,
  loading,
}: FichasTratamientoListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [fichaToDelete, setFichaToDelete] = useState<string | null>(null);

  // Filtrar fichas
  const fichasFiltradas = fichas.filter((ficha) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      ficha.nombre_paciente.toLowerCase().includes(searchLower) ||
      ficha.nombre_medico.toLowerCase().includes(searchLower) ||
      ficha.institucion?.nombre.toLowerCase().includes(searchLower) ||
      ficha.diagnostico?.nombre.toLowerCase().includes(searchLower)
    );
  });

  // Calcular estadísticas de asistencia
  const calcularAsistencia = (ficha: FichaTratamientoConRelaciones) => {
    if (!ficha.fechas_tratamiento || ficha.fechas_tratamiento.length === 0) {
      return { asistidas: 0, total: 0, porcentaje: 0 };
    }

    const total = ficha.fechas_tratamiento.length;
    const asistidas = ficha.fechas_tratamiento.filter((f) => f.asistencia).length;
    const porcentaje = Math.round((asistidas / total) * 100);

    return { asistidas, total, porcentaje };
  };

  const handleDelete = () => {
    if (fichaToDelete) {
      onDelete(fichaToDelete);
      setFichaToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Cargando fichas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente, médico, institución..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Resumen */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Mostrando {fichasFiltradas.length} de {fichas.length} fichas
        </p>
      </div>

      {/* Tabla */}
      {fichasFiltradas.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm
            ? 'No se encontraron fichas con ese criterio'
            : 'No hay fichas de tratamiento registradas'}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Institución</TableHead>
                <TableHead>Diagnóstico</TableHead>
                <TableHead>Terapia</TableHead>
                <TableHead>Periodicidad</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Asistencia</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fichasFiltradas.map((ficha) => {
                const asistencia = calcularAsistencia(ficha);
                return (
                  <TableRow key={ficha.id}>
                    <TableCell className="font-medium">
                      {ficha.nombre_paciente}
                    </TableCell>
                    <TableCell>{ficha.nombre_medico}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        {ficha.institucion?.nombre || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {ficha.diagnostico?.nombre ? (
                        <Badge variant="outline">{ficha.diagnostico.nombre}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {ficha.terapia?.nombre ? (
                        <Badge variant="secondary">{ficha.terapia.nombre}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ficha.periodicidad === 'semanal' ? 'default' : 'outline'}>
                        {ficha.periodicidad === 'semanal' ? 'Semanal' : 'Bisemanal'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(ficha.fecha_inicio), 'dd/MMM', { locale: es })}
                        </div>
                        <div className="text-muted-foreground">
                          → {format(new Date(ficha.fecha_fin), 'dd/MMM/yy', { locale: es })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {asistencia.asistidas} / {asistencia.total}
                        </div>
                        <div
                          className={`text-xs ${
                            asistencia.porcentaje >= 80
                              ? 'text-green-600'
                              : asistencia.porcentaje >= 50
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {asistencia.porcentaje}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(ficha)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFichaToDelete(ficha.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog de confirmación */}
      <AlertDialog open={!!fichaToDelete} onOpenChange={() => setFichaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ficha de tratamiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todas las fechas de tratamiento
              asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}