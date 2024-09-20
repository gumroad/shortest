import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { getToken } = auth();

  try {
    const token = await getToken({ template: "github" });
    if (token) {
      const response = await fetch(
        "https://api.github.com/applications/{client_id}/token",
        {
          method: "DELETE",
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
          body: JSON.stringify({ access_token: token }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to revoke GitHub token");
      }
    }

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
