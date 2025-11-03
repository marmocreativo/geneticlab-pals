// src/components/fichas/CalendarioTratamiento.tsx

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { FechaTratamiento } from '@/types/fichaTratamiento';
import { Calendar, Check, X, FileText } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarioTratamientoProps {
  fechas: FechaTratamiento[];
  onMarcarAsistencia: (fechaId: string, asistencia: boolean, notas?: string) => Promise<void>;
  readonly?: boolean;
}

export function CalendarioTratamiento({
  fechas,
  onMarcarAsistencia,
  readonly = false,
}: CalendarioTratamientoProps) {
  const [selectedFecha, setSelectedFecha] = useState<FechaTratamiento | null>(null);
  const [editingAsistencia, setEditingAsistencia] = useState(false);
  const [notas, setNotas] = useState('');

  // Ordenar fechas por fecha programada
  const fechasOrdenadas = [...fechas].sort(
    (a, b) => new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime()
  );

  // Calcular estadísticas
  const totalFechas = fechas.length;
  const asistencias = fechas.filter((f) => f.asistencia).length;
  const porcentajeAsistencia = totalFechas > 0 ? Math.round((asistencias / totalFechas) * 100) : 0;
  const fechasPasadas = fechas.filter((f) => isPast(new Date(f.fecha_programada)) && !isToday(new Date(f.fecha_programada))).length;
  const pendientes = fechasPasadas - asistencias;

  const handleOpenDialog = (fecha: FechaTratamiento) => {
    setSelectedFecha(fecha);
    setNotas(fecha.notas || '');
    setEditingAsistencia(false);
  };

  const handleSaveAsistencia = async () => {
    if (!selectedFecha) return;

    await onMarcarAsistencia(
      selectedFecha.id,
      editingAsistencia,
      notas.trim() || undefined
    );
    setSelectedFecha(null);
    setNotas('');
  };

  const getEstadoFecha = (fecha: FechaTratamiento) => {
    const fechaDate = new Date(fecha.fecha_programada);
    const esPasada = isPast(fechaDate) && !isToday(fechaDate);
    const esHoy = isToday(fechaDate);

    if (fecha.asistencia) {
      return { label: 'Asistió', color: 'bg-green-500', icon: Check };
    }

    if (esPasada) {
      return { label: 'Faltó', color: 'bg-red-500', icon: X };
    }

    if (esHoy) {
      return { label: 'Hoy', color: 'bg-blue-500', icon: Calendar };
    }

    return { label: 'Programada', color: 'bg-gray-300', icon: Calendar };
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendario de Citas
            </span>
            <Badge variant="outline">
              {totalFechas} {totalFechas === 1 ? 'cita' : 'citas'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{asistencias}</div>
              <div className="text-xs text-muted-foreground">Asistencias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{pendientes}</div>
              <div className="text-xs text-muted-foreground">Inasistencias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{porcentajeAsistencia}%</div>
              <div className="text-xs text-muted-foreground">Cumplimiento</div>
            </div>
          </div>

          {/* Lista de fechas */}
          <div className="space-y-2">
            {fechasOrdenadas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay fechas programadas
              </div>
            ) : (
              fechasOrdenadas.map((fecha, index) => {
                const estado = getEstadoFecha(fecha);
                const IconoEstado = estado.icon;
                const fechaDate = new Date(fecha.fecha_programada);
                const esPasada = isPast(fechaDate) && !isToday(fechaDate);

                return (
                  <div
                    key={fecha.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleOpenDialog(fecha)}
                  >
                    {/* Número de sesión */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>

                    {/* Fecha */}
                    <div className="flex-1">
                      <div className="font-medium">
                        {format(fechaDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}
                      </div>
                      {fecha.notas && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <FileText className="h-3 w-3" />
                          {fecha.notas}
                        </div>
                      )}
                    </div>

                    {/* Estado */}
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={`${estado.color} text-white flex items-center gap-1`}
                      >
                        <IconoEstado className="h-3 w-3" />
                        {estado.label}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para marcar asistencia */}
      <Dialog open={!!selectedFecha} onOpenChange={() => setSelectedFecha(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedFecha &&
                format(new Date(selectedFecha.fecha_programada), "d 'de' MMMM yyyy", {
                  locale: es,
                })}
            </DialogTitle>
          </DialogHeader>

          {selectedFecha && (
            <div className="space-y-4">
              {/* Checkbox de asistencia */}
              {!readonly && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="asistencia"
                    checked={editingAsistencia}
                    onCheckedChange={(checked) => setEditingAsistencia(checked as boolean)}
                  />
                  <Label
                    htmlFor="asistencia"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Paciente asistió a la cita
                  </Label>
                </div>
              )}

              {/* Estado actual */}
              {readonly && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium">Estado actual:</div>
                  <div className="text-lg">
                    {selectedFecha.asistencia ? (
                      <span className="text-green-600 flex items-center gap-2">
                        <Check className="h-5 w-5" />
                        Paciente asistió
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-2">
                        <X className="h-5 w-5" />
                        Paciente no asistió
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Notas */}
              <div>
                <Label htmlFor="notas">Notas (opcional)</Label>
                <Textarea
                  id="notas"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Agregar observaciones sobre la cita..."
                  rows={4}
                  disabled={readonly}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedFecha(null)}>
              {readonly ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!readonly && (
              <Button onClick={handleSaveAsistencia}>
                Guardar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}