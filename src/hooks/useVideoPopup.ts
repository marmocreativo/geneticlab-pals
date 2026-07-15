import { useState, useEffect } from 'react'
import { videoPopup } from '@/config/videosAyuda'

const STORAGE_PREFIX = 'video_popup_visto_'

export function useVideoPopup() {
  const [mostrar, setMostrar] = useState(false)

  useEffect(() => {
    if (!videoPopup) return

    const key = `${STORAGE_PREFIX}${videoPopup.archivo}`
    const yaVisto = localStorage.getItem(key)

    if (!yaVisto) {
      setMostrar(true)
    }
  }, [])

  const marcarVisto = () => {
    const key = `${STORAGE_PREFIX}${videoPopup.archivo}`
    localStorage.setItem(key, 'true')
    setMostrar(false)
  }

  return {
    video: videoPopup,
    mostrar,
    marcarVisto
  }
}