import { NextRequest } from "next/server";
import { handleGitHubApiRequest } from "@/lib/github";

export async function GET(request: NextRequest) {
  return handleGitHubApiRequest(request);
}
