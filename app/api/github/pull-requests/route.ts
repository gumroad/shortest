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
    const { data } = await octokit.pulls.list({
      state: "open",
      sort: "updated",
      direction: "desc",
      per_page: 10,
    });

    const prs = data.map((pr) => ({
      id: pr.id,
      title: pr.title,
      state: pr.state,
      number: pr.number,
      html_url: pr.html_url,
    }));

    return NextResponse.json(prs);
  } catch (error) {
    console.error("Error fetching GitHub pull requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch GitHub pull requests" },
      { status: 500 }
    );
  }
}