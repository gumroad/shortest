'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getGitHubRepos } from '@/lib/db/queries';

export function GitHubRepos() {
  const [repos, setRepos] = useState([]);

  useEffect(() => {
    async function fetchRepos() {
      try {
        const repos = await getGitHubRepos();
        setRepos(repos);
      } catch (error) {
        console.error('Failed to fetch GitHub repositories:', error);
      }
    }

    fetchRepos();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your GitHub Repositories</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {repos.map((repo: { id: string; name: string }) => (
            <li key={repo.id}>{repo.name}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}