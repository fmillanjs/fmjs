'use client'

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import { ScrambleHero } from '@/components/portfolio/scramble-hero';

const MatrixRainCanvas = dynamic(
  () => import('./matrix-rain-canvas'),
  { ssr: false }
)

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-background to-muted/30 py-24 md:py-32">
      <MatrixRainCanvas />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
          <ScrambleHero text="Fernando Millan" className="block mb-2" />
          <span className="block text-primary">
            Full-Stack Engineer Building Production-Ready SaaS
          </span>
        </h1>

        <p className="cursor-blink text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
          Specializing in Next.js, NestJS, TypeScript, and real-time collaboration systems.
          I build scalable, production-ready applications with clean architecture and type safety.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/about">Learn More</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="https://github.com/fernandomillan" target="_blank" rel="noopener noreferrer">
              View GitHub
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
