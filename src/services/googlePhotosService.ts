// services/googlePhotosService.ts
export const googlePhotosService = {
  getPhotoUrl: (photoReference: string, maxWidth: number = 400): string => {
    const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${API_KEY}`;
  }
};