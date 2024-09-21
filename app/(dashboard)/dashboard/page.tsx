"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
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

  const handleReconnectGitHub = async () => {
    try {
      const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!clientId) {
        throw new Error("GitHub Client ID is not set");
      }
      if (!baseUrl) {
        throw new Error("Base URL is not set");
      }
      const redirectUri = `${baseUrl}/api/github/callback`;
      const encodedRedirectUri = encodeURIComponent(redirectUri);
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&scope=repo,user`;
    } catch (error) {
      console.error("Error redirecting to GitHub:", error);
      setError("Failed to redirect to GitHub. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6">
        {pullRequests.length > 0 ? (
          <ul className="space-y-8">
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
          <p>No pull requests found.</p>
        )}
      </div>
    </div>
  );
}
