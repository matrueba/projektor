import { progressStore } from "@/lib/progress-store"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * SSE Endpoint for streaming generation progress updates
 *
 * Clients connect to this endpoint to receive real-time progress
 * updates for image/video generation for a specific scene.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> },
) {
  const { sceneId } = await params

  const encoder = new TextEncoder()
  let unsubscribe: (() => void) | null = null
  let isClosed = false

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({ sceneId })}\n\n`,
        ),
      )

      // Subscribe to progress updates for this scene
      unsubscribe = progressStore.subscribe(sceneId, (value, max) => {
        if (isClosed) return

        try {
          const data = JSON.stringify({ value, max })
          controller.enqueue(
            encoder.encode(`event: progress\ndata: ${data}\n\n`),
          )
        } catch {
          // Stream may be closed
          isClosed = true
        }
      })
    },
    cancel() {
      isClosed = true
      if (unsubscribe) {
        unsubscribe()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
