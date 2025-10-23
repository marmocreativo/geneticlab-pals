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
import { MedicoForm } from './MedicoForm';
import { useMedicos } from '@/hooks/useMedicos';
import type { Medico, MedicoInput } from '@/services/medicosService';

export const MedicosList = () => {
  const {
    medicos,
    loading,
    searchQuery,
    setSearchQuery,
    createMedico,
    updateMedico,
    deleteMedico
  } = useMedicos();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMedico, setSelectedMedico] = useState<Medico | undefined>();

  const handleCreate = () => {
    setSelectedMedico(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (medico: Medico) => {
    setSelectedMedico(medico);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este médico?')) {
      await deleteMedico(id);
    }
  };

  const handleSubmit = async (data: MedicoInput) => {
    if (selectedMedico) {
      await updateMedico(selectedMedico.id, data);
    } else {
      await createMedico(data);
    }
    setIsDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Médicos</CardTitle>
          <Button onClick={handleCreate}>
            <UserPlus className="w-4 h-4 mr-2" />
            Nuevo Médico
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
        ) : medicos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron médicos
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Especialidad</TableHead>
                  <TableHead>Número PM</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicos.map((medico) => (
                  <TableRow key={medico.id}>
                    <TableCell className="font-medium">
                      {medico.nombre_completo}
                    </TableCell>
                    <TableCell>{medico.especialidad || '-'}</TableCell>
                    <TableCell>{medico.numero_pm || '-'}</TableCell>
                    <TableCell>{medico.telefono || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(medico)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(medico.id)}
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
              {selectedMedico ? 'Editar Médico' : 'Nuevo Médico'}
            </DialogTitle>
          </DialogHeader>
          <MedicoForm
            medico={selectedMedico}
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};