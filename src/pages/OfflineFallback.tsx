import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OfflineFallback() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-gray-600" />
          </div>
          <CardTitle>Sin conexión a Internet</CardTitle>
          <CardDescription>
            No se puede conectar al servidor. Verifica tu conexión e intenta nuevamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleReload} 
            className="w-full"
          >
            Reintentar
          </Button>
          <p className="text-sm text-center text-gray-500">
            Algunas funciones pueden no estar disponibles sin conexión.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}