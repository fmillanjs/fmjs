import { useEffect, useRef, useState } from 'react'

// Visible ASCII range: 33–126 (excludes space/DEL)
const CHARS = Array.from({ length: 94 }, (_, i) => String.fromCharCode(i + 33)).join('')

/**
 * Scrambles `target` text from random ASCII noise to the correct string.
 * Fires exactly once when `enabled` is true. Never loops.
 * When `enabled` is false (reduced motion), returns `target` immediately.
 */
export function useTextScramble(target: string, enabled = true) {
  const [display, setDisplay] = useState(enabled ? '' : target)
  const frameRef = useRef<number>(0)
  const iterRef = useRef(0)

  useEffect(() => {
    if (!enabled) {
      setDisplay(target)
      return
    }

    iterRef.current = 0
    const totalFrames = target.length * 6  // ~6 frames per character at 60fps ≈ 100ms per char

    function step() {
      const progress = iterRef.current / totalFrames
      const resolved = Math.floor(progress * target.length)

      const output = target
        .split('')
        .map((char, i) => {
          if (i < resolved) return char
          // Keep spaces as spaces — do not replace with noise
          if (char === ' ') return ' '
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        })
        .join('')

      setDisplay(output)
      iterRef.current++

      if (iterRef.current <= totalFrames) {
        frameRef.current = requestAnimationFrame(step)
      } else {
        setDisplay(target)  // guarantee exact final text, fires exactly once
      }
    }

    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, enabled])

  return display
}
