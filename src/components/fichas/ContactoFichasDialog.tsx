// Crear archivo: src/components/fichas/ContactoFichasDialog.tsx

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FichaTratamientoForm } from './FichaTratamientoForm';
import { CalendarioTratamiento } from './CalendarioTratamiento';
import { useFichasTratamiento } from '@/hooks/useFichasTratamiento';
import type { Contacto } from '@/types/contacto';
import type { 
  FichaTratamientoFormData, 
  FichaTratamientoConRelaciones 
} from '@/types/fichaTratamiento';
import { Plus, FileText, Calendar, Pill } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ContactoFichasDialogProps {
  contacto: Contacto | null;
  open: boolean;
  onClose: () => void;
}

export function ContactoFichasDialog({
  contacto,
  open,
  onClose,
}: ContactoFichasDialogProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState<FichaTratamientoConRelaciones | null>(null);
  
  const {
    fichas,
    createFicha,
    marcarAsistencia,
    loading,
  } = useFichasTratamiento();

  // Filtrar fichas de este contacto
  const fichasContacto = fichas.filter(f => f.contacto_id === contacto?.id);

  const handleCreateFicha = async (data: FichaTratamientoFormData) => {
    await createFicha(data);
    setShowForm(false);
  };

  const handleMarcarAsistencia = async (fechaId: string, asistencia: boolean, notas?: string) => {
    await marcarAsistencia(fechaId, asistencia, notas);
  };

  if (!contacto) return null;

  // Pre-llenar datos desde el contacto
  const initialData: Partial<FichaTratamientoFormData> = {
    contacto_id: contacto.id,
    institucion_id: contacto.institucion_id,
    nombre_paciente: contacto.nombre && contacto.apellido_paterno
      ? `${contacto.nombre} ${contacto.apellido_paterno} ${contacto.apellido_materno || ''}`.trim()
      : '',
    nombre_medico: '',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Fichas de Tratamiento
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Contacto: {contacto.nombre} {contacto.apellido_paterno}
          </p>
        </DialogHeader>

        {showForm ? (
          <FichaTratamientoForm
            onSubmit={handleCreateFicha}
            onCancel={() => setShowForm(false)}
            initialData={initialData}
            contactoId={contacto.id}
            institucionId={contacto.institucion_id}
          />
        ) : selectedFicha ? (
          // Vista de detalle de ficha
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={() => setSelectedFicha(null)}
            >
              Volver a la lista
            </Button>

            <Tabs defaultValue="info">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">
                  <FileText className="h-4 w-4 mr-2" />
                  Información
                </TabsTrigger>
                <TabsTrigger value="calendario">
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendario
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-2">Paciente</h3>
                        <p>{selectedFicha.nombre_paciente}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Médico</h3>
                        <p>{selectedFicha.nombre_medico}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Diagnóstico</h3>
                        <p>{selectedFicha.diagnostico?.nombre || '-'}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Terapia</h3>
                        <p>{selectedFicha.terapia?.nombre || '-'}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Dosis</h3>
                        <p>{selectedFicha.dosis || '-'}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Periodicidad</h3>
                        <p className="capitalize">{selectedFicha.periodicidad}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Periodo</h3>
                        <p>
                          {format(new Date(selectedFicha.fecha_inicio), 'dd/MMM/yy', { locale: es })} - {' '}
                          {format(new Date(selectedFicha.fecha_fin), 'dd/MMM/yy', { locale: es })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="calendario">
                <CalendarioTratamiento
                  fechas={selectedFicha.fechas_tratamiento || []}
                  onMarcarAsistencia={handleMarcarAsistencia}
                />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          // Lista de fichas
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {fichasContacto.length} {fichasContacto.length === 1 ? 'ficha' : 'fichas'} registradas
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Ficha
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando fichas...</p>
              </div>
            ) : fichasContacto.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No hay fichas de tratamiento para este contacto
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Ficha
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {fichasContacto.map((ficha) => {
                  const totalCitas = ficha.fechas_tratamiento?.length || 0;
                  const asistencias = ficha.fechas_tratamiento?.filter(f => f.asistencia).length || 0;
                  const porcentaje = totalCitas > 0 ? Math.round((asistencias / totalCitas) * 100) : 0;

                  return (
                    <Card
                      key={ficha.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedFicha(ficha)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{ficha.nombre_paciente}</h3>
                              <Badge variant="outline" className="capitalize">
                                {ficha.periodicidad}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>Médico: {ficha.nombre_medico}</p>
                              <p>Diagnóstico: {ficha.diagnostico?.nombre || '-'}</p>
                              <p>Terapia: {ficha.terapia?.nombre || '-'}</p>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span>
                                {format(new Date(ficha.fecha_inicio), 'dd/MMM/yy', { locale: es })} -{' '}
                                {format(new Date(ficha.fecha_fin), 'dd/MMM/yy', { locale: es })}
                              </span>
                              <Badge variant="secondary">
                                {totalCitas} citas
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{porcentaje}%</div>
                            <div className="text-xs text-muted-foreground">
                              {asistencias}/{totalCitas} asistencias
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}