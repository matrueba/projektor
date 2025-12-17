'use client'

import { Edit2, Save, X, RotateCcw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { updateSceneScript } from "@/app/actions"
import { Textarea } from "@/components/ui/textarea"

export function ScriptComponent({ sceneId, initialScript, initialImagePrompt, initialVideoPrompt }: { sceneId: string; initialScript: string, initialImagePrompt: string, initialVideoPrompt: string }) {
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [script, setScript] = useState(initialScript)
    const [imagePrompt, setImagePrompt] = useState(initialImagePrompt)
    const [videoPrompt, setVideoPrompt] = useState(initialVideoPrompt)

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const result = await updateSceneScript(sceneId, script, imagePrompt, videoPrompt)
            if (result.error) {
                alert("Failed to update script: " + result.error)
            } else {
                setIsEditing(false)
            }
        } catch (error) {
            console.error(error)
            alert("An error occurred while updating the script: " + (error as Error).message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        setScript(initialScript)
        setImagePrompt(initialImagePrompt)
        setVideoPrompt(initialVideoPrompt)
        setIsEditing(false)
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">Scene</h3>
                {!isEditing ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsEditing(true)}
                    >
                        <Edit2 className="w-4 h-4" />
                    </Button>
                ) : (
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            <Save className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleCancel}
                            disabled={isSaving}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>

            <div className="space-y-4 mt-2">
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Script</Label>
                    {isEditing ? (
                        <Textarea
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                            className="min-h-[100px]"
                            disabled={isSaving}
                        />
                    ) : (
                        <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap border border-transparent">
                            {script}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Image Prompt</Label>
                    {isEditing ? (
                        <Textarea
                            value={imagePrompt}
                            onChange={(e) => setImagePrompt(e.target.value)}
                            className="min-h-[100px]"
                            disabled={isSaving}
                        />
                    ) : (
                        <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap border border-transparent">
                            {imagePrompt}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Video Prompt</Label>
                    {isEditing ? (
                        <Textarea
                            value={videoPrompt}
                            onChange={(e) => setVideoPrompt(e.target.value)}
                            className="min-h-[100px]"
                            disabled={isSaving}
                        />
                    ) : (
                        <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap border border-transparent">
                            {videoPrompt}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex gap-2 mt-4">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => { }}
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
            </div>
        </div>
    )
}