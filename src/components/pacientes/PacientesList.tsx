import { useState } from 'react';
import { Pencil, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PacienteForm } from './PacienteForm';
import { usePacientes } from '@/hooks/usePacientes';
import type { Paciente, PacienteInput } from '@/services/pacientesService';

export const PacientesList = () => {
  const {
    pacientes,
    loading,
    searchQuery,
    setSearchQuery,
    createPaciente,
    updatePaciente,
    deletePaciente
  } = usePacientes();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | undefined>();

  const handleCreate = () => {
    setSelectedPaciente(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este paciente?')) {
      await deletePaciente(id);
    }
  };

  const handleSubmit = async (data: PacienteInput) => {
    if (selectedPaciente) {
      await updatePaciente(selectedPaciente.id, data);
    } else {
      await createPaciente(data);
    }
    setIsDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pacientes</CardTitle>
          <Button onClick={handleCreate}>
            <UserPlus className="w-4 h-4 mr-2" />
            Nuevo Paciente
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Buscar por nombre, PM o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Cargando...
          </div>
        ) : pacientes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron pacientes
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Número PM</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pacientes.map((paciente) => (
                  <TableRow key={paciente.id}>
                    <TableCell className="font-medium">
                      {paciente.nombre_completo}
                    </TableCell>
                    <TableCell>{paciente.numero_pm || '-'}</TableCell>
                    <TableCell>{paciente.telefono || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(paciente)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(paciente.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedPaciente ? 'Editar Paciente' : 'Nuevo Paciente'}
            </DialogTitle>
          </DialogHeader>
          <PacienteForm
            paciente={selectedPaciente}
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};