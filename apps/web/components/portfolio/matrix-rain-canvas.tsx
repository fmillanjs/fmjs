'use client'

import { useEffect, useRef } from 'react'

const CHARS =
  'ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789'
const FONT_SIZE = 14
const FPS_TARGET = 30
const FRAME_INTERVAL = 1000 / FPS_TARGET

export default function MatrixRainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const columns = Math.floor(canvas.width / FONT_SIZE)
    const drops: number[] = Array(columns).fill(1)

    const w = canvas.width
    const h = canvas.height

    // Capture ctx as a definite non-null reference for use inside draw
    const context: CanvasRenderingContext2D = ctx

    const isDark = document.documentElement.classList.contains('dark')
    const trailFill = isDark ? 'rgba(10, 10, 10, 0.05)' : 'rgba(255, 255, 255, 0.05)'

    let lastTime = 0
    let rafId: number

    function draw(timestamp: number) {
      if (timestamp - lastTime < FRAME_INTERVAL) {
        rafId = requestAnimationFrame(draw)
        return
      }

      lastTime = timestamp

      context.fillStyle = trailFill
      context.fillRect(0, 0, w, h)

      context.fillStyle = '#00FF41'
      context.font = `${FONT_SIZE}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const charIndex = Math.floor(Math.random() * CHARS.length)
        const char = CHARS.charAt(charIndex)
        context.fillText(char, i * FONT_SIZE, drops[i]! * FONT_SIZE)

        if ((drops[i]! * FONT_SIZE > h) && Math.random() > 0.975) {
          drops[i] = 0
        }

        drops[i]!++
      }

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full z-0"
      style={{ opacity: 0.05 }}
    />
  )
}
