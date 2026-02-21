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
    // role="img" + aria-label: valid ARIA pattern for spans with dynamic text content
    // Screen readers read the stable aria-label value during the scramble animation
    <span className={className} role="img" aria-label={text}>
      {display || '\u00A0'}
    </span>
  )
}
