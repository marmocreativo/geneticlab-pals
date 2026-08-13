import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { HelpCircle, ChevronDown, ChevronUp, Maximize2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { videosAyuda } from '@/config/videosAyuda'

interface BtnAyudaProps {
  variant?: 'bottom-nav' | 'sidebar'
}

export function BtnAyuda({ variant = 'bottom-nav' }: BtnAyudaProps) {
  const location = useLocation()
  const videos = videosAyuda[location.pathname] ?? []
  const [expandido, setExpandido] = useState<number | null>(0)
  const videoRefs = useRef<Record<number, HTMLVideoElement>>({})

  useEffect(() => {
    const handleFullscreenChange = () => {
      const el = document.fullscreenElement
      if (el && el instanceof HTMLVideoElement) {
        el.controls = true
      }
      if (!el) {
        Object.values(videoRefs.current).forEach(v => {
          v.controls = false
          v.pause()
        })
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  if (videos.length === 0) return null

  return (
    <Sheet>
      <SheetTrigger asChild>
        {variant === 'sidebar' ? (
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
            <HelpCircle className="h-3 w-3" />
            Videos de Ayuda
          </Button>
        ) : (
          <button className="flex flex-col items-center px-3 py-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground">
            <HelpCircle className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Videos de Ayuda</span>
          </button>
        )}
      </SheetTrigger>

      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl px-4">
        <SheetHeader className="mb-4">
          <SheetTitle>Videos de ayuda</SheetTitle>
        </SheetHeader>

        <div className="space-y-3 pb-6">
          {videos.map((video, index) => (
            <div key={video.archivo} className="border rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left hover:bg-muted transition-colors"
                onClick={() => setExpandido(expandido === index ? null : index)}
              >
                <span>{video.titulo}</span>
                {expandido === index
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                }
              </button>

              {expandido === index && (
                <div className="px-3 pb-3">
                  <div className="relative">
                    <video
                      ref={el => { if (el) videoRefs.current[index] = el }}
                      src={`/videos/${video.archivo}`}
                      className="w-full rounded-md max-h-48 object-contain bg-black cursor-pointer"
                      onClick={(e) => e.currentTarget.requestFullscreen?.()}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Maximize2 className="h-8 w-8 text-white opacity-60" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}