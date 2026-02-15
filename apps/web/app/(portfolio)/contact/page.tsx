import type { Metadata } from 'next';
import { ContactForm } from '@/components/portfolio/contact-form';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Fernando Millan',
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Get in Touch
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Have a question or want to work together? Send me a message.
          </p>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-xl font-semibold">Send a Message</h2>
            <ContactForm />
          </div>

          <div>
            <h2 className="mb-6 text-xl font-semibold">Contact Information</h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Email</h3>
                <a href="mailto:hello@fernandomillan.dev" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  hello@fernandomillan.dev
                </a>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Location</h3>
                <p className="text-gray-600 dark:text-gray-400">Remote / Flexible Timezone</p>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Response Time</h3>
                <p className="text-gray-600 dark:text-gray-400">Within 24 hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
