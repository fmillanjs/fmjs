'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

interface ParallaxDividerProps {
  className?: string
}

export function ParallaxDivider({ className }: ParallaxDividerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion || !lineRef.current || !containerRef.current) return

    gsap.fromTo(
      lineRef.current,
      { scaleX: 0.92 },
      {
        scaleX: 1.04,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          end: 'bottom 20%',
          scrub: 1,
          invalidateOnRefresh: true,
        },
      }
    )
  }, { scope: containerRef })
  // useGSAP auto-reverts context (kills tween + ScrollTrigger) on unmount

  return (
    <div ref={containerRef} className={`py-8 overflow-hidden ${className ?? ''}`}>
      <div
        ref={lineRef}
        className="h-px bg-primary/30 w-full origin-center"
        // transform-origin: center — scaleX expands equally left+right, no horizontal shift
        // scaleX does not affect layout — CLS = 0
      />
    </div>
  )
}
