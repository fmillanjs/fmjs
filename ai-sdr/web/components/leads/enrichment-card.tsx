import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EnrichOutput } from '@/lib/api';

export function EnrichmentCard({ enrich }: { enrich: EnrichOutput }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Company Intelligence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic fields */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Industry</p>
            <p className="font-medium text-foreground">{enrich.industry ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Company Size</p>
            <p className="font-medium text-foreground">{enrich.companySize ?? '—'}</p>
          </div>
        </div>

        {/* Tech Stack — intent signal badges (PIPE-05) */}
        {enrich.techStack.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Tech Stack</p>
            <div className="flex flex-wrap gap-1.5">
              {enrich.techStack.map((tech) => (
                <Badge key={tech} variant="secondary">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Pain Points — intent signal badges (PIPE-05) */}
        {enrich.painPoints.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Pain Points</p>
            <div className="flex flex-wrap gap-1.5">
              {enrich.painPoints.map((point) => (
                <Badge key={point} variant="outline">
                  {point}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
