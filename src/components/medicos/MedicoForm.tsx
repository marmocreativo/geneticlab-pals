import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MedicoInput, Medico } from '@/services/medicosService';

interface MedicoFormProps {
  medico?: Medico;
  onSubmit: (data: MedicoInput) => Promise<void>;
  onCancel: () => void;
}

export const MedicoForm = ({ medico, onSubmit, onCancel }: MedicoFormProps) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<MedicoInput>({
    defaultValues: medico ? {
      nombre_completo: medico.nombre_completo,
      telefono: medico.telefono || '',
      numero_pm: medico.numero_pm || '',
      especialidad: medico.especialidad || ''
    } : undefined
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombre_completo">Nombre Completo *</Label>
        <Input
          id="nombre_completo"
          {...register('nombre_completo', { 
            required: 'El nombre es requerido',
            minLength: { value: 3, message: 'Mínimo 3 caracteres' }
          })}
          placeholder="Ej: Dr. Juan Pérez García"
        />
        {errors.nombre_completo && (
          <p className="text-sm text-red-500">{errors.nombre_completo.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="especialidad">Especialidad</Label>
        <Input
          id="especialidad"
          {...register('especialidad')}
          placeholder="Ej: Oncología"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="numero_pm">Número PM</Label>
        <Input
          id="numero_pm"
          {...register('numero_pm')}
          placeholder="Ej: PM-12345"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input
          id="telefono"
          {...register('telefono')}
          placeholder="Ej: 5512345678"
          type="tel"
        />
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : medico ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
};