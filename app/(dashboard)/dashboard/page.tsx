import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGitHubRepos, getGitHubPullRequests } from "@/lib/github";

export default async function DashboardPage() {
  const repos = await getGitHubRepos();

  if (repos.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Card>
          <CardHeader>
            <CardTitle>Your GitHub Repositories and Pull Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              No repositories found. Please make sure your GitHub account is
              connected and you have access to repositories.
            </p>
            <Button className="mt-4 bg-orange-500 hover:bg-orange-600 text-white border border-orange-600 rounded-full text-lg px-8 py-4 inline-flex items-center justify-center">
              Select GitHub repositories
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch pull requests for all repositories
  const reposWithPRs = await Promise.all(
    repos.map(async (repo: any) => {
      const [owner, repoName] = repo.name.split("/");
      const pullRequests = await getGitHubPullRequests(owner, repoName);
      return { ...repo, pullRequests };
    })
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Your GitHub Repositories and Pull Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={<div>Loading repositories and pull requests...</div>}
          >
            <ul className="space-y-8">
              {reposWithPRs.map((repo: any) => (
                <li key={repo.id} className="border-b pb-6">
                  <h3 className="font-semibold text-lg mb-2">{repo.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Builds: Coming soon
                  </p>
                  <h4 className="font-medium text-md mb-2">Pull Requests:</h4>
                  {repo.pullRequests.length > 0 ? (
                    <ul className="space-y-2 pl-4">
                      {repo.pullRequests.map((pr: any) => (
                        <li key={pr.id}>
                          <a
                            href={pr.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {pr.title}
                          </a>
                          <span className="text-sm text-gray-600 ml-2">
                            #{pr.number} - {pr.state}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600 pl-4">
                      No open pull requests
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
