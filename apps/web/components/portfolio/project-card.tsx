import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ProjectCardProps {
  title: string
  description: string
  techStack: string[]
  href: string
  featured?: boolean
  screenshot?: { src: string; alt: string }
}

export function ProjectCard({ title, description, techStack, href, featured, screenshot }: ProjectCardProps) {
  return (
    <Link href={href} className="card-glow-hover block group">
      <Card className="h-full">
        <CardHeader>
          {screenshot && (
            <div className="mb-4 overflow-hidden rounded-md">
              <Image
                src={screenshot.src}
                alt={screenshot.alt}
                width={1280}
                height={800}
                className="w-full h-auto object-cover"
              />
            </div>
          )}
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
