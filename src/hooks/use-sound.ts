import { useCallback, useRef } from 'react'

export function useSound(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const play = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(src)
      audioRef.current.volume = 0.3
    }
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {})
  }, [src])

  return { play }
}
