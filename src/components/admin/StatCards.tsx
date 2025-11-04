// src/components/admin/StatCards.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type EstadisticasGenerales } from '@/services/estadisticasService';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Phone, 
  MapPin 
} from 'lucide-react';

interface StatCardsProps {
  estadisticas: EstadisticasGenerales | null;
  loading?: boolean;
}

export const StatCards = ({ estadisticas, loading }: StatCardsProps) => {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cargando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!estadisticas) {
    return null;
  }

  const cards = [
    {
      title: 'Total Contactos',
      value: estadisticas.totalContactos,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Confirmados',
      value: estadisticas.totalConfirmados,
      icon: CheckCircle2,
      color: 'text-green-600',
    },
    {
      title: 'Programados',
      value: estadisticas.totalProgramados,
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      title: 'Cancelados',
      value: estadisticas.totalCancelados,
      icon: XCircle,
      color: 'text-red-600',
    },
    {
      title: 'Presenciales',
      value: estadisticas.totalPresenciales,
      icon: MapPin,
      color: 'text-purple-600',
    },
    {
      title: 'Telefónicos',
      value: estadisticas.totalTelefonicos,
      icon: Phone,
      color: 'text-indigo-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};