import { useState, useCallback, useEffect } from 'react';

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  lat: number;
  lng: number;
}

interface AutocompletePrediction {
  place_id: string;
  description: string;
}

export function useGooglePlaces() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [autocompleteService, setAutocompleteService] = useState<any>(null);
  const [placesService, setPlacesService] = useState<any>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      // @ts-ignore
      const google = window.google;
      setAutocompleteService(new google.maps.places.AutocompleteService());
      const div = document.createElement('div');
      setPlacesService(new google.maps.places.PlacesService(div));
      setIsLoaded(true);
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const searchPlaces = useCallback(
    (input: string): Promise<AutocompletePrediction[]> => {
      if (!autocompleteService || !input) {
        return Promise.resolve([]);
      }

      return new Promise((resolve, reject) => {
        autocompleteService.getPlacePredictions(
          {
            input,
            componentRestrictions: { country: 'mx' },
          },
          (predictions: any, status: any) => {
            if (status === 'OK' && predictions) {
              resolve(predictions);
            } else {
              resolve([]);
            }
          }
        );
      });
    },
    [autocompleteService]
  );

  const getPlaceDetails = useCallback(
    (placeId: string): Promise<PlaceResult> => {
      if (!placesService) {
        return Promise.reject('Places service not loaded');
      }

      return new Promise((resolve, reject) => {
        placesService.getDetails(
          {
            placeId,
            fields: ['place_id', 'name', 'formatted_address', 'geometry'],
          },
          (place: any, status: any) => {
            if (status === 'OK' && place) {
              resolve({
                place_id: place.place_id,
                name: place.name,
                formatted_address: place.formatted_address,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              });
            } else {
              reject(status);
            }
          }
        );
      });
    },
    [placesService]
  );

  return {
    isLoaded,
    searchPlaces,
    getPlaceDetails,
  };
}