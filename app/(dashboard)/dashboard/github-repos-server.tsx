import { auth } from "@clerk/nextjs/server";
import { Octokit } from "@octokit/rest";

async function getGitHubRepos() {
  const { userId, getToken } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const token = await getToken({ template: "github" });

  if (!token) {
    throw new Error("No GitHub token available");
  }

  const octokit = new Octokit({ auth: token });

  try {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 10,
    });
    return data.map((repo) => ({ id: repo.id, name: repo.name }));
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    if (error.status === 404) {
      throw new Error(
        "GitHub API endpoint not found. Please check your API configuration."
      );
    } else {
      throw new Error("Failed to fetch GitHub repositories");
    }
  }
}

export async function GitHubReposServer() {
  try {
    const repos = await getGitHubRepos();

    return (
      <ul>
        {repos.map((repo: { id: number; name: string }) => (
          <li key={repo.id}>{repo.name}</li>
        ))}
      </ul>
    );
  } catch (error) {
    console.error("Error in GitHubReposServer:", error);
    return <div>Error: {error.message}</div>;
  }
}
