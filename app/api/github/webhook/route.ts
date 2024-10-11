import { NextResponse } from "next/server";
import { getOctokit } from "@/lib/github";
import { revalidateTag } from "next/cache";

const octokit = getOctokit();

// Webhooks documentation: https://docs.github.com/en/webhooks

export async function POST(request: Request) {
  const payload = await request.json();
  const githubEvent = request.headers.get("x-github-event");

  if (!githubEvent) {
    return NextResponse.json(
      { error: "No GitHub event specified" },
      { status: 400 }
    );
  }

  try {
    switch (githubEvent) {
      case "push":
        await handlePushEvent(payload);
        break;
      case "pull_request":
        await handlePullRequestEvent(payload);
        break;
      case "workflow_run":
        await handleWorkflowRunEvent(payload);
        break;
      default:
        console.log(`Unhandled event type: ${githubEvent}`);
    }

    return NextResponse.json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error(`Error processing ${githubEvent} webhook:`, error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

async function handlePushEvent(payload: any) {
  const { repository, commits } = payload;
  console.log(`New push to ${repository.full_name}`);
  // Process commits
}

async function handlePullRequestEvent(payload: any) {
  const { action, pull_request, repository } = payload;
  console.log(`Pull request ${action} in ${repository.full_name}`);
  // Process pull request
}

async function handleWorkflowRunEvent(payload: any) {
  const { action, workflow_run, repository } = payload;
  console.log(`Workflow run ${action} in ${repository.full_name}`);

  if (action === "completed") {
    const pullRequests = workflow_run.pull_requests;
    for (const pr of pullRequests) {
      revalidateTag(`pullRequest-${pr.id}`);
    }
  }
}
