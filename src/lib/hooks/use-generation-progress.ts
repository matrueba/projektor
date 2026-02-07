"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface ProgressState {
  value: number
  max: number
}

/**
 * React hook for subscribing to generation progress updates via SSE.
 * Connects to the /api/progress/[sceneId] endpoint and receives real-time updates.
 * @param sceneId - The scene ID to track progress for
 * @returns Object with current progress value, max, and connection status
 */
export function useGenerationProgress(sceneId: string, isGenerating: boolean) {
  const [progress, setProgress] = useState<ProgressState | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  /**
   * Establishes SSE connection to receive progress updates.
   */
  const connect = useCallback(() => {
    if (!isGenerating) return
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource(`/api/progress/${sceneId}`)
    eventSourceRef.current = eventSource

    eventSource.addEventListener("connected", () => {
      setIsConnected(true)
    })

    eventSource.addEventListener("progress", (event) => {
      try {
        const data = JSON.parse(event.data)
        setProgress({ value: data.value, max: data.max })
      } catch (error) {
        console.error("Failed to parse progress data:", error)
      }
    })

    eventSource.onerror = () => {
      setIsConnected(false)
      eventSource.close()
    }
  }, [sceneId])

  /**
   * Closes the SSE connection.
   */
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setIsConnected(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    progress,
    isConnected,
    connect,
    disconnect,
    reset: () => setProgress(null),
  }
}
