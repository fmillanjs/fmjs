'use client'

import { useRef, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react'

// Spring config: stiffness=150 gives perceptible but not violent attraction;
// damping=30 eliminates oscillation while still feeling elastic;
// mass=0.2 makes the response feel lightweight
const SPRING_CONFIG = { stiffness: 150, damping: 30, mass: 0.2 }

// Fraction of the cursor-to-center distance applied as button offset.
// 0.3 = button moves 30% toward cursor — perceptible but not overdone.
const MAGNETIC_STRENGTH = 0.3

interface MagneticButtonProps {
  children: React.ReactNode
  className?: string
}

export function MagneticButton({ children, className }: MagneticButtonProps) {
  // All hooks must be called before any conditional return — React rules of hooks
  const ref = useRef<HTMLDivElement>(null)

  // Cached getBoundingClientRect() — updated on mouseenter only, not per-pixel in mousemove.
  // This prevents forced reflows on every cursor movement (avoids TBT spike).
  const rectRef = useRef<DOMRect | null>(null)

  // Touch device guard — populated in useEffect (window.matchMedia is client-only)
  const canHoverRef = useRef<boolean>(false)

  // Raw target motion values — updated directly by mousemove handler
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Smoothed spring values — follow x/y with spring physics
  const springX = useSpring(x, SPRING_CONFIG)
  const springY = useSpring(y, SPRING_CONFIG)

  // useReducedMotion returns: null (SSR — safe, falsy), true (reduced-motion), false (normal)
  const prefersReducedMotion = useReducedMotion()

  // Detect hover capability on mount — window.matchMedia is client-only, must be in useEffect
  useEffect(() => {
    canHoverRef.current = window.matchMedia('(any-hover: hover)').matches
  }, [])

  // After all hooks: conditional early return for reduced-motion users.
  // null (SSR) is falsy → falls through to motion render (hydration-safe).
  // true (reduced-motion active) → plain div, no spring physics allocated.
  // false (normal user) → motion render.
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  // Cache rect on mouseenter — prevents per-pixel getBoundingClientRect() in mousemove
  const handleMouseEnter = () => {
    rectRef.current = ref.current?.getBoundingClientRect() ?? null
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Guard: skip on touch-only devices (canHoverRef set false in useEffect)
    if (!canHoverRef.current || !rectRef.current) return
    const centerX = rectRef.current.left + rectRef.current.width / 2
    const centerY = rectRef.current.top + rectRef.current.height / 2
    x.set((e.clientX - centerX) * MAGNETIC_STRENGTH)
    y.set((e.clientY - centerY) * MAGNETIC_STRENGTH)
  }

  // Spring physics handles snap-back with correct velocity and deceleration
  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  // motion.div wrapper moves — the <button> inside stays at its layout position.
  // This preserves the browser focus ring alignment for keyboard navigation.
  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: springX, y: springY }}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  )
}
