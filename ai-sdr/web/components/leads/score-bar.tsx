import { cn } from '@/lib/utils';

function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-green-500';   // high ICP fit
  if (score >= 40) return 'bg-amber-400';   // medium ICP fit
  return 'bg-red-400';                       // low ICP fit
}

interface ScoreBarProps {
  score: number;
  showLabel?: boolean;
  className?: string;
}

export function ScoreBar({ score, showLabel = true, className }: ScoreBarProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 bg-muted rounded-full h-2.5">
        <div
          className={cn('h-2.5 rounded-full transition-all', getScoreColor(score))}
          style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`ICP score: ${score} out of 100`}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium tabular-nums w-8 text-right">
          {score}
        </span>
      )}
    </div>
  );
}
