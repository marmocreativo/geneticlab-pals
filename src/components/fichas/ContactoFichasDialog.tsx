// src/components/fichas/ContactoFichasDialog.tsx

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FichaTratamientoForm } from './FichaTratamientoForm';
import { CalendarioTratamiento } from './CalendarioTratamiento';
import { useFichasTratamiento } from '@/hooks/useFichasTratamiento';
import type { Contacto } from '@/types/contacto';
import type { FichaTratamientoFormData } from '@/types/fichaTratamiento';
import { Pill, FileText } from 'lucide-react';
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
  const {
    fichas,
    createFicha,
    marcarAsistencia,
    fetchFichas,
    loading,
  } = useFichasTratamiento();

  // Reiniciar y cargar fichas cuando se abre el dialog
  useEffect(() => {
    if (open && contacto) {
      fetchFichas();
    }
  }, [open, contacto]);

  if (!contacto) return null;

  // Obtener la ficha de este contacto (solo una)
  const fichaContacto = fichas.find(f => f.contacto_id === contacto.id);

  const handleCreateFicha = async (data: FichaTratamientoFormData) => {
    await createFicha(data);
  };

  const handleMarcarAsistencia = async (fechaId: string, asistencia: boolean, notas?: string) => {
    await marcarAsistencia(fechaId, asistencia, notas);
  };

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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Ficha de Tratamiento
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Paciente: {contacto.nombre} {contacto.apellido_paterno}
          </p>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Cargando ficha...</p>
          </div>
        ) : fichaContacto ? (
          // Mostrar detalle de la ficha existente - TODO EN UNA VISTA
          <div className="space-y-6">
            {/* Información de la Ficha */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Información del Tratamiento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Paciente</h3>
                    <p>{fichaContacto.nombre_paciente}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Médico</h3>
                    <p>{fichaContacto.nombre_medico}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Institución</h3>
                    <p>{fichaContacto.institucion?.nombre || '-'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Sector</h3>
                    <p>{fichaContacto.sector?.nombre || '-'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Diagnóstico</h3>
                    <p>{fichaContacto.diagnostico?.nombre || '-'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Terapia</h3>
                    <p>{fichaContacto.terapia?.nombre || '-'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Dosis</h3>
                    <p>{fichaContacto.dosis || '-'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Periodicidad</h3>
                    <Badge variant="outline" className="capitalize">
                      {fichaContacto.periodicidad}
                    </Badge>
                  </div>
                </div>

                {/* Fechas en fila separada */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <h3 className="font-semibold mb-2">Fecha Inicio</h3>
                    <p>{format(new Date(fichaContacto.fecha_inicio), "d 'de' MMMM, yyyy", { locale: es })}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Fecha Fin</h3>
                    <p>{format(new Date(fichaContacto.fecha_fin), "d 'de' MMMM, yyyy", { locale: es })}</p>
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {fichaContacto.fechas_tratamiento?.length || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Citas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {fichaContacto.fechas_tratamiento?.filter(f => f.asistencia).length || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Asistencias</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {fichaContacto.fechas_tratamiento?.length
                        ? Math.round(
                            (fichaContacto.fechas_tratamiento.filter(f => f.asistencia).length /
                              fichaContacto.fechas_tratamiento.length) *
                              100
                          )
                        : 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">Cumplimiento</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calendario */}
            <CalendarioTratamiento
              fechas={fichaContacto.fechas_tratamiento || []}
              onMarcarAsistencia={handleMarcarAsistencia}
            />
          </div>
        ) : (
          // Formulario para crear la primera ficha
          <div className="space-y-4">
            <div className="text-center py-6 border rounded-lg bg-muted/30">
              <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-2">
                Este paciente no tiene ficha de tratamiento
              </p>
              <p className="text-sm text-muted-foreground">
                Completa el formulario para crear su ficha
              </p>
            </div>

            <FichaTratamientoForm
              onSubmit={handleCreateFicha}
              onCancel={onClose}
              initialData={initialData}
              contactoId={contacto.id}
              institucionId={contacto.institucion_id}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}