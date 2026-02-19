'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

type MotionTag = 'div' | 'section' | 'article'

interface AnimateInProps {
  children: ReactNode
  className?: string
  delay?: number
  as?: MotionTag
}

export function AnimateIn({
  children,
  className,
  delay = 0,
  as = 'div',
}: AnimateInProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    // Render as plain element — no motion overhead, no opacity:0, instant display
    const PlainTag = as
    return <PlainTag className={className}>{children}</PlainTag>
  }

  const Component = motion[as]

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {children}
    </Component>
  )
}
