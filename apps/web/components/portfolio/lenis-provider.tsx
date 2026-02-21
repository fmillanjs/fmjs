'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import ReactLenis, { useLenis } from 'lenis/react'

// Inner component: must be inside the ReactLenis tree so useLenis() has a ReactLenis ancestor
function LenisScrollReset() {
  const pathname = usePathname()
  const lenis = useLenis()

  useEffect(() => {
    if (lenis) {
      // SCROLL-02: reset to top on every route change
      // force: true overrides any in-progress animation (prevents race condition mid-scroll)
      lenis.scrollTo(0, { immediate: true, force: true })
    }
  }, [pathname, lenis])

  return null
}

export function LenisProvider({ children }: { children: React.ReactNode }) {
  // SSR-safe reduced-motion detection: useState(false) ensures server + client both
  // initially render the Lenis tree (avoids hydration mismatch).
  // The useEffect then unmounts ReactLenis on the client if reduced-motion is preferred.
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Run once on mount — no ongoing listener needed; users rarely change this mid-session
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
  }, [])

  if (prefersReducedMotion) {
    // SCROLL-03: no ReactLenis mounted, no RAF loop overhead for motion-sensitive users
    return <>{children}</>
  }

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,       // starting value; 0.08–0.12 may be adjusted after real-device feel testing
        autoRaf: true,   // Phase 29: built-in RAF loop. Phase 30 will switch to autoRaf: false + gsap.ticker
        smoothWheel: true,
        // NOTE: do NOT set duration alongside lerp — they are alternatives, not companions
      }}
    >
      {/* LenisScrollReset must be inside the ReactLenis tree to access useLenis() context */}
      <LenisScrollReset />
      {children}
    </ReactLenis>
  )
}
