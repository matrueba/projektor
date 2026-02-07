"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    RotateCcw,
    Sparkles,
    Download,
    Image as ImageIcon,
    Loader2,
    ImagePlus,
} from "lucide-react"
import { generateImageForScene } from "@/app/actions/comfyui-actions"
import { useRouter } from "next/navigation"
import { ReferenceImageComponent } from "./reference-image"
import { useGenerationProgress } from "@/lib/hooks/use-generation-progress"
import { useToast } from "@/components/ui/toast"

export interface ImageComponentProps {
    sceneId: string
    initialImageUrl: string
    enableGeneration: boolean
}

/**
 * React component for displaying and generating scene images.
 * Supports reference image uploads, generation progress tracking,
 * and download functionality.
 * @param {ImageComponentProps} props - Component properties
 * @param {string} props.sceneId - Unique identifier for the scene
 * @param {string} props.initialImageUrl - URL of existing image if any
 * @param {boolean} props.enableGeneration - Whether generation is allowed
 * @returns {JSX.Element} Image component with controls
 */
export function ImageComponent({
    sceneId,
    initialImageUrl,
    enableGeneration,
}: ImageComponentProps) {
    const [uploadedReferenceImages, setUploadedReferenceImages] = useState<
        string[]
    >([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [useReferenceImage, setUseReferenceImage] = useState(false)
    const router = useRouter()
    const imageUrl = initialImageUrl ? `/api/storage/${initialImageUrl}` : null
    const toast = useToast()

    // Connect to SSE progress updates when generating
    const { progress } = useGenerationProgress(sceneId, isGenerating)

    /**
     * Handles the toggle state for reference image usage.
     * Clears uploaded reference images when disabled.
     * @param {boolean} checked - Whether reference image feature is enabled
     * @returns {void}
     */
    const handleReferenceToggle = (checked: boolean) => {
        setUseReferenceImage(checked)
        if (!checked) {
            setUploadedReferenceImages([])
        }
    }

    /**
     * Renders a progress bar component during image generation.
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
     * Initiates image generation for the current scene using ComfyUI.
     * Optionally uses a reference image if enabled and uploaded.
     * Updates UI state and handles errors via toast notifications.
     * @returns {Promise<void>}
     */
    const handleGenerate = async () => {
        setIsGenerating(true)

        try {
            const result = await generateImageForScene(
                sceneId,
                useReferenceImage && uploadedReferenceImages.length > 0
                    ? uploadedReferenceImages[0]
                    : undefined,
            )
            if (result.error) {
                toast.showToast(
                    "Error",
                    "Failed to generate image: " + result.error,
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
     * Opens the generated image in a new browser tab for download.
     * @returns {void}
     */
    const handleDownload = () => {
        if (!imageUrl) return
        const link = document.createElement("a")
        link.href = imageUrl
        link.target = "_blank"
        link.rel = "noreferrer"
        link.click()
    }

    return (
        <>
            {/* Toggle for reference images */}
            {/*<div className="flex items-center justify-between p-3 mb-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                    <ImagePlus className="w-5 h-5 text-muted-foreground" />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">Use Reference Image</span>
                        <span className="text-xs text-muted-foreground">
                            Upload an image to guide the style/structure of generation
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => handleReferenceToggle(!useReferenceImage)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${useReferenceImage ? "bg-primary" : "bg-primary/20"}`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${useReferenceImage ? "translate-x-6" : "translate-x-1"}`}
                    />
                </button>
            </div>*/}

            {/* Reference image section - shown above when enabled */}
            {/*{useReferenceImage && (
        <div className="mb-4">
          <span className="text-sm font-medium text-muted-foreground block mb-2">
            Reference Image
          </span>
          <ReferenceImageComponent
            uploadedImages={uploadedReferenceImages}
            setUploadedImages={setUploadedReferenceImages}
          />
        </div>
      )}*/}

            {/* Generated image section - always shown */}
            <div className="grid grid-cols-1 gap-4">
                <span className="text-sm font-medium text-muted-foreground">
                    Generated Image
                </span>
                <div
                    className={`aspect-video rounded-md overflow-hidden relative transition-colors ${!imageUrl && !isGenerating ? "bg-muted/50 border border-dashed" : "bg-black"}`}
                >
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt="Scene generation"
                            className={`w-full h-full object-cover transition-opacity duration-300 ${isGenerating ? "opacity-50" : "opacity-100"}`}
                        />
                    ) : (
                        !isGenerating && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                <ImageIcon className="w-8 h-8 text-muted-foreground/40 mb-4" />
                                <p className="text-sm font-medium text-muted-foreground mb-4">
                                    No image generated yet
                                </p>
                                {enableGeneration && (
                                    <Button
                                        onClick={handleGenerate}
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 hover:bg-muted/90"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Generate Image
                                    </Button>
                                )}
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
            </div>
            <div className="flex gap-2">
                {imageUrl ? (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={handleGenerate}
                            disabled={isGenerating || !enableGeneration}
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            {isGenerating ? "Generating..." : "Relaunch"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={handleDownload}
                            disabled={!imageUrl || isGenerating}
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
