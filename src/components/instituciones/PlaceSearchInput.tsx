import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface PlaceSearchInputProps {
  onPlaceSelect: (place: {
    name: string;
    address: string;
    placeId: string;
    lat: number;
    lng: number;
  }) => void;
}

export function PlaceSearchInput({ onPlaceSelect }: PlaceSearchInputProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const { isLoaded, searchPlaces, getPlaceDetails } = useGooglePlaces();

  useEffect(() => {
    if (!searchValue || !isLoaded) {
      setPredictions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await searchPlaces(searchValue);
        setPredictions(results);
      } catch (error) {
        console.error('Error searching places:', error);
        setPredictions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, searchPlaces, isLoaded]);

  const handleSelectPlace = async (placeId: string) => {
    try {
      const details = await getPlaceDetails(placeId);
      onPlaceSelect({
        name: details.name,
        address: details.formatted_address,
        placeId: details.place_id,
        lat: details.lat,
        lng: details.lng,
      });
      setOpen(false);
      setSearchValue('');
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Search className="h-4 w-4" />
        <span>Cargando Google Maps...</span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-start"
        >
          <Search className="mr-2 h-4 w-4" />
          Buscar institución en Google Maps
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar institución..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No se encontraron resultados</CommandEmpty>
            <CommandGroup>
              {predictions.map((prediction) => (
                <CommandItem
                  key={prediction.place_id}
                  value={prediction.place_id}
                  onSelect={() => handleSelectPlace(prediction.place_id)}
                >
                  {prediction.description}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}