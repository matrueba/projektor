'use client'

import { useState, useEffect } from "react"
import { Layers, ChevronLeft, ChevronRight, PlayCircle, Image as ImageIcon, FileText } from "lucide-react"
import { SceneCard } from "@/components/scene-card"
import { Scene } from "@/types"
import { Project } from "@/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function SequentialView({ scenes, project }: { scenes: Scene[], project: Project, status?: string }) {
    const [activeSceneIndex, setActiveSceneIndex] = useState(0)

    const activeScene = scenes?.[activeSceneIndex]

    const handleNext = () => {
        if (activeSceneIndex < (scenes?.length || 0) - 1) {
            setActiveSceneIndex(prev => prev + 1)
        }
    }

    const handlePrev = () => {
        if (activeSceneIndex > 0) {
            setActiveSceneIndex(prev => prev - 1)
        }
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                handlePrev()
            } else if (e.key === 'ArrowRight') {
                handleNext()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [activeSceneIndex, scenes])

    if (!scenes || scenes.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                    <Layers className="w-8 h-8 opacity-50" />
                    <p>No scenes available.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Sequential Mode
                </h2>
                <span className="text-sm text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-md font-medium">
                    Scene {activeSceneIndex + 1} of {scenes.length}
                </span>
            </div>
            
            {/* Scene Selector Carousel */}
            <div className="space-y-4 bg-secondary/20 p-4 rounded-xl border">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent">
                    {scenes.map((scene, index) => {
                        const isActive = activeSceneIndex === index
                        const isCompleted = !!scene.video_url
                        const hasImage = !!scene.image_url
                        
                        return (
                            <button
                                key={scene.id}
                                onClick={() => setActiveSceneIndex(index)}
                                className={cn(
                                    "flex flex-col items-center justify-center min-w-[80px] h-20 rounded-lg border transition-all duration-200 relative group shrink-0",
                                    isActive 
                                        ? "border-primary bg-primary/10 shadow-sm" 
                                        : "border-transparent bg-background hover:bg-accent hover:border-border"
                                )}
                            >
                                <span className={cn(
                                    "text-[10px] font-bold uppercase mb-1 tracking-wider",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                )}>
                                    Scene
                                </span>
                                <span className={cn(
                                    "text-xl font-bold",
                                    isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                )}>
                                    {index + 1}
                                </span>
                                
                                <div className="absolute top-1 right-1 flex gap-0.5">
                                    {hasImage && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Image generated" />}
                                    {isCompleted && <div className="w-1.5 h-1.5 rounded-full bg-green-500" title="Video generated" />}
                                </div>
                                
                                {isActive && (
                                    <div className="absolute -bottom-1 w-8 h-1 rounded-t-full bg-primary" />
                                )}
                            </button>
                        )
                    })}
                </div>

                <div className="flex items-center justify-between pt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePrev}
                        disabled={activeSceneIndex === 0}
                        className="w-28"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Previous
                    </Button>
                    
                    <div className="text-xs text-muted-foreground hidden sm:block">
                        navigate with arrow keys
                    </div>
                    
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleNext}
                        disabled={activeSceneIndex === scenes.length - 1}
                        className="w-28"
                    >
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>

            <div className="relative min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeScene && (
                    <SceneCard 
                        key={activeScene.id} 
                        scene={activeScene} 
                        enableGeneration={true} 
                    />
                )}
            </div>
        </div>
    )
}
