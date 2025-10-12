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
    <section className="py-16 border-t border-gray-200">
      <h2 className="text-3xl font-bold text-center mb-2">Projects</h2>
      <p className="text-center text-gray-600 mb-12">One project every 2 days</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full bg-gray-50 rounded-xl p-12 text-center border border-gray-200">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold mb-2">First project coming soon...</h3>
            <p className="text-gray-600">Check back in 2 days!</p>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="bg-gray-50 rounded-xl p-8 border border-gray-200 hover:border-black transition-all hover:-translate-y-2 cursor-pointer text-center"
              onClick={() => project.link && window.open(project.link, '_blank')}
            >
              <div className="text-5xl mb-4">{project.logo}</div>
              <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
              {project.revenue && (
                <div className="text-lg font-bold text-blue-600 mb-3">{project.revenue}</div>
              )}
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{project.description}</p>
              {project.link && (
                <Link
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline inline-block"
                  onClick={(e) => e.stopPropagation()}
                >
                  Visit →
                </Link>
              )}
              <div className="mt-4">
                <span
                  className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
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
            </div>
          ))
        )}
      </div>
    </section>
  );
}
