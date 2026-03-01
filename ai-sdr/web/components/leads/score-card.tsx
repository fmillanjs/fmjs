import { ScoreBar } from './score-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { QualifyOutput } from '@/lib/api';

export function ScoreCard({ qualify }: { qualify: QualifyOutput }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">ICP Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScoreBar score={qualify.icpScore} showLabel />
        <p className="text-sm text-muted-foreground leading-relaxed">
          {qualify.reasoning}
        </p>
      </CardContent>
    </Card>
  );
}
