import { Card, CardContent } from '@/components/ui/card';

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
        <Card
          key={tech.name}
          className="hover:border-primary/50 hover:shadow-md transition-all"
        >
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              {tech.category}
            </div>
            <div className="text-lg font-semibold text-foreground">
              {tech.name}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
