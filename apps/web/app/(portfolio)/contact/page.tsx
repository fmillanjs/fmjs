import type { Metadata } from 'next';
import { ContactForm } from '@/components/portfolio/contact-form';
import { AnimateIn } from '@/components/portfolio/animate-in';
import { SectionLabel } from '@/components/portfolio/section-label';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Fernando Millan',
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <AnimateIn className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Get in Touch
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Have a question or want to work together? Send me a message.
          </p>
        </AnimateIn>

        <div className="mt-12 grid gap-12 lg:grid-cols-2">
          <div>
            <SectionLabel label="Send a Message" />
            <h2 className="mb-6 text-xl font-semibold">Send a Message</h2>
            <ContactForm />
          </div>

          <div>
            <SectionLabel label="Contact Information" />
            <h2 className="mb-6 text-xl font-semibold">Contact Information</h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 font-medium text-foreground">Email</h3>
                <a href="mailto:hello@fernandomillan.dev" className="text-[var(--matrix-green)] hover:underline">
                  hello@fernandomillan.dev
                </a>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-foreground">Location</h3>
                <p className="text-muted-foreground">Remote / Flexible Timezone</p>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-foreground">Response Time</h3>
                <p className="text-muted-foreground">Within 24 hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
