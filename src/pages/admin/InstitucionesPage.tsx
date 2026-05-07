import { useState } from 'react'
import { Building2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { InstitucionesTable } from '@/components/instituciones/InstitucionesTable'
import { InstitucionQuickForm } from '@/components/instituciones/InstitucionQuickForm'
import { InstitucionForm } from '@/components/instituciones/InstitucionForm'
import { useInstituciones } from '@/hooks/useInstituciones'
import { institucionesService } from '@/services/institucionesService'

export default function InstitucionesPage() {
  const { instituciones, loading, fetchInstituciones } = useInstituciones()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingInstitucion, setEditingInstitucion] = useState<any>(null)
  const [useQuickForm, setUseQuickForm] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  const handleCreate = async (data: any) => {
    try {
      await institucionesService.create(data)
      toast.success('Institución creada exitosamente')
      setShowCreateDialog(false)
      fetchInstituciones()
    } catch (error) {
      console.error('Error creating institucion:', error)
      toast.error('Error al crear institución')
    }
  }

  const handleEdit = (institucion: any) => {
    setEditingInstitucion(institucion)
    setShowEditDialog(true)
    setUseQuickForm(false) // Usar formulario completo para edición
  }

  const handleUpdate = async (data: any) => {
    try {
      if (!editingInstitucion) return
      
      await institucionesService.update(editingInstitucion.id, data)
      toast.success('Institución actualizada exitosamente')
      setShowEditDialog(false)
      setEditingInstitucion(null)
      fetchInstituciones()
    } catch (error) {
      console.error('Error updating institucion:', error)
      toast.error('Error al actualizar institución')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta institución?')) return
    
    try {
      await institucionesService.delete(id)
      toast.success('Institución eliminada exitosamente')
      fetchInstituciones()
    } catch (error) {
      console.error('Error deleting institucion:', error)
      toast.error('Error al eliminar institución')
    }
  }

  const handleCreateSuccess = (institucion: any) => {
    toast.success('Institución creada exitosamente')
    setShowCreateDialog(false)
    fetchInstituciones()
    // log para evitar error ts
    console.log(institucion);
  }

  const institucionesFiltradas = instituciones.filter(i =>
    i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    i.direccion?.toLowerCase().includes(busqueda.toLowerCase()) ||
    i.sector_nombre?.toLowerCase().includes(busqueda.toLowerCase())
  )



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instituciones</h1>
          <p className="text-muted-foreground">
            Gestiona hospitales, clínicas y centros de salud
          </p>
        </div>
        <Button onClick={() => {
          setUseQuickForm(true)
          setShowCreateDialog(true)
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Institución
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Instituciones Registradas
            {!loading && (
              <span className="text-sm font-normal text-muted-foreground">
                ({instituciones.length} total)
              </span>
            )}
          </CardTitle>
          <div className="mt-3">
            <Input
              placeholder="Buscar por nombre, dirección o sector..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <InstitucionesTable
            instituciones={institucionesFiltradas}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Dialog para crear */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Institución</DialogTitle>
          </DialogHeader>
          {useQuickForm ? (
            <InstitucionQuickForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateDialog(false)}
            />
          ) : (
            <InstitucionForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreateDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para editar */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Institución</DialogTitle>
          </DialogHeader>
          <InstitucionForm
            initialData={editingInstitucion}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditDialog(false)
              setEditingInstitucion(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}