import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

export async function getGitHubRepos() {
  try {
    const { getToken } = auth();
    const token = await getToken({ template: "github-oauth-token" });

    if (!token) {
      throw new Error("No GitHub token found");
    }

    const octokit = new Octokit({ auth: token });

    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: "updated",
      direction: "desc",
    });

    return repos;
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return []; // Return an empty array instead of throwing
  }
}

export async function getGitHubPullRequests(owner: string, repo: string) {
  const { userId, getToken } = auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const token = await getToken({ template: "github" });

  if (!token) {
    throw new Error("GitHub token not found");
  }

  const octokit = new Octokit({ auth: token });

  try {
    const { data } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: "open",
      sort: "updated",
      direction: "desc",
      per_page: 10,
    });

    return data.map((pr) => ({
      id: pr.id,
      title: pr.title,
      state: pr.state,
      number: pr.number,
      html_url: pr.html_url,
    }));
  } catch (error) {
    console.error("Error fetching GitHub pull requests:", error);
    throw new Error("Failed to fetch GitHub pull requests");
  }
}

export async function handleGitHubApiRequest(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;
    if (path.endsWith("/repos")) {
      const repos = await getGitHubRepos();
      return NextResponse.json(repos);
    } else if (path.endsWith("/pull-requests")) {
      const [owner, repo] = path.split("/").slice(-3, -1);
      const prs = await getGitHubPullRequests(owner, repo);
      return NextResponse.json(prs);
    } else {
      return NextResponse.json({ error: "Invalid endpoint" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error handling GitHub API request:", error);
    if (error instanceof Error && error.message === "User not authenticated") {
      return NextResponse.redirect(new URL("/login", request.url));
    } else {
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
}
