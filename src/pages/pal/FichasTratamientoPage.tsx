// src/pages/pal/FichasTratamientoPage.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FichaTratamientoForm } from '@/components/fichas/FichaTratamientoForm';
import { FichasTratamientoList } from '@/components/fichas/FichasTratamientoList';
import { CalendarioTratamiento } from '@/components/fichas/CalendarioTratamiento';
import { useFichasTratamiento } from '@/hooks/useFichasTratamiento';
import type { 
  FichaTratamientoFormData, 
  FichaTratamientoConRelaciones 
} from '@/types/fichaTratamiento';
import { Plus, FileText, Calendar, Activity } from 'lucide-react';

export default function FichasTratamientoPage() {
  const {
    fichas,
    loading,
    createFicha,
    deleteFicha,
    marcarAsistencia,
  } = useFichasTratamiento();

  const [showForm, setShowForm] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState<FichaTratamientoConRelaciones | null>(null);

  // Estadísticas generales
  const totalFichas = fichas.length;
  const fichasActivas = fichas.filter(f => new Date(f.fecha_fin) >= new Date()).length;
  const totalCitas = fichas.reduce((acc, f) => acc + (f.fechas_tratamiento?.length || 0), 0);
  const citasAsistidas = fichas.reduce(
    (acc, f) => acc + (f.fechas_tratamiento?.filter(ft => ft.asistencia).length || 0),
    0
  );

  const handleCreateFicha = async (data: FichaTratamientoFormData) => {
    await createFicha(data);
    setShowForm(false);
  };

  const handleViewFicha = (ficha: FichaTratamientoConRelaciones) => {
    setSelectedFicha(ficha);
  };

  const handleDeleteFicha = async (id: string) => {
    await deleteFicha(id);
  };

  const handleMarcarAsistencia = async (fechaId: string, asistencia: boolean, notas?: string) => {
    await marcarAsistencia(fechaId, asistencia, notas);
    // Recargar la ficha seleccionada si existe
    if (selectedFicha) {
      const fichaActualizada = fichas.find(f => f.id === selectedFicha.id);
      if (fichaActualizada) {
        setSelectedFicha(fichaActualizada);
      }
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fichas de Tratamiento</h1>
          <p className="text-muted-foreground">
            Gestiona y da seguimiento a los tratamientos de pacientes
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Ficha
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Fichas</p>
                <p className="text-2xl font-bold">{totalFichas}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fichas Activas</p>
                <p className="text-2xl font-bold">{fichasActivas}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Citas</p>
                <p className="text-2xl font-bold">{totalCitas}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Asistencias</p>
                <p className="text-2xl font-bold">
                  {citasAsistidas}
                  <span className="text-sm text-muted-foreground ml-1">
                    ({totalCitas > 0 ? Math.round((citasAsistidas / totalCitas) * 100) : 0}%)
                  </span>
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de fichas */}
      <Card>
        <CardContent className="pt-6">
          <FichasTratamientoList
            fichas={fichas}
            onView={handleViewFicha}
            onDelete={handleDeleteFicha}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Dialog: Crear ficha */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Ficha de Tratamiento</DialogTitle>
          </DialogHeader>
          <FichaTratamientoForm
            onSubmit={handleCreateFicha}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Ver detalle de ficha */}
      <Dialog open={!!selectedFicha} onOpenChange={() => setSelectedFicha(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Ficha de Tratamiento</DialogTitle>
          </DialogHeader>

          {selectedFicha && (
            <Tabs defaultValue="info" className="w-full">
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
                    {/* Información del Paciente */}
                    <div>
                      <h3 className="font-semibold mb-2">Paciente</h3>
                      <p className="text-lg">{selectedFicha.nombre_paciente}</p>
                    </div>

                    {/* Información del Médico */}
                    <div>
                      <h3 className="font-semibold mb-2">Médico</h3>
                      <p>{selectedFicha.nombre_medico}</p>
                    </div>

                    {/* Institución */}
                    <div>
                      <h3 className="font-semibold mb-2">Institución</h3>
                      <p>{selectedFicha.institucion?.nombre || '-'}</p>
                    </div>

                    {/* Información del Tratamiento */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-2">Sector</h3>
                        <p>{selectedFicha.sector?.nombre || '-'}</p>
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
                    </div>

                    {/* Programación */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <h3 className="font-semibold mb-2">Periodicidad</h3>
                        <p className="capitalize">{selectedFicha.periodicidad}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Fecha Inicio</h3>
                        <p>{new Date(selectedFicha.fecha_inicio).toLocaleDateString('es-MX')}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Fecha Fin</h3>
                        <p>{new Date(selectedFicha.fecha_fin).toLocaleDateString('es-MX')}</p>
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}