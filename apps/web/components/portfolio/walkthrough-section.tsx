'use client'

import Image from 'next/image'
import { AnimateIn } from '@/components/portfolio/animate-in'

export interface WalkthroughStep {
  /** The step number shown in the callout circle (1-based) */
  number: number
  /** Pixel offset from the LEFT of the screenshot image (e.g. 120) */
  x: number
  /** Pixel offset from the TOP of the screenshot image (e.g. 80) */
  y: number
  /** Short label shown bold in the legend (e.g. "Kanban Board") */
  label: string
  /** One-sentence explanation shown in the legend */
  explanation: string
}

export interface WalkthroughScreenshot {
  /** Screenshot metadata — src, width, height, alt (from Screenshot interface in screenshots-manifest.ts) */
  src: string
  width: number
  height: number
  alt: string
  /** Callout circles to overlay on this screenshot */
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
              {/* Image + overlay callout circles — overflow hidden keeps circles inside the image frame */}
              <div className="relative w-full" style={{ overflow: 'hidden' }}>
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  width={shot.width}
                  height={shot.height}
                  className="w-full h-auto rounded-lg border border-[var(--matrix-green-border)]"
                />
                {shot.steps.map((step) => (
                  <span
                    key={step.number}
                    aria-label={`Step ${step.number}: ${step.label}`}
                    title={`Step ${step.number}: ${step.label}`}
                    style={{
                      position: 'absolute',
                      left: `${(step.x / shot.width) * 100}%`,
                      top: `${(step.y / shot.height) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'var(--matrix-green)',
                      color: '#0a0a0a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      fontSize: '0.75rem',
                      userSelect: 'none',
                      cursor: 'pointer',
                      zIndex: 10,
                    }}
                  >
                    {step.number}
                  </span>
                ))}
              </div>
              {/* Legend */}
              <div className="mt-4 space-y-2">
                {shot.steps.map((step) => (
                  <div key={step.number} className="flex gap-3 items-start">
                    <span
                      aria-hidden="true"
                      style={{
                        flexShrink: 0,
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: 'var(--matrix-green)',
                        color: '#0a0a0a',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        fontSize: '0.7rem',
                      }}
                    >
                      {step.number}
                    </span>
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
