'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, Sparkles, Download, Loader2, Video as VideoIcon } from "lucide-react"
import { generateVideoForScene, getSignedUrl } from "@/app/actions"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function VideoComponent({ sceneId, initialVideoUrl, referenceImageUrl }: { sceneId: string; initialVideoUrl: string; referenceImageUrl: string }) {
    const [videoUrl, setVideoUrl] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState<boolean>(false)
    const [progress, setProgress] = useState<{ value: number, max: number } | null>(null)
    const router = useRouter()
    const [isLoadingUrl, setIsLoadingUrl] = useState<boolean>(false)

    useEffect(() => {
        const resolveUrl = async () => {
            if (!initialVideoUrl) {
                setVideoUrl(null)
                return
            }

            if (initialVideoUrl.startsWith('http')) {
                setVideoUrl(initialVideoUrl)
            } else {
                setIsLoadingUrl(true)
                const result = await getSignedUrl(initialVideoUrl)
                if (result.success && result.signedUrl) {
                    setVideoUrl(result.signedUrl)
                } else {
                    console.error("Failed to resolve signed URL")
                }
                setIsLoadingUrl(false)
            }
        }

        resolveUrl()
    }, [initialVideoUrl])

    const handleGenerate = async () => {
        setIsGenerating(true)
        setProgress(null)
        const supabase = createClient()
        const channel = supabase.channel(`scene-${sceneId}`)

        channel.on('broadcast', { event: 'progress' }, (payload) => {
            if (payload.payload && typeof payload.payload.value === 'number' && typeof payload.payload.max === 'number') {
                setProgress(payload.payload)
            }
        }).subscribe()

        try {
            const signedUrlResult = await getSignedUrl(referenceImageUrl)
            if (!signedUrlResult.success || !signedUrlResult.signedUrl) {
                alert("Failed to generate signed URL of reference image: " + signedUrlResult.error)
                return
            }

            const result = await generateVideoForScene(sceneId, signedUrlResult.signedUrl)
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
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${percentage}%` }} />
                </div>
            </div>
        )
    }

    const handleDownload = async () => {
        if (!videoUrl) return

        let downloadUrl = videoUrl
        if (!videoUrl.startsWith('http')) {
            const result = await getSignedUrl(videoUrl, { download: true })
            if (result.success && result.signedUrl) {
                downloadUrl = result.signedUrl
            }
        }

        if (downloadUrl) {
            const link = document.createElement('a')
            link.href = downloadUrl
            link.target = '_blank'
            link.rel = 'noreferrer'
            link.click()
        }
    }

    return (
        <>
            <div className={`aspect-video rounded-md overflow-hidden relative transition-colors ${!videoUrl && !isGenerating ? 'bg-muted/50 border border-dashed' : 'bg-black'}`}>
                {isLoadingUrl ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <>
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
                                    <p className="text-sm font-medium text-muted-foreground mb-4">No video generated yet</p>
                                    <Button
                                        onClick={handleGenerate}
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 hover:bg-muted/90"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Generate Video
                                    </Button>
                                </div>
                            )
                        )}
                        {isGenerating && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                {renderProgress()}
                            </div>
                        )}
                    </>
                )}
            </div>
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
                            onClick={() => { }}
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Refine
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