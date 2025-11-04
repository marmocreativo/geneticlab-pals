// src/components/admin/ContactosPorPalChart.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ContactoPorPal } from '@/services/estadisticasService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ContactosPorPalChartProps {
  data: ContactoPorPal[];
  loading?: boolean;
}

export const ContactosPorPalChart = ({ data, loading }: ContactosPorPalChartProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contactos por PAL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contactos por PAL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500">
            No hay datos disponibles
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ordenar por total descendente
  const sortedData = [...data].sort((a, b) => b.total - a.total);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contactos por PAL</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="pal_nombre" 
              angle={-45}
              textAnchor="end"
              height={100}
              fontSize={12}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="confirmados" fill="#16a34a" name="Confirmados" />
            <Bar dataKey="programados" fill="#eab308" name="Programados" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};