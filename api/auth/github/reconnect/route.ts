import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function GET() {
  const { getToken } = auth();

  try {
    // Revoke the current GitHub OAuth token
    await getToken({ template: "github" }).then(async (token) => {
      if (token) {
        // Use the token to revoke access (you may need to implement this part)
        // For example: await revokeGitHubAccess(token);
      }
    });

    // Redirect to Clerk's OAuth consent screen for GitHub
    const githubOAuthURL = `${process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}/oauth/github`;
    return NextResponse.redirect(githubOAuthURL);
  } catch (error) {
    console.error("Error reconnecting GitHub:", error);
    return NextResponse.json(
      { error: "Failed to reconnect GitHub account" },
      { status: 500 }
    );
  }
}
