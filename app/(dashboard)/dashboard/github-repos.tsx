import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitHubReposServer } from './github-repos-server';
import { Suspense } from 'react';

export function GitHubRepos() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your GitHub Repositories</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div>Loading repositories...</div>}>
          <GitHubReposServer />
        </Suspense>
      </CardContent>
    </Card>
  );
}