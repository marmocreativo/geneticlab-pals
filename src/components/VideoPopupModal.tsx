import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useVideoPopup } from '@/hooks/useVideoPopup'

export function VideoPopupModal() {
  const { video, mostrar, marcarVisto } = useVideoPopup()

  if (!video) return null

  return (
    <Dialog open={mostrar} onOpenChange={(open) => !open && marcarVisto()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{video.titulo}</DialogTitle>
        </DialogHeader>
        <video
          src={`/videos/${video.archivo}`}
          controls
          autoPlay
          className="w-full rounded-md"
          onEnded={marcarVisto}
        />
      </DialogContent>
    </Dialog>
  )
}