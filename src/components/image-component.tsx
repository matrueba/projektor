'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, Sparkles, Download, Image as ImageIcon, Loader2 } from "lucide-react"
import { generateImageForScene, getSignedUrl } from "@/app/actions"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ReferenceImageComponent } from "./reference-image"

export interface ImageComponentProps {
    sceneId: string
    initialImageUrl: string
    enableGeneration: boolean
}

export function ImageComponent({ sceneId, initialImageUrl, enableGeneration }: ImageComponentProps) {
    const [uploadedI2IReferenceImage, setUploadedI2IReferenceImage] = useState<string | null>(null)
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isLoadingUrl, setIsLoadingUrl] = useState(false)
    const [progress, setProgress] = useState<{ value: number, max: number } | null>(null)
    const router = useRouter()

    useEffect(() => {
        const resolveUrl = async () => {
            if (!initialImageUrl) {
                setImageUrl(null)
                return
            }

            if (initialImageUrl.startsWith('http')) {
                setImageUrl(initialImageUrl)
            } else {
                setIsLoadingUrl(true)
                const result = await getSignedUrl(initialImageUrl)
                if (result.success && result.signedUrl) {
                    setImageUrl(result.signedUrl)
                } else {
                    console.error("Failed to resolve signed URL")
                }
                setIsLoadingUrl(false)
            }
        }

        resolveUrl()
    }, [initialImageUrl])


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
            const result = await generateImageForScene(sceneId, uploadedI2IReferenceImage || undefined)
            if (result.error) {
                alert("Failed to generate image: " + result.error)
            } else {
                router.refresh()
            }
        } catch (error) {
            console.error(error)
            alert("An error occurred: " + (error as Error).message)
        } finally {
            await supabase.removeChannel(channel)
            setIsGenerating(false)
            setProgress(null)
        }
    }

    const handleDownload = async () => {
        if (!initialImageUrl) return

        let downloadUrl = imageUrl
        if (!initialImageUrl.startsWith('http')) {
            const result = await getSignedUrl(initialImageUrl, { download: true })
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
            <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-1 gap-4">
                    <span className="text-sm font-medium text-muted-foreground">Reference Image</span>
                    <ReferenceImageComponent uploadedImage={uploadedI2IReferenceImage} setUploadedImage={setUploadedI2IReferenceImage} />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <span className="text-sm font-medium text-muted-foreground">Generated Image</span>
                    <div className={`aspect-video rounded-md overflow-hidden relative transition-colors ${!imageUrl && !isGenerating ? 'bg-muted/50 border border-dashed' : 'bg-black'}`}>
                        {isLoadingUrl ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <>
                                {imageUrl ? (
                                    <img src={imageUrl} alt="Scene generation" className={`w-full h-full object-cover transition-opacity duration-300 ${isGenerating ? 'opacity-50' : 'opacity-100'}`} />
                                ) : (
                                    !isGenerating && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                            <ImageIcon className="w-8 h-8 text-muted-foreground/40 mb-4" />
                                            <p className="text-sm font-medium text-muted-foreground mb-4">No image generated yet</p>
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
                                        <div className="bg-background/80 p-4 rounded-lg shadow-lg flex flex-col items-center w-full max-w-[80%]">
                                            <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                                            {renderProgress()}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div >
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
