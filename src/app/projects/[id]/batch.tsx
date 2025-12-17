
import { Layers } from "lucide-react"
import { SceneCard } from "@/components/scene-card"
import { GenerateImagesButton } from "@/components/generate-images-button"
import { GenerateVideosButton } from "@/components/generate-videos-button"
import { CompleteButton } from "@/components/complete-button"
import { Scene } from "@/types"
import { Project } from "@/types"



export default async function BatchView({ status, scenes, project }: { status: string, scenes: Scene[], project: Project }) {

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Scenes
                </h2>
                <span className="text-sm text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-md font-medium">
                    {scenes?.length || 0} total
                </span>
            </div>
            <div className="flex items-center gap-4">
                {status === 'script' && (
                    <GenerateImagesButton projectId={project.id} />
                )}
                {status === 'image' && (
                    <GenerateVideosButton projectId={project.id} />
                )}
                {status === 'completed' && (
                    <CompleteButton projectId={project.id} />
                )}
            </div>
            <div className="grid gap-6">
                {scenes?.map((scene) => (
                    <SceneCard key={scene.id} scene={scene} />
                ))}
            </div>
        </div>

    )
}
