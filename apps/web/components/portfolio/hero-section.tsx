import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-background to-muted/30 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
          <span className="block mb-2">Fernando Millan</span>
          <span className="block text-primary">
            Full-Stack Engineer Building Production-Ready SaaS
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12">
          Specializing in Next.js, NestJS, TypeScript, and real-time collaboration systems.
          I build scalable, production-ready applications with clean architecture and type safety.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/about"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Learn More
          </Link>
          <a
            href="https://github.com/fernandomillan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            View GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
