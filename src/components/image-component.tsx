'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, Sparkles, Download, Image as ImageIcon } from "lucide-react"
import { generateImageForScene } from "@/app/actions"
import { useRouter } from "next/navigation"

export function ImageComponent({ sceneId, initialImageUrl, enableGeneration, referenceImageUrl }: { sceneId: string; initialImageUrl: string; enableGeneration?: boolean; referenceImageUrl?: string | null }) {
    const [imageUrl, setImageUrl] = useState(initialImageUrl)
    const [isGenerating, setIsGenerating] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setImageUrl(initialImageUrl)
    }, [initialImageUrl])

    const handleGenerate = async () => {
        setIsGenerating(true)
        try {
            const result = await generateImageForScene(sceneId, referenceImageUrl || undefined)
            if (result.error) {
                alert("Failed to generate image: " + result.error)
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

    if (!imageUrl) {
        if (enableGeneration) {
            return (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md bg-muted/50">
                    <ImageIcon className="w-8 h-8 text-muted-foreground mb-4" />
                    <Button onClick={handleGenerate} disabled={isGenerating}>
                        {isGenerating ? "Generating..." : "Generate Image"}
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
                    <img src={imageUrl} alt="Scene generation" className="w-full h-full object-cover" />
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
                        <a href={imageUrl} download target="_blank" rel="noreferrer">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                        </a>
                    </Button>
                </div>
            </div>
        </>
    )
}