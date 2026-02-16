import Link from 'next/link';

interface ProjectCardProps {
  title: string;
  description: string;
  techStack: string[];
  href: string;
  featured?: boolean;
}

export function ProjectCard({ title, description, techStack, href, featured }: ProjectCardProps) {
  return (
    <Link href={href} className={`group block rounded-lg border bg-white p-6 transition-all hover:shadow-lg dark:bg-gray-900 ${featured ? 'border-blue-500' : 'border-gray-200 dark:border-gray-800'}`}>
      {featured && <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">Featured</span>}
      <h3 className="mb-2 text-2xl font-bold">{title}</h3>
      <p className="mb-4 text-gray-600 dark:text-gray-600 dark:text-gray-300">{description}</p>
      <div className="flex flex-wrap gap-2">
        {techStack.map((tech) => (
          <span key={tech} className="rounded-md bg-gray-100 px-2 py-1 text-sm dark:bg-gray-800">{tech}</span>
        ))}
      </div>
    </Link>
  );
}
