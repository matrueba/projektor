"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  RotateCcw,
  Sparkles,
  Download,
  Loader2,
  Video as VideoIcon,
} from "lucide-react"
import { generateVideoForScene } from "@/app/actions/comfyui-actions"
import { useRouter } from "next/navigation"
import { useGenerationProgress } from "@/lib/hooks/use-generation-progress"
import { useToast } from "@/components/ui/toast"

/**
 * Converts a local file path to a URL accessible via the storage API.
 * Returns the original URL if it's already an HTTP URL.
 * @param {string} path - Local file path or URL
 * @returns {string} Accessible URL for the file
 */
function getLocalFileUrl(path: string): string {
  if (!path) return ""
  if (path.startsWith("http")) return path
  return `/api/storage/${path}`
}

/**
 * React component for displaying and generating scene videos.
 * Supports I2V generation with progress tracking and download functionality.
 * @param {Object} props - Component properties
 * @param {string} props.sceneId - Unique identifier for the scene
 * @param {number} props.sceneDuration - Duration of the scene in seconds
 * @param {string} props.initialVideoUrl - URL of existing video if any
 * @param {string} props.referenceImageUrl - URL of reference image for I2V generation
 * @returns {JSX.Element} Video component with controls
 */
export function VideoComponent({
  sceneId,
  sceneDuration,
  initialVideoUrl,
  referenceImageUrl,
}: {
  sceneId: string
  sceneDuration: number
  initialVideoUrl: string
  referenceImageUrl: string
}) {
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const router = useRouter()
  const videoUrl = getLocalFileUrl(initialVideoUrl)
  const imageUrl = getLocalFileUrl(referenceImageUrl)
  const toast = useToast()

  // Connect to SSE progress updates when generating
  const { progress } = useGenerationProgress(sceneId, isGenerating)

  /**
   * Calculates the video length in frames based on scene duration.
   * Uses 16 frames per second plus 1 extra frame.
   * @returns {number} Total number of frames for the video
   */
  const calculateLength = () => {
    return sceneDuration * 16 + 1 // 16 frames per second
  }

  /**
   * Initiates video generation for the current scene using ComfyUI.
   * Uses the reference image as the starting frame.
   * Updates UI state and handles errors via toast notifications.
   * @returns {Promise<void>}
   */
  const handleGenerate = async () => {
    setIsGenerating(true)

    try {
      const length = calculateLength()
      const result = await generateVideoForScene(sceneId, imageUrl, length)
      if (result.error) {
        toast.showToast(
          "Error",
          "Failed to generate video: " + result.error,
          "error",
        )
      } else {
        router.refresh()
      }
    } catch (error) {
      toast.showToast(
        "Error",
        "An error occurred: " + (error as Error).message,
        "error",
      )
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * Renders a progress bar component during video generation.
   * Displays percentage and visual indicator of generation progress.
   * @returns {JSX.Element | null} Progress bar component or null if not generating
   */
  const renderProgress = () => {
    if (!isGenerating || !progress) return null
    const percentage = Math.round((progress.value / progress.max) * 100)
    return (
      <div className="w-full mt-2 space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Generating...</span>
          <span>{percentage}%</span>
        </div>
        <div className="h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }

  /**
   * Opens the generated video in a new browser tab for download.
   * @returns {void}
   */
  const handleDownload = () => {
    if (!videoUrl) return

    const link = document.createElement("a")
    link.href = videoUrl
    link.target = "_blank"
    link.rel = "noreferrer"
    link.click()
  }

  return (
    <>
      <div
        className={`aspect-video rounded-md overflow-hidden relative transition-colors ${!videoUrl && !isGenerating ? "bg-muted/50 border border-dashed" : "bg-black"}`}
      >
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            className="w-full h-full object-cover"
          />
        ) : (
          !isGenerating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <VideoIcon className="w-8 h-8 text-muted-foreground/40 mb-4" />
              <p className="text-sm font-medium text-muted-foreground mb-4">
                No video generated yet
              </p>
              <Button
                onClick={handleGenerate}
                variant="outline"
                size="sm"
                className="gap-2 hover:bg-muted/90"
                disabled={!imageUrl}
              >
                <Sparkles className="w-4 h-4" />
                Generate Video
              </Button>
            </div>
          )
        )}
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>
      {renderProgress()}
      <div className="flex gap-2 mt-4">
        {videoUrl ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Relaunch
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleDownload}
              disabled={!videoUrl || isGenerating}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </>
        ) : null}
      </div>
    </>
  )
}
