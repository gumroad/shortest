"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, GitPullRequest } from "lucide-react";
import { PullRequestItem } from "./pull-request";
import { PullRequest } from "./types";
import { getAssignedPullRequests } from "@/lib/github";
import { getAssignedMergeRequests } from "@/lib/gitlab";

export default function DashboardPage() {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [mergeRequests, setMergeRequests] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndSetCodeRequests = async () => {
      try {
        const [githubData, gitlabData] = await Promise.all([
          getAssignedPullRequests(),
          getAssignedMergeRequests(),
        ]);

        if ("error" in githubData) {
          setError(githubData.error as string);
          setPullRequests([]);
        } else {
          setPullRequests(
            githubData.map((pr) => ({
              ...pr,
              source: 'github',  // Add this line
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
        }

        if ("error" in gitlabData) {
          setError((prevError) => prevError ? `${prevError}\n${gitlabData.error}` : gitlabData.error as string);
          setMergeRequests([]);
        } else {
          console.log(gitlabData);
          setMergeRequests(
            gitlabData.map((mr) => ({
              ...mr,
              source: 'gitlab',  // Add this line
              repository: {
                id: mr.repoId,
                name: mr.repo,
                full_name: `${mr.owner}/${mr.repo}`,
                owner: {
                  login: mr.owner,
                },
              },
            }))
          );
        }

        setError(null);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching requests:", error);
        setLoading(false);
        setError(
          "Failed to fetch pull requests and merge requests. Please reconnect your GitHub and GitLab accounts."
        );
        setPullRequests([]);
        setMergeRequests([]);
      }
    };

    fetchAndSetCodeRequests();
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

  const allRequests = [...pullRequests, ...mergeRequests];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="p-6 flex-grow flex items-center">
        {allRequests.length > 0 ? (
          <ul className="space-y-8 w-full">
            {allRequests.map((request) => (
              <li key={request.id}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">
                    {request.repository.full_name}
                  </h3>
                </div>
                <PullRequestItem pullRequest={request} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <GitPullRequest className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No pull requests or merge requests found
              </h3>
              <p className="text-gray-600 mb-4">
                We couldn't find any pull requests or merge requests assigned to you.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
