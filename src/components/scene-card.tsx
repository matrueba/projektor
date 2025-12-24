'use client'

import { ImageComponent } from "@/components/image-component"
import { VideoComponent } from "@/components/video-component"
import { ScriptComponent } from "@/components/script-component"
import { useState } from "react"

interface Scene {
    id: string
    order: number
    script: string
    imagePrompt: string
    videoPrompt: string
    imageUrl?: string
    videoUrl?: string
}

export function SceneCard({ scene, enableGeneration }: { scene: Scene; enableGeneration?: boolean }) {


    return (
        <div className="group bg-card rounded-xl border shadow-sm transition-all hover:shadow-md">
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
                <div className="shrink-0 flex items-center justify-between sm:block">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {scene.order}
                    </div>
                </div>

                <div className="space-y-6 flex-1">
                    <div className="grid grid-cols-1 gap-4">
                        <ScriptComponent sceneId={scene.id} initialScript={scene.script} initialImagePrompt={scene.imagePrompt} initialVideoPrompt={scene.videoPrompt} />
                    </div>
                    <div className="space-y-4">
                        <ImageComponent sceneId={scene.id} initialImageUrl={scene.imageUrl || ""} enableGeneration={!!enableGeneration} />
                    </div>
                    {scene.imageUrl && <div className="grid grid-cols-1 gap-4">
                        <VideoComponent sceneId={scene.id} initialVideoUrl={scene.videoUrl || ""} referenceImageUrl={scene.imageUrl || ""} />
                    </div>}
                </div>
            </div>
        </div>
    )
}

