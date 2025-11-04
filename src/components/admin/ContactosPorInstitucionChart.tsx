// src/components/admin/ContactosPorInstitucionChart.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ContactoPorInstitucion } from '@/services/estadisticasService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ContactosPorInstitucionChartProps {
  data: ContactoPorInstitucion[];
  loading?: boolean;
}

export const ContactosPorInstitucionChart = ({ data, loading }: ContactosPorInstitucionChartProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Instituciones</CardTitle>
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
          <CardTitle>Top 10 Instituciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500">
            No hay datos disponibles
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 Instituciones</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              type="category" 
              dataKey="institucion_nombre" 
              width={150}
              fontSize={12}
            />
            <Tooltip />
            <Bar dataKey="total" fill="#3b82f6" name="Contactos" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};