// src/pages/admin/ReportesPage.tsx

import { useState } from 'react';
import { ReportFilters, type FiltrosReporte } from '@/components/admin/ReportFilters';
import { ReportTable } from '@/components/admin/ReportTable';
import { FileBarChart } from 'lucide-react';

export default function ReportesPage() {
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosReporte>({});

  const handleAplicarFiltros = (filtros: FiltrosReporte) => {
    setFiltrosAplicados(filtros);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileBarChart className="h-8 w-8" />
          Reportes
        </h1>
        <p className="text-gray-600">
          Genera reportes personalizados de contactos
        </p>
      </div>

      <ReportFilters onAplicarFiltros={handleAplicarFiltros} />

      <ReportTable filtros={filtrosAplicados} />
    </div>
  );
}