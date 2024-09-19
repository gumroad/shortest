'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function GitHubRepos() {
  const [repos, setRepos] = useState([]);

  useEffect(() => {
    // Fetch repos from GitHub API
    // Update setRepos with the fetched data
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your GitHub Repositories</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {repos.map((repo) => (
            <li key={repo.id}>{repo.name}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}