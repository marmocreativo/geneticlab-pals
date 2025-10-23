import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InstitucionCard } from './InstitucionCard';
import { InstitucionForm } from './InstitucionForm';
import { MapView } from './MapView';
import { institucionesService } from '@/services/institucionesService';
import { catalogosService } from '@/services/catalogosService';
import type { Institucion } from '@/types/institucion';
import type { Catalogo } from '@/types/catalogo';
import { toast } from 'sonner';

export function InstitucionesList() {
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [sectores, setSectores] = useState<Catalogo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedInstitucion, setSelectedInstitucion] = useState<Institucion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [institucionesData, sectoresData] = await Promise.all([
        institucionesService.getAll(),
        catalogosService.getByTipo('sector'),
      ]);
      setInstituciones(institucionesData);
      setSectores(sectoresData);
    } catch (error) {
      toast.error('No se pudieron cargar las instituciones');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      await institucionesService.create(data);
      toast.success('Institución creada correctamente');
      setShowForm(false);
      loadData();
    } catch (error) {
      toast.error('No se pudo crear la institución');
    }
  };

  const handleUpdate = async (data: any) => {
    if (!selectedInstitucion) return;
    try {
      await institucionesService.update(selectedInstitucion.id, data);
      toast.success('Institución actualizada correctamente');
      setShowForm(false);
      setSelectedInstitucion(null);
      loadData();
    } catch (error) {
      toast.error('No se pudo actualizar la institución');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta institución?')) return;
    try {
      await institucionesService.delete(id);
      toast.success('Institución eliminada correctamente');
      loadData();
    } catch (error) {
      toast.error('No se pudo eliminar la institución');
    }
  };

  const filteredInstituciones = instituciones.filter((inst) => {
    const matchesSearch = inst.nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSector =
      selectedSector === 'all' || inst.sector_id === selectedSector;
    return matchesSearch && matchesSector;
  });

  if (loading) {
    return <div className="p-4 text-center">Cargando...</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Instituciones</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Institución
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar instituciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={selectedSector} onValueChange={setSelectedSector}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por sector" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los sectores</SelectItem>
            {sectores.map((sector) => (
              <SelectItem key={sector.id} value={sector.id}>
                {sector.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInstituciones.map((institucion) => (
          <InstitucionCard
            key={institucion.id}
            institucion={institucion}
            onEdit={(inst) => {
              setSelectedInstitucion(inst);
              setShowForm(true);
            }}
            onDelete={handleDelete}
            onView={(inst) => {
              setSelectedInstitucion(inst);
              setShowDetails(true);
            }}
          />
        ))}
      </div>

      {filteredInstituciones.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No se encontraron instituciones
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedInstitucion ? 'Editar' : 'Nueva'} Institución
            </DialogTitle>
          </DialogHeader>
          <InstitucionForm
            initialData={selectedInstitucion || undefined}
            onSubmit={selectedInstitucion ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setSelectedInstitucion(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedInstitucion?.nombre}</DialogTitle>
          </DialogHeader>
          {selectedInstitucion && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Dirección</p>
                <p className="text-sm text-muted-foreground">
                  {selectedInstitucion.direccion}
                </p>
              </div>
              <MapView
                lat={selectedInstitucion.latitud}
                lng={selectedInstitucion.longitud}
                nombre={selectedInstitucion.nombre}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}