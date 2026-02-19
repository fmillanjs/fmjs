'use client'

import { useReducedMotion } from 'motion/react'
import { useTextScramble } from '@/hooks/use-text-scramble'

interface ScrambleHeroProps {
  text: string
  className?: string
}

export function ScrambleHero({ text, className }: ScrambleHeroProps) {
  const prefersReducedMotion = useReducedMotion()
  const display = useTextScramble(text, !prefersReducedMotion)

  return (
    // aria-label provides the correct name to screen readers even during scramble
    <span className={className} aria-label={text}>
      {display || '\u00A0'}
    </span>
  )
}
