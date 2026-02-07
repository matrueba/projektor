"use client"

import { Edit2, Save, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { updateSceneScript, refineScene } from "@/app/actions/project"
import { useToast } from "@/components/ui/toast"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export function ScriptComponent({
    sceneId,
    initialScript,
    initialImagePrompt,
    initialVideoPrompt,
}: {
    sceneId: string
    initialScript: string
    initialImagePrompt: string
    initialVideoPrompt: string
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [script, setScript] = useState(initialScript)
    const [imagePrompt, setImagePrompt] = useState(initialImagePrompt)
    const [videoPrompt, setVideoPrompt] = useState(initialVideoPrompt)
    const [isRefineModalOpen, setIsRefineModalOpen] = useState(false)
    const [refinementText, setRefinementText] = useState("")
    const [isRefining, setIsRefining] = useState(false)
    const toast = useToast()

    const handleRefineScene = async () => {
        if (!refinementText.trim()) {
            toast.showToast(
                "Warning",
                "Please enter refinement instructions",
                "warning",
            )
            return
        }
        setIsRefining(true)
        try {
            const result = await refineScene(sceneId, refinementText)
            if (result.error) {
                toast.showToast(
                    "Error",
                    "Failed to refine scene: " + result.error,
                    "error",
                )
            } else {
                setIsRefineModalOpen(false)
                setRefinementText("")
                window.location.reload()
            }
        } catch (error) {
            toast.showToast(
                "Error",
                "An error occurred while refining the scene: " +
                (error as Error).message,
                "error",
            )
        } finally {
            setIsRefining(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const result = await updateSceneScript(
                sceneId,
                script,
                imagePrompt,
                videoPrompt,
            )
            if (result.error) {
                toast.showToast(
                    "Error",
                    "Failed to update script: " + result.error,
                    "error",
                )
            } else {
                setIsEditing(false)
            }
        } catch (error) {
            toast.showToast(
                "Error",
                "An error occurred while updating the script: " +
                (error as Error).message,
                "error",
            )
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
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                        Script
                    </Label>
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
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                        Image Prompt
                    </Label>
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
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                        Video Prompt
                    </Label>
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
                    onClick={() => setIsRefineModalOpen(true)}
                >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Refine
                </Button>
            </div>

            {/* Refine Scene Modal */}
            <Dialog open={isRefineModalOpen} onOpenChange={setIsRefineModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Refine Scene</DialogTitle>
                        <DialogDescription>
                            Enter instructions to refine this scene. The model will regenerate
                            the script, image prompt and video prompt based on your
                            instructions.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            value={refinementText}
                            onChange={(e) => setRefinementText(e.target.value)}
                            placeholder="E.g.: Make it more dramatic, add another character, change the background..."
                            className="min-h-[120px]"
                            disabled={isRefining}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsRefineModalOpen(false)
                                setRefinementText("")
                            }}
                            disabled={isRefining}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRefineScene}
                            disabled={isRefining || !refinementText.trim()}
                        >
                            {isRefining ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span>
                                    Refining...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Refine
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
