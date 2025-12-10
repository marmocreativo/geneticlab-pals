// components/common/CameraCapture.tsx
import React, { useState, useEffect, useRef } from 'react'
import { Camera, ImageIcon, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface CameraCaptureProps {
  onPhotoCapture: (file: File) => void
  onCancel: () => void
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onPhotoCapture, onCancel }) => {
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Detectar si estamos en móvil
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  // Limpiar stream cuando el componente se desmonta
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Configurar video cuando hay stream
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err)
      })
    }
  }, [stream])

  const startCamera = async () => {
    try {
      setLoading(true)
      setError(null)
      setShowCamera(true)
      
      const constraints = {
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      toast.success('Cámara activada correctamente')
    } catch (error) {
      console.error('Error accessing camera:', error)
      
      let errorMessage = 'No se pudo acceder a la cámara'
      
      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = 'Permisos de cámara denegados'
            break
          case 'NotFoundError':
            errorMessage = 'No se encontró una cámara'
            break
          case 'NotReadableError':
            errorMessage = 'Cámara en uso por otra aplicación'
            break
          default:
            errorMessage = 'Error de cámara'
        }
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
      setShowCamera(false)
      
      // Fallback al input file
      setTimeout(() => {
        document.getElementById('fallback-camera-input')?.click()
      }, 1000)
    } finally {
      setLoading(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop()
      })
      setStream(null)
    }
    setShowCamera(false)
    setError(null)
    setLoading(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !stream) {
      toast.error('La cámara no está lista')
      return
    }

    try {
      const video = videoRef.current
      const canvas = document.createElement('canvas')
      
      // Usar las dimensiones reales del video
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        toast.error('Error al procesar la imagen')
        return
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `evidencia-${Date.now()}.jpg`, {
            type: 'image/jpeg'
          })
          onPhotoCapture(file)
          stopCamera()
          toast.success('Foto capturada correctamente')
        } else {
          toast.error('Error al generar la imagen')
        }
      }, 'image/jpeg', 0.8)
    } catch (error) {
      console.error('Error capturing photo:', error)
      toast.error('Error al capturar la foto')
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Solo se permiten archivos de imagen')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen debe ser menor a 5MB')
        return
      }
      onPhotoCapture(file)
    }
    e.target.value = ''
  }

  return (
    <>
      {/* Opciones principales */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={isMobile ? () => document.getElementById('mobile-camera-input')?.click() : startCamera}
          disabled={loading}
          className="w-full h-20 flex-col gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera className="h-6 w-6" />
          )}
          <span className="text-xs">
            {loading ? 'Activando...' : 'Tomar Foto'}
          </span>
        </Button>
        
        <Button
          variant="outline"
          onClick={() => document.getElementById('gallery-input')?.click()}
          className="w-full h-20 flex-col gap-2"
        >
          <ImageIcon className="h-6 w-6" />
          <span className="text-xs">Galería</span>
        </Button>
      </div>

      {/* Mostrar error si lo hay */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Inputs ocultos */}
      <input
        type="file"
        id="mobile-camera-input"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        className="hidden"
      />
      
      <input
        type="file"
        id="gallery-input"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />
      
      <input
        type="file"
        id="fallback-camera-input"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Modal de cámara para escritorio */}
      <Dialog open={showCamera} onOpenChange={stopCamera}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tomar Foto</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative bg-black rounded overflow-hidden" style={{ aspectRatio: '4/3' }}>
              {stream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm">Iniciando cámara...</p>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Cámara no disponible</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={stopCamera} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={capturePhoto} 
                disabled={!stream || loading}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Capturar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CameraCapture