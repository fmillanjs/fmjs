'use client'

import { useState, useCallback } from 'react'
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'motion/react'

// Matrix-themed noise characters — ASCII operators + katakana subset
// No purple — per design constraint
const NOISE_CHARS = 'ｦｧｨｩｯｱｲｳｴｵ0123456789ABCDEF<>[]{}|/\\^~!@#$%&*'
const NOISE_LENGTH = 1500

function randomNoise(): string {
  return Array.from(
    { length: NOISE_LENGTH },
    () => NOISE_CHARS[Math.floor(Math.random() * NOISE_CHARS.length)]
  ).join('')
}

interface EvervaultCardProps {
  children: React.ReactNode
  className?: string
}

export function EvervaultCard({ children, className }: EvervaultCardProps) {
  const prefersReducedMotion = useReducedMotion()
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const [noise, setNoise] = useState('')
  const [isHovered, setIsHovered] = useState(false)

  // useMotionTemplate creates a reactive string outside React's render cycle
  const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
    setNoise(randomNoise())
  }, [mouseX, mouseY])

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
    setNoise(randomNoise())
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    setNoise('')
  }, [])

  // Reduced motion: render children as-is with no wrapper overhead
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      className={`relative overflow-hidden ${className ?? ''}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Noise overlay — pointer-events-none is MANDATORY to preserve card link navigation */}
      {isHovered && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 font-mono text-[10px] leading-[1] text-[var(--matrix-green)] opacity-60 break-all overflow-hidden"
          style={{ maskImage, WebkitMaskImage: maskImage }}
          aria-hidden="true"
        >
          {noise}
        </motion.div>
      )}
      {children}
    </div>
  )
}
