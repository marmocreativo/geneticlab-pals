import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CatalogoManager } from '@/components/catalogos/CatalogoManager';

export default function CatalogosPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Gestión de Catálogos</h1>
      
      <Tabs defaultValue="diagnostico" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-6">
          <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
          <TabsTrigger value="terapia">Terapia</TabsTrigger>
          <TabsTrigger value="sector">Sector</TabsTrigger>
          <TabsTrigger value="entrega_sobres">Sobres</TabsTrigger>
          <TabsTrigger value="kit_rash">Kit RASH</TabsTrigger>
          <TabsTrigger value="torre_control">Torre Control</TabsTrigger>
          <TabsTrigger value="descripcion_actividad">Actividad</TabsTrigger>
          <TabsTrigger value="temas_impartidos">Temas</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnostico">
          <CatalogoManager tipo="diagnostico" titulo="Diagnóstico" />
        </TabsContent>

        <TabsContent value="terapia">
          <CatalogoManager tipo="terapia" titulo="Terapia" />
        </TabsContent>

        <TabsContent value="sector">
          <CatalogoManager tipo="sector" titulo="Sector" />
        </TabsContent>

        <TabsContent value="entrega_sobres">
          <CatalogoManager tipo="entrega_sobres" titulo="Entrega de Sobres" />
        </TabsContent>

        <TabsContent value="kit_rash">
          <CatalogoManager tipo="kit_rash" titulo="Kit RASH" />
        </TabsContent>

        <TabsContent value="torre_control">
          <CatalogoManager tipo="torre_control" titulo="Torre de Control" />
        </TabsContent>

        <TabsContent value="descripcion_actividad">
          <CatalogoManager tipo="descripcion_actividad" titulo="Descripción de Actividad" />
        </TabsContent>

        <TabsContent value="temas_impartidos">
          <CatalogoManager tipo="temas_impartidos" titulo="Temas Impartidos" />
        </TabsContent>
      </Tabs>
    </div>
  );
}