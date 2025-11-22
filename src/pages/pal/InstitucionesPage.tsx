import { Building2, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function InstitucionesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Instituciones</h1>
        <p className="text-muted-foreground">
          Consulta hospitales, clínicas y centros de salud
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Próximamente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta funcionalidad está en desarrollo. Pronto podrás consultar y ubicar todas las instituciones.
          </p>
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Incluirá mapas y ubicaciones
          </div>
        </CardContent>
      </Card>
    </div>
  )
}