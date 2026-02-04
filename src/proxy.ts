import { NextResponse, type NextRequest } from 'next/server'

// In local mode, we don't need authentication checks
// This proxy just passes through all requests
export default function proxy(request: NextRequest) {
  // Allow all requests to pass through
  return NextResponse.next({ request })
}

// Keep the updateSession function for backwards compatibility
export async function updateSession(request: NextRequest) {
  return NextResponse.next({ request })
}
