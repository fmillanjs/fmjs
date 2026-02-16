const technologies = [
  // Frontend
  { name: 'Next.js', category: 'Frontend' },
  { name: 'React', category: 'Frontend' },
  { name: 'TypeScript', category: 'Frontend' },
  { name: 'Tailwind CSS', category: 'Frontend' },

  // Backend
  { name: 'NestJS', category: 'Backend' },
  { name: 'Prisma', category: 'Backend' },
  { name: 'PostgreSQL', category: 'Backend' },
  { name: 'Redis', category: 'Backend' },

  // Infrastructure
  { name: 'Docker', category: 'Infrastructure' },
  { name: 'WebSocket', category: 'Infrastructure' },
  { name: 'Coolify', category: 'Infrastructure' },
  { name: 'Git', category: 'Infrastructure' },
];

export function TechStack() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {technologies.map((tech) => (
        <div
          key={tech.name}
          className="border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all bg-card"
        >
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            {tech.category}
          </div>
          <div className="text-lg font-semibold text-foreground">
            {tech.name}
          </div>
        </div>
      ))}
    </div>
  );
}
