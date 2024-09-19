import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

export async function GET(request: NextRequest) {
  const { userId, getToken } = auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const token = await getToken({ template: "github" });

  if (!token) {
    return NextResponse.redirect(new URL("/connect-github", request.url));
  }

  const octokit = new Octokit({ auth: token });

  try {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 10,
    });

    const repos = data.map((repo) => ({ id: repo.id, name: repo.name }));

    return NextResponse.json(repos);
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    if (error instanceof Error && "status" in error && error.status === 404) {
      return NextResponse.json(
        { error: "GitHub API endpoint not found. Please check your API configuration." },
        { status: 404 }
      );
    } else {
      return NextResponse.json(
        { error: "Failed to fetch GitHub repositories" },
        { status: 500 }
      );
    }
  }
}
