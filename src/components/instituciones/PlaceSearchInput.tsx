import { useEffect, useRef, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';
import { MapPin, Loader2 } from 'lucide-react';

interface PlaceSearchInputProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
}

interface Suggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export function PlaceSearchInput({ onPlaceSelect }: PlaceSearchInputProps) {
  const { isLoaded } = useGooglePlaces();
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoaded) return;
    autocompleteService.current = new google.maps.places.AutocompleteService();
    // PlacesService necesita un elemento DOM o mapa
    const div = document.createElement('div');
    placesService.current = new google.maps.places.PlacesService(div);
  }, [isLoaded]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const buscarSugerencias = useCallback((texto: string) => {
    if (!autocompleteService.current || texto.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setSearching(true);
    autocompleteService.current.getPlacePredictions(
      {
        input: texto,
        componentRestrictions: { country: 'mx' },
      },
      (predictions, status) => {
        setSearching(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions as Suggestion[]);
          setOpen(true);
        } else {
          setSuggestions([]);
          setOpen(false);
        }
      }
    );
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => buscarSugerencias(value), 300);
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    if (!placesService.current) return;

    setInputValue(suggestion.structured_formatting.main_text);
    setOpen(false);
    setSuggestions([]);

    placesService.current.getDetails(
      {
        placeId: suggestion.place_id,
        fields: ['name', 'formatted_address', 'geometry', 'place_id', 'photos'],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          onPlaceSelect(place);
        }
      }
    );
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
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar hospital o clínica..."
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-md max-h-60 overflow-auto">
          {suggestions.map((s) => (
            <li
              key={s.place_id}
              className="flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-muted active:bg-muted"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectSuggestion(s)}
            >
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{s.structured_formatting.main_text}</p>
                <p className="text-xs text-muted-foreground truncate">{s.structured_formatting.secondary_text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}