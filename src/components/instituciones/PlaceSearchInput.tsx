import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';
import { MapPin } from 'lucide-react';

interface PlaceSearchInputProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
}

export function PlaceSearchInput({ onPlaceSelect }: PlaceSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { isLoaded } = useGooglePlaces();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (!isLoaded || !inputRef.current) {
      return;
    }

    try {
      // Limpiar instancia anterior si existe
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }

      // Crear nueva instancia de Autocomplete
      autocompleteRef.current = new google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['hospital'],
          componentRestrictions: { country: 'mx' },
          fields: ['name', 'formatted_address', 'geometry', 'place_id'],
        }
      );

      // Listener para cuando se selecciona un lugar
      const listener = autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        
        if (place && place.geometry) {
          onPlaceSelect(place);
          setInputValue(place.name || '');
        }
      });

      // Cleanup
      return () => {
        if (listener) {
          google.maps.event.removeListener(listener);
        }
      };
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
    }
  }, [isLoaded, onPlaceSelect]);

  // Manejar Enter para seleccionar automáticamente el primer resultado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Google Places maneja automáticamente Enter, solo prevenimos el submit del form
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 animate-pulse" />
        Cargando Google Maps...
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Buscar hospital o clínica..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      <p className="text-xs text-muted-foreground mt-1">
        💡 Escribe y presiona <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> o usa las flechas <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↓</kbd> <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↑</kbd> y <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd>
      </p>
    </div>
  );
}