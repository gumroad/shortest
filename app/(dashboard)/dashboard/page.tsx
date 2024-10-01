"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, GitPullRequest } from "lucide-react";
import { PullRequestItem } from "./pull-request";
import { PullRequest } from "./types";
import { getAssignedPullRequests } from "@/lib/github";

export default function DashboardPage() {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndSetPullRequests = async () => {
      try {
        const data = await getAssignedPullRequests();
        if ("error" in data) {
          setError(data.error as string);
          setPullRequests([]);
        } else {
          setPullRequests(
            data.map((pr) => ({
              ...pr,
              repository: {
                id: parseInt(pr.repoId, 10),
                name: pr.repo,
                full_name: `${pr.owner}/${pr.repo}`,
                owner: {
                  login: pr.owner,
                },
              },
            }))
          );
          setError(null);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching pull requests:", error);
        setLoading(false);
        setError(
          "Failed to fetch pull requests. Please reconnect your GitHub account."
        );
        setPullRequests([]);
      }
    };

    fetchAndSetPullRequests();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg mb-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="p-6 flex-grow flex items-center">
        {pullRequests.length > 0 ? (
          <ul className="space-y-8 w-full">
            {pullRequests.map((pr) => (
              <li key={pr.id}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">
                    {pr.repository.full_name}
                  </h3>
                </div>
                <PullRequestItem pullRequest={pr} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <GitPullRequest className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No pull requests found
              </h3>
              <p className="text-gray-600 mb-4">
                We couldn't find any pull requests assigned to you.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
