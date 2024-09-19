'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useClerk } from "@clerk/nextjs";

export function PullRequests() {
  const [prs, setPRs] = useState([]);
  const { user } = useClerk();

  useEffect(() => {
    async function fetchPRs() {
      try {
        const response = await fetch('/api/github/pull-requests', {
          headers: {
            Authorization: `Bearer ${user?.primaryEmailAddress?.emailAddress}`,
          },
        });
        const data = await response.json();
        setPRs(data);
      } catch (error) {
        console.error('Failed to fetch pull requests:', error);
      }
    }

    fetchPRs();
  }, [user]);

  const handleWriteTests = (prId: string) => {
    // Implement logic to write new tests for successful builds
  };

  const handleEditTests = (prId: string) => {
    // Implement logic to edit tests for failing builds
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Pull Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {prs.map((pr: { id: string; title: string; state: string; buildStatus: string }) => (
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