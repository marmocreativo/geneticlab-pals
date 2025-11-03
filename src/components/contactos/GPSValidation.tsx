import { useEffect, useState } from 'react';
import { MapPin, Navigation, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGeolocation } from '@/hooks/useGeolocation';
import {
  validarUbicacion,
  formatearDistancia,
  type Coordenadas,
  type ResultadoGPS,
} from '@/lib/geolocation';

interface GPSValidationProps {
  institucionCoordenadas: Coordenadas;
  institucionNombre: string;
  distanciaMaxima: number;
  onValidacionCompletada: (resultado: ResultadoGPS) => void;
}

export const GPSValidation = ({
  institucionCoordenadas,
  institucionNombre,
  distanciaMaxima,
  onValidacionCompletada,
}: GPSValidationProps) => {
  const { coordenadas, cargando, error, obtenerUbicacion, soportado } = useGeolocation();
  const [validacion, setValidacion] = useState<ResultadoGPS | null>(null);

  // Obtener ubicación automáticamente al montar
  useEffect(() => {
    if (soportado) {
      obtenerUbicacion();
    }
  }, [soportado, obtenerUbicacion]);

  // Validar cuando se obtengan las coordenadas
  useEffect(() => {
    if (coordenadas) {
      const resultado = validarUbicacion(
        coordenadas,
        institucionCoordenadas,
        distanciaMaxima
      );
      setValidacion(resultado);
      onValidacionCompletada(resultado);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordenadas, distanciaMaxima]); 

  if (!soportado) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Tu dispositivo no soporta geolocalización. No se puede validar la ubicación.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex flex-col gap-2">
            <span>{error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={obtenerUbicacion}
              className="w-fit"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Validación de Ubicación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado de carga */}
        {cargando && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Obteniendo ubicación...</span>
          </div>
        )}

        {/* Información de la institución */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Institución</p>
              <p className="text-sm text-muted-foreground">{institucionNombre}</p>
            </div>
          </div>
        </div>

        {/* Resultado de validación */}
        {validacion && (
          <>
            <div className="flex items-start gap-2">
              <Navigation className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Tu ubicación</p>
                <p className="text-sm text-muted-foreground">
                  {validacion.coordenadas.latitud.toFixed(6)}, {validacion.coordenadas.longitud.toFixed(6)}
                </p>
              </div>
            </div>

            {/* Distancia */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Distancia</span>
                <span className="text-lg font-semibold">
                  {formatearDistancia(validacion.distanciaMetros)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>Rango permitido</span>
                <span>{formatearDistancia(distanciaMaxima)}</span>
              </div>
            </div>

            {/* Alert de resultado */}
            {validacion.dentroRango ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  Ubicación validada correctamente. Estás dentro del rango permitido.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Estás fuera del rango permitido ({formatearDistancia(distanciaMaxima)}). 
                  La distancia actual es de {formatearDistancia(validacion.distanciaMetros)}.
                </AlertDescription>
              </Alert>
            )}

            {/* Botón para refrescar ubicación */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={obtenerUbicacion}
              disabled={cargando}
              className="w-full"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Actualizar Ubicación
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};