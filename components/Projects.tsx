import Link from 'next/link';

interface Project {
  id: number;
  name: string;
  logo: string;
  revenue: string | null;
  description: string;
  link: string | null;
  status: string;
  daysToComplete: number | null;
  createdAt: Date | null;
  completedAt: Date | null;
}

interface ProjectsProps {
  projects: Project[];
}

export default function Projects({ projects }: ProjectsProps) {
  return (
    <section className="py-12 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Projects</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length === 0 ? (
          <div className="col-span-full border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <div className="text-5xl mb-3">🚀</div>
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-gray-600 text-sm">Building in progress...</p>
          </div>
        ) : (
          projects.map((project) => (
            <Link
              key={project.id}
              href={project.link || '#'}
              target={project.link ? '_blank' : '_self'}
              rel={project.link ? 'noopener noreferrer' : undefined}
              className="block border border-gray-200 rounded-lg p-5 hover:border-black hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{project.logo}</div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    project.status === 'live'
                      ? 'bg-green-100 text-green-800'
                      : project.status === 'paused'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {project.status}
                </span>
              </div>

              <h3 className="text-lg font-bold mb-1 group-hover:underline">{project.name}</h3>

              {project.revenue && (
                <div className="text-lg font-bold text-green-600 mb-2">{project.revenue}</div>
              )}

              <p className="text-sm text-gray-600 leading-relaxed">{project.description}</p>

              {project.daysToComplete && (
                <p className="text-xs text-gray-500 mt-3">Built in {project.daysToComplete} days</p>
              )}
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
