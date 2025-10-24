import { useEffect, useState } from 'react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Variable global para rastrear si el script ya está cargado
let isScriptLoaded = false;
let isScriptLoading = false;
let loadCallbacks: (() => void)[] = [];

export function useGooglePlaces() {
  const [isLoaded, setIsLoaded] = useState(isScriptLoaded);

  useEffect(() => {
    // Si ya está cargado, retornar inmediatamente
    if (isScriptLoaded) {
      setIsLoaded(true);
      return;
    }

    // Si ya se está cargando, agregar callback y esperar
    if (isScriptLoading) {
      loadCallbacks.push(() => setIsLoaded(true));
      return;
    }

    // Verificar si Google Maps ya existe en window
    if (window.google?.maps?.places) {
      isScriptLoaded = true;
      setIsLoaded(true);
      return;
    }

    // Verificar si el script ya existe en el DOM
    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com"]`
    );
    
    if (existingScript) {
      isScriptLoading = true;
      loadCallbacks.push(() => setIsLoaded(true));
      
      existingScript.addEventListener('load', () => {
        isScriptLoaded = true;
        isScriptLoading = false;
        loadCallbacks.forEach(cb => cb());
        loadCallbacks = [];
      });
      return;
    }

    // Cargar el script por primera vez
    isScriptLoading = true;
    loadCallbacks.push(() => setIsLoaded(true));

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isScriptLoaded = true;
      isScriptLoading = false;
      loadCallbacks.forEach(cb => cb());
      loadCallbacks = [];
    };

    script.onerror = () => {
      isScriptLoading = false;
      console.error('Error loading Google Maps script');
      loadCallbacks = [];
    };

    document.head.appendChild(script);

    // Cleanup
    return () => {
      // No remover el script al desmontar para evitar recargas
    };
  }, []);

  return { isLoaded };
}