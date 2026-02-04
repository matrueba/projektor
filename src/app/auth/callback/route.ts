import { NextResponse } from 'next/server'

// In local mode, no OAuth callback is needed
// This route just redirects to dashboard
export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/dashboard`)
}
