import { useState } from 'react';
import { useCatalogos } from '@/hooks/useCatalogos';
import type { TipoCatalogo } from '@/types/catalogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit, Power, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { catalogosService } from '@/services/catalogosService';
import { RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CatalogoManagerProps {
  tipo: TipoCatalogo;
  titulo: string;
}

export function CatalogoManager({ tipo, titulo }: CatalogoManagerProps) {
  const { catalogos, loading, createCatalogo, updateCatalogo, toggleActivo, refetch } = useCatalogos(tipo);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [isReplaceDialogOpen, setIsReplaceDialogOpen] = useState(false);
  const [catalogoToReplace, setCatalogoToReplace] = useState<any>(null);
  const [replacementId, setReplacementId] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    console.log('Enviando catálogo:', { tipo, nombre }); // Debug

    if (editingId) {
      const { error } = await updateCatalogo(editingId, { nombre });
      if (error) {
        console.error('Error al actualizar:', error); // Debug
        toast.error(error);
      } else {
        toast.success('Catálogo actualizado correctamente');
        handleClose();
      }
    } else {
      const { error } = await createCatalogo({ tipo, nombre });
      if (error) {
        console.error('Error al crear:', error); // Debug
        toast.error(error);
      } else {
        toast.success('Catálogo creado correctamente');
        handleClose();
      }
    }
  };

  const handleEdit = (catalogo: any) => {
    setEditingId(catalogo.id);
    setNombre(catalogo.nombre);
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setNombre('');
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    const { error } = await toggleActivo(id, !currentState);
    if (error) {
      toast.error(error);
    } else {
      toast.success(currentState ? 'Desactivado' : 'Activado');
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    setIsDeleting(id);
    
    try {
      // Verificar uso del catálogo
      const usoInfo = await catalogosService.verificarUso(id, tipo);
      
      if (usoInfo.usos > 0) {
        // Si tiene usos, mostrar modal de reemplazo
        setCatalogoToReplace({ id, nombre, usos: usoInfo.usos });
        setIsReplaceDialogOpen(true);
      } else {
        // Si no tiene usos, eliminar directamente
        if (!confirm(`¿Estás seguro de eliminar "${nombre}"?`)) {
          return;
        }
        
        await catalogosService.softDelete(id);
        toast.success('Catálogo eliminado correctamente');
        await refetch();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al verificar catálogo');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleReplace = async () => {
    if (!replacementId || !catalogoToReplace) {
      toast.error('Debe seleccionar un catálogo de reemplazo');
      return;
    }
    
    try {
      const resultado = await catalogosService.reemplazar(
        catalogoToReplace.id,
        replacementId,
        tipo
      );
      
      toast.success(
        `Catálogo reemplazado. ${resultado.registros_actualizados} registros actualizados.`
      );
      
      setIsReplaceDialogOpen(false);
      setCatalogoToReplace(null);
      setReplacementId('');
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al reemplazar catálogo');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{titulo}</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingId(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar' : 'Nuevo'} {titulo}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nombre</label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre del catálogo"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingId ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead className="w-[150px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {catalogos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground">
                No hay registros
              </TableCell>
            </TableRow>
          ) : (
            catalogos.map((catalogo) => (
              <TableRow key={catalogo.id}>
                <TableCell className="font-medium">{catalogo.nombre}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(catalogo)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggle(catalogo.id, catalogo.activo)}
                    >
                      <Power className={`h-4 w-4 ${catalogo.activo ? 'text-green-500' : 'text-gray-400'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(catalogo.id, catalogo.nombre)}
                      disabled={isDeleting === catalogo.id}
                    >
                      {isDeleting === catalogo.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
    {/* Modal de reemplazo */}
    <Dialog open={isReplaceDialogOpen} onOpenChange={setIsReplaceDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reemplazar Catálogo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            El catálogo "<strong>{catalogoToReplace?.nombre}</strong>" está siendo usado en{' '}
            <strong>{catalogoToReplace?.usos}</strong> registro(s). 
            Debe ser reemplazado por otro catálogo antes de eliminarlo.
          </p>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              Seleccionar catálogo de reemplazo
            </label>
            <Select value={replacementId} onValueChange={setReplacementId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar catálogo..." />
              </SelectTrigger>
              <SelectContent>
                {catalogos
                  .filter(c => c.id !== catalogoToReplace?.id)
                  .map(catalogo => (
                    <SelectItem key={catalogo.id} value={catalogo.id}>
                      {catalogo.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsReplaceDialogOpen(false);
                setCatalogoToReplace(null);
                setReplacementId('');
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleReplace}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reemplazar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}