import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

interface MapViewProps {
  lat: number;
  lng: number;
  nombre: string;
}

export function MapView({ lat, lng, nombre }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = () => {
      // @ts-ignore
      const google = window.google;
      
      if (!google) {
        console.error('Google Maps not loaded');
        return;
      }

      const position = { lat, lng };

      const map = new google.maps.Map(mapRef.current!, {
        center: position,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      new google.maps.Marker({
        position,
        map,
        title: nombre,
      });

      mapInstanceRef.current = map;
    };

    // @ts-ignore
    if (window.google) {
      initMap();
    } else {
      const checkGoogle = setInterval(() => {
        // @ts-ignore
        if (window.google) {
          initMap();
          clearInterval(checkGoogle);
        }
      }, 100);

      return () => clearInterval(checkGoogle);
    }
  }, [lat, lng, nombre]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>Ubicación</span>
      </div>
      <div ref={mapRef} className="w-full h-64 rounded-lg border" />
    </div>
  );
}