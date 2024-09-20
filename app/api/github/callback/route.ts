import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForAccessToken } from '@/lib/github';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    const accessToken = await exchangeCodeForAccessToken(code);
    // Store the access token securely, e.g., in a database associated with the user's session
    // Redirect the user to the dashboard or another appropriate page
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Error exchanging code for access token:', error);
    return NextResponse.json({ error: 'Failed to authenticate with GitHub' }, { status: 500 });
  }
}