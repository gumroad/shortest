import { NextRequest, NextResponse } from "next/server";
import { getGitHubRepos } from "@/lib/github";

export async function GET(request: NextRequest) {
  try {
    const repos = await getGitHubRepos();
    return NextResponse.json(repos);
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 });
  }
}
