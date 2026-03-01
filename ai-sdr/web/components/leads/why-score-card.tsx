import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';
import type { QualifyOutput } from '@/lib/api';

export function WhyScoreCard({ qualify }: { qualify: QualifyOutput }) {
  const hasMatched = qualify.matchedCriteria.length > 0;
  const hasWeak = qualify.weakCriteria.length > 0;

  if (!hasMatched && !hasWeak) return null;

  return (
    <Card>
      <CardContent className="pt-0">
        <Accordion type="single" collapsible>
          <AccordionItem value="why-score" className="border-none">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
              Why this score?
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pb-2">
                {hasMatched && (
                  <div>
                    <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2 uppercase tracking-wide">
                      Strong Fit
                    </p>
                    <ul className="space-y-1.5">
                      {qualify.matchedCriteria.map((criterion, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <span>{criterion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {hasWeak && (
                  <div>
                    <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-2 uppercase tracking-wide">
                      Gaps
                    </p>
                    <ul className="space-y-1.5">
                      {qualify.weakCriteria.map((criterion, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <XCircle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <span>{criterion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
