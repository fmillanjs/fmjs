import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ProjectCardProps {
  title: string
  description: string
  techStack: string[]
  href: string
  featured?: boolean
}

export function ProjectCard({ title, description, techStack, href, featured }: ProjectCardProps) {
  return (
    <Link href={href} className="block group">
      <Card className="transition-shadow hover:shadow-lg h-full">
        <CardHeader>
          {featured && (
            <Badge variant="default" className="w-fit mb-2">Featured</Badge>
          )}
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <Badge key={tech} variant="secondary">{tech}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
