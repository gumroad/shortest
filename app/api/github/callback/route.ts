import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForAccessToken,
  saveGitHubAccessToken,
} from "@/lib/github";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  try {
    const accessToken = await exchangeCodeForAccessToken(code);
    await saveGitHubAccessToken(accessToken);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("Error exchanging code for access token:", error);
    return NextResponse.json(
      { error: "Failed to authenticate with GitHub" },
      { status: 500 }
    );
  }
}
