'use client';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface EmailPreviewProps {
  emailText: string;
}

export function EmailPreview({ emailText }: EmailPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailText);
      setCopied(true);
      toast.success('Email copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy — try selecting and copying manually');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Generated Email</CardTitle>
          {/* Copy button — PIPE-08 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!emailText}
            className="flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy Email
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {emailText ? (
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed bg-muted/30 rounded-md p-4">
            {emailText}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Email will appear here after pipeline completes.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
