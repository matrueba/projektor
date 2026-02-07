"use client"

import { ImageComponent } from "@/components/image-component"
import { VideoComponent } from "@/components/video-component"
import { ScriptComponent } from "@/components/script-component"
import { Scene } from "@/types"

export function SceneCard({
  scene,
  enableGeneration,
}: {
  scene: Scene
  enableGeneration?: boolean
}) {
  const sceneStart = scene.startAt || 0
  const sceneEnd = scene.endAt
  if (!sceneEnd) return null
  const sceneDuration = sceneEnd - sceneStart

  return (
    <div className="group bg-card rounded-xl border shadow-sm transition-all hover:shadow-md">
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
        <div className="shrink-0 flex items-center justify-between sm:block">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-base shadow-sm">
              {scene.order}
            </div>
            {sceneStart !== null && sceneEnd !== null && (
              <div className="flex flex-col items-center bg-secondary/50 px-2 py-1 rounded-md border border-secondary">
                <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-1">
                  Time
                </span>
                <span className="text-xs font-mono font-bold text-foreground tabular-nums">
                  {sceneStart}s - {sceneEnd}s
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 flex-1">
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-2">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-medium">✨ Prompts generated:</span> The
              prompts for the script, reference image, and video have been
              generated. You can edit them or refine them with your preferred
              instructions.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <ScriptComponent
              sceneId={scene.id}
              initialScript={scene.script || ""}
              initialImagePrompt={scene.imagePrompt || ""}
              initialVideoPrompt={scene.videoPrompt || ""}
            />
          </div>

          {/* Divider between prompts and image section */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

          <div className="space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 mb-2">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                <span className="font-medium">🖼️ About images:</span> Generated
                images are used as a base to create higher quality videos. You
                can directly use the generated prompt or upload a reference
                image from which to generate the image.
              </p>
            </div>
            <ImageComponent
              sceneId={scene.id}
              initialImageUrl={scene.imageUrl || ""}
              enableGeneration={!!enableGeneration}
            />
          </div>
          {scene.imageUrl && (
            <div className="grid grid-cols-1 gap-4">
              <VideoComponent
                sceneId={scene.id}
                sceneDuration={sceneDuration}
                initialVideoUrl={scene.videoUrl || ""}
                referenceImageUrl={scene.imageUrl || ""}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
