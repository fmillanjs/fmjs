'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import ReactLenis, { useLenis } from 'lenis/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

// Register plugins at module level (idempotent — safe to call multiple times)
gsap.registerPlugin(ScrollTrigger, useGSAP)

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

// Inner component: drives Lenis via GSAP's ticker so ScrollTrigger gets the correct
// scroll position on every frame — eliminates double-RAF jitter.
// CRITICAL: tickerFn is a named variable so the same reference is removed in cleanup.
function LenisGSAPBridge() {
  const lenis = useLenis()

  useEffect(() => {
    if (!lenis) return

    // Wire ScrollTrigger updates to Lenis scroll events
    lenis.on('scroll', ScrollTrigger.update)

    // GSAP ticker drives Lenis (time from ticker is in seconds; lenis.raf expects ms)
    const tickerFn = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(tickerFn)

    // Disable lag smoothing so GSAP doesn't try to "catch up" on slow frames
    // (avoids a jump when the tab regains focus after being backgrounded)
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.off('scroll', ScrollTrigger.update)
      gsap.ticker.remove(tickerFn)
    }
  }, [lenis])

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
        lerp: 0.1,        // starting value; 0.08–0.12 may be adjusted after real-device feel testing
        autoRaf: false,   // Phase 30: GSAP ticker drives Lenis via LenisGSAPBridge (no double-RAF)
        smoothWheel: true,
        // NOTE: do NOT set duration alongside lerp — they are alternatives, not companions
      }}
    >
      {/* LenisScrollReset must be inside the ReactLenis tree to access useLenis() context */}
      <LenisScrollReset />
      {/* LenisGSAPBridge must be inside the ReactLenis tree to access useLenis() context */}
      <LenisGSAPBridge />
      {children}
    </ReactLenis>
  )
}
