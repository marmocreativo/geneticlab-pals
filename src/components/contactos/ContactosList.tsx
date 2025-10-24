import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Contacto } from '@/types/contacto';
import { Trash2, Search, MapPin, Phone, User, CheckCircle2 } from 'lucide-react';

interface ContactosListProps {
  contactos: Contacto[];
  loading: boolean;
  onDelete: (id: string) => Promise<void>;
  onConfirm?: (contacto: Contacto) => void;
  showConfirmButton?: boolean;
}

export function ContactosList({
  contactos,
  loading,
  onDelete,
  onConfirm,
  showConfirmButton = false,
}: ContactosListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredContactos = contactos.filter((contacto) => {
    const searchLower = searchTerm.toLowerCase();
    const nombreCompleto = `${contacto.nombre || ''} ${contacto.apellido_paterno || ''} ${contacto.apellido_materno || ''}`.toLowerCase();
    return (
      nombreCompleto.includes(searchLower) ||
      contacto.telefono?.toLowerCase().includes(searchLower) ||
      contacto.numero_pm?.toLowerCase().includes(searchLower)
    );
  });

  const handleDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const getTipoContactoIcon = (tipo?: string) => {
    return tipo === 'presencial' ? (
      <MapPin className="h-4 w-4" />
    ) : tipo === 'telefonico' ? (
      <Phone className="h-4 w-4" />
    ) : null;
  };

  const getContactoConLabel = (tipo?: string) => {
    const labels: Record<string, string> = {
      medico: 'Médico',
      enfermera: 'Enfermera',
      cuidador: 'Cuidador',
      paciente: 'Paciente',
    };
    return tipo ? labels[tipo] || tipo : '-';
  };

  const getEstadoBadge = (estado?: string) => {
    switch (estado) {
      case 'programado':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Programado</Badge>;
      case 'confirmado':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Confirmado</Badge>;
      case 'cancelado':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelado</Badge>;
      default:
        return <Badge variant="outline">Sin estado</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Cargando contactos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contactos ({contactos.length})</CardTitle>
            <div className="w-64">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contacto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredContactos.length === 0 ? (
            <div className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-muted-foreground">
                {searchTerm
                  ? 'No se encontraron contactos'
                  : 'No hay contactos registrados'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Contacto Con</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>No. PM</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContactos.map((contacto) => (
                    <TableRow key={contacto.id}>
                      <TableCell className="font-medium">
                        {new Date(contacto.fecha_contacto).toLocaleString('es-MX', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        {contacto.nombre && contacto.apellido_paterno
                          ? `${contacto.nombre} ${contacto.apellido_paterno} ${contacto.apellido_materno || ''}`
                          : 'Sin especificar'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getContactoConLabel(contacto.contacto_con)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getTipoContactoIcon(contacto.tipo_contacto)}
                          <span className="text-sm capitalize">
                            {contacto.tipo_contacto || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getEstadoBadge(contacto.estado)}
                      </TableCell>
                      <TableCell>{contacto.telefono || '-'}</TableCell>
                      <TableCell>{contacto.numero_pm || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {showConfirmButton && contacto.estado === 'programado' && onConfirm && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onConfirm(contacto)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Confirmar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(contacto.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
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
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El contacto será eliminado
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}