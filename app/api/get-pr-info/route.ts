import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repo = searchParams.get("repo");
  const pullNumber = searchParams.get("pullNumber");

  if (!repo || !pullNumber) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const [owner, repoName] = repo.split("/");

  try {
    const [diffResponse, filesResponse] = await Promise.all([
      octokit.pulls.get({
        owner,
        repo: repoName,
        pull_number: parseInt(pullNumber),
        mediaType: { format: "diff" },
      }),
      octokit.pulls.listFiles({
        owner,
        repo: repoName,
        pull_number: parseInt(pullNumber),
      }),
    ]);

    const testFiles = filesResponse.data
      .filter(
        (file) =>
          file.filename.toLowerCase().includes("test") ||
          file.filename.toLowerCase().includes("spec")
      )
      .map((file) => ({
        name: file.filename,
        content: file.patch || "",
      }));

    return NextResponse.json({
      diff: diffResponse.data,
      testFiles,
    });
  } catch (error) {
    console.error("Error fetching PR info:", error);
    return NextResponse.json(
      { error: "Failed to fetch PR info" },
      { status: 500 }
    );
  }
}
