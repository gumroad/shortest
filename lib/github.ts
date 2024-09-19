import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

export async function getGitHubRepos() {
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
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 10,
    });

    return data.map((repo) => ({ id: repo.id, name: repo.name }));
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    throw new Error("Failed to fetch GitHub repositories");
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
    const { data } = await octokit.pulls.list({
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
      const prs = await getGitHubPullRequests();
      return NextResponse.json(prs);
    } else {
      return NextResponse.json({ error: "Invalid endpoint" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error handling GitHub API request:", error);
    if (error instanceof Error && error.message === "User not authenticated") {
      return NextResponse.redirect(new URL("/login", request.url));
    } else if (
      error instanceof Error &&
      error.message === "GitHub token not found"
    ) {
      return NextResponse.redirect(new URL("/connect-github", request.url));
    } else {
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
}
