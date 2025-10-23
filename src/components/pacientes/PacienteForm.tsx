import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PacienteInput, Paciente } from '@/services/pacientesService';

interface PacienteFormProps {
  paciente?: Paciente;
  onSubmit: (data: PacienteInput) => Promise<void>;
  onCancel: () => void;
}

export const PacienteForm = ({ paciente, onSubmit, onCancel }: PacienteFormProps) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PacienteInput>({
    defaultValues: paciente ? {
      nombre_completo: paciente.nombre_completo,
      telefono: paciente.telefono || '',
      numero_pm: paciente.numero_pm || ''
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
          placeholder="Ej: María González López"
        />
        {errors.nombre_completo && (
          <p className="text-sm text-red-500">{errors.nombre_completo.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="numero_pm">Número PM</Label>
        <Input
          id="numero_pm"
          {...register('numero_pm')}
          placeholder="Ej: PM-98765"
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
          {isSubmitting ? 'Guardando...' : paciente ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
};