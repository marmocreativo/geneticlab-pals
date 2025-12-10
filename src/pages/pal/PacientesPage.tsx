// pages/pal/PacientesPage.tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function PacientesPage() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Censo de Pacientes</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Paciente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Pacientes</CardTitle>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pacientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Esta página está en desarrollo
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}