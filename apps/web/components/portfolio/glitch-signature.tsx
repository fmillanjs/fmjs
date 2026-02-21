'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'

export default function GlitchSignature() {
  const ref = useRef<HTMLSpanElement>(null)
  const [hasGlitched, setHasGlitched] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    // Reduced-motion: skip observer entirely — no animation class ever added
    // prefersReducedMotion is null on SSR (falsy) — safe per project convention
    // (confirmed from magnetic-button.tsx: null treated as falsy, no hydration mismatch)
    if (prefersReducedMotion) return

    // StrictMode guard: second mount finds hasGlitched=true and skips creating a new observer
    // This prevents two glitch fires in development strict mode
    if (hasGlitched) return

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Add glitch CSS class — triggers @keyframes footer-glitch (defined in globals.css)
          // animation-iteration-count: 1 fires exactly once then holds final state (forwards)
          el.classList.add('footer-glitch-once')
          setHasGlitched(true)
          // Disconnect immediately — never fires again, no memory leak
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)

    // Cleanup: disconnect on unmount (handles StrictMode's mount → unmount → remount cycle)
    return () => observer.disconnect()
  }, [prefersReducedMotion, hasGlitched])

  return (
    <span
      ref={ref}
      className="text-lg font-bold font-mono text-foreground"
      aria-label="Fernando Millan"
    >
      Fernando Millan
    </span>
  )
}
