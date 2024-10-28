import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileIcon } from 'lucide-react';

const MAX_LINES = 8;

interface FilePreviewProps {
  path: string;
  content: string;
}

export function FilePreviewCard({ path, content }: FilePreviewProps) {
  const truncatedContent = content
    .split('\n')
    .slice(0, MAX_LINES)
    .join('\n') + (content.split('\n').length > MAX_LINES ? '\n...' : '');
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileIcon className="h-4 w-4" />
          {path}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <pre className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded-md overflow-x-auto whitespace-pre">
          {truncatedContent}
        </pre>
      </CardContent>
    </Card>
  );
} 