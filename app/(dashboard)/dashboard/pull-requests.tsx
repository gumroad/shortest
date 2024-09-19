'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function PullRequests() {
  const [prs, setPRs] = useState([]);

  useEffect(() => {
    // Fetch PRs from GitHub API
    // Update setPRs with the fetched data
  }, []);

  const handleWriteTests = (prId) => {
    // Implement logic to write new tests for successful builds
  };

  const handleEditTests = (prId) => {
    // Implement logic to edit tests for failing builds
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Pull Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {prs.map((pr) => (
            <li key={pr.id}>
              {pr.title}
              {pr.state === 'open' && pr.buildStatus === 'success' && (
                <Button onClick={() => handleWriteTests(pr.id)}>Write New Tests</Button>
              )}
              {pr.state === 'open' && pr.buildStatus === 'failure' && (
                <Button onClick={() => handleEditTests(pr.id)}>Edit Tests</Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}