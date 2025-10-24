import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useContactos } from '@/hooks/useContactos';
import { ContactoForm } from '@/components/contactos/ContactoForm';
import { ContactoConfirmForm } from '@/components/contactos/ContactoConfirmForm';
import { ContactosList } from '@/components/contactos/ContactosList';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Calendar, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ContactoFormData, ContactoConfirmData, Contacto } from '@/types/contacto';

export function ContactosPage() {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [selectedContacto, setSelectedContacto] = useState<Contacto | null>(null);

  const {
    contactos,
    contactosProgramados,
    contactosConfirmados,
    loading,
    createContacto,
    confirmContacto,
    deleteContacto,
  } = useContactos(user?.id || '');

  const handleCreate = async (data: ContactoFormData) => {
    await createContacto(data);
    setShowCreateForm(false);
  };

  const handleConfirm = async (data: ContactoConfirmData, fotos: File[]) => {
    if (selectedContacto) {
      await confirmContacto(selectedContacto.id, data, fotos);
      setShowConfirmForm(false);
      setSelectedContacto(null);
    }
  };

  const handleConfirmClick = (contacto: Contacto) => {
    setSelectedContacto(contacto);
    setShowConfirmForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Visitas</h1>
          <p className="text-muted-foreground">
            Programa y confirma tus visitas a instituciones
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Programar Visita
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Visitas
                </p>
                <p className="text-2xl font-bold">{contactos.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Programadas
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {contactosProgramados.length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Confirmadas
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {contactosConfirmados.length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="programadas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="programadas">
            Programadas ({contactosProgramados.length})
          </TabsTrigger>
          <TabsTrigger value="confirmadas">
            Confirmadas ({contactosConfirmados.length})
          </TabsTrigger>
          <TabsTrigger value="todas">
            Todas ({contactos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="programadas">
          <ContactosList
            contactos={contactosProgramados}
            loading={loading}
            onDelete={deleteContacto}
            onConfirm={handleConfirmClick}
            showConfirmButton={true}
          />
        </TabsContent>

        <TabsContent value="confirmadas">
          <ContactosList
            contactos={contactosConfirmados}
            loading={loading}
            onDelete={deleteContacto}
            showConfirmButton={false}
          />
        </TabsContent>

        <TabsContent value="todas">
          <ContactosList
            contactos={contactos}
            loading={loading}
            onDelete={deleteContacto}
            onConfirm={handleConfirmClick}
            showConfirmButton={true}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog para crear visita */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Programar Nueva Visita</DialogTitle>
          </DialogHeader>
          <ContactoForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar visita */}
      <Dialog open={showConfirmForm} onOpenChange={setShowConfirmForm}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmar Visita Realizada</DialogTitle>
          </DialogHeader>
          {selectedContacto && (
            <ContactoConfirmForm
              contacto={selectedContacto}
              onSubmit={handleConfirm}
              onCancel={() => {
                setShowConfirmForm(false);
                setSelectedContacto(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}