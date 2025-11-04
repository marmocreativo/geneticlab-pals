// src/components/admin/TiposContactoChart.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ContactoPorTipo } from '@/services/estadisticasService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TiposContactoChartProps {
  data: ContactoPorTipo[];
  loading?: boolean;
}

const COLORS = {
  presencial: '#9333ea',
  telefonico: '#6366f1',
};

const LABELS = {
  presencial: 'Presencial',
  telefonico: 'Telefónico',
};

export const TiposContactoChart = ({ data, loading }: TiposContactoChartProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Contacto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0 || data.every(d => d.total === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Contacto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500">
            No hay datos disponibles
          </div>
        </CardContent>
      </Card>
    );
  }

  // Formatear datos para el chart
  const chartData = data
    .filter(d => d.total > 0)
    .map(item => ({
      name: LABELS[item.tipo],
      value: item.total,
      tipo: item.tipo,
    }));

  const renderLabel = (entry: any) => {
    const percent = ((entry.value / data.reduce((sum, d) => sum + d.total, 0)) * 100).toFixed(1);
    return `${entry.name}: ${entry.value} (${percent}%)`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipos de Contacto</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.tipo}`} fill={COLORS[entry.tipo as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};