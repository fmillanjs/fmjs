'use client'

import Image from 'next/image'
import { AnimateIn } from '@/components/portfolio/animate-in'

export interface WalkthroughStep {
  /** Short label shown bold below the screenshot */
  label: string
  /** One-sentence explanation */
  explanation: string
}

export interface WalkthroughScreenshot {
  /** Screenshot metadata — src, width, height, alt (from Screenshot interface in screenshots-manifest.ts) */
  src: string
  width: number
  height: number
  alt: string
  /** Labels shown below this screenshot */
  steps: WalkthroughStep[]
}

export interface WalkthroughSectionProps {
  /** Section heading (e.g. "App Walkthrough") */
  title?: string
  /** Array of screenshots each with their callout step definitions */
  screenshots: WalkthroughScreenshot[]
}

export function WalkthroughSection({ title, screenshots }: WalkthroughSectionProps) {
  return (
    <section className="py-16 px-4 bg-[#0a0a0a]">
      {title && (
        <h2 className="font-mono text-2xl font-bold mb-10" style={{ color: 'var(--matrix-green)' }}>
          {title}
        </h2>
      )}
      <div className="space-y-0">
        {screenshots.map((shot, idx) => (
          <AnimateIn key={idx}>
            <div className="mb-16">
              <Image
                src={shot.src}
                alt={shot.alt}
                width={shot.width}
                height={shot.height}
                className="w-full h-auto rounded-lg border border-[var(--matrix-green-border)]"
              />
              <div className="mt-4 space-y-2">
                {shot.steps.map((step, stepIdx) => (
                  <div key={stepIdx} className="flex gap-3 items-start">
                    <p className="text-sm leading-relaxed">
                      <span className="font-mono font-bold" style={{ color: 'var(--matrix-green)' }}>
                        {step.label}
                      </span>
                      <span className="text-slate-400 ml-2">{step.explanation}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </AnimateIn>
        ))}
      </div>
    </section>
  )
}
