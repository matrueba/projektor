'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, Sparkles, Download, Video as VideoIcon } from "lucide-react"
import { generateVideoForScene } from "@/app/actions"
import { useRouter } from "next/navigation"

export function VideoComponent({ sceneId, initialVideoUrl, enableGeneration }: { sceneId: string; initialVideoUrl: string; enableGeneration?: boolean }) {
    const [videoUrl, setVideoUrl] = useState(initialVideoUrl)
    const [isGenerating, setIsGenerating] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setVideoUrl(initialVideoUrl)
    }, [initialVideoUrl])

    const handleGenerate = async () => {
        setIsGenerating(true)
        try {
            const result = await generateVideoForScene(sceneId)
            if (result.error) {
                alert("Failed to generate video: " + result.error)
            } else {
                router.refresh()
            }
        } catch (error) {
            console.error(error)
            alert("An error occurred: " + (error as Error).message)
        } finally {
            setIsGenerating(false)
        }
    }

    if (!videoUrl) {
        if (enableGeneration) {
            return (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md bg-muted/50">
                    <VideoIcon className="w-8 h-8 text-muted-foreground mb-4" />
                    <Button onClick={handleGenerate} disabled={isGenerating}>
                        {isGenerating ? "Generating..." : "Generate Video"}
                    </Button>
                </div>
            )
        }
        return null
    }

    return (
        <>
            <div>
                <div className="aspect-video bg-black rounded-md overflow-hidden">
                    <video src={videoUrl} controls className="w-full h-full" />
                </div>
                <div className="flex gap-2 mt-4">
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
                        onClick={() => { }}
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Refine
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                    >
                        <a href={videoUrl} download target="_blank" rel="noreferrer">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                        </a>
                    </Button>
                </div>
            </div>

        </>
    )
}