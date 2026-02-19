'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'

export function DotGridSpotlight() {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    // Belt-and-suspenders: CSS media query hides element on touch devices,
    // but also skip the event listener for those devices
    if (prefersReducedMotion) return
    const canHover = window.matchMedia('(any-hover: hover)').matches
    if (!canHover) return

    const el = containerRef.current
    if (!el) return

    function onMouseMove(e: MouseEvent) {
      el!.style.setProperty('--cursor-x', `${e.clientX}px`)
      el!.style.setProperty('--cursor-y', `${e.clientY}px`)
    }

    // passive: true — never blocks scroll performance
    document.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => document.removeEventListener('mousemove', onMouseMove)
  }, [prefersReducedMotion])

  // Under reduced motion — render nothing at all
  if (prefersReducedMotion) return null

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="dot-grid-spotlight"
      style={
        {
          '--cursor-x': '-9999px',
          '--cursor-y': '-9999px',
        } as React.CSSProperties
      }
    />
  )
}
