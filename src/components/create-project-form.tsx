"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createProject } from "@/app/actions/project"
import Link from "next/link"
import { X } from "lucide-react"
import { useToast } from "@/components/ui/toast"

export function CreateProjectForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [activeHelp, setActiveHelp] = useState("")
  const toast = useToast()

  const fieldHelp: Record<string, string> = {
    name: "Project name. It will help you identify this video within the application.",
    theme:
      "Describe the main idea of the video so the system can generate a coherent concept.",
    style: "Select the general visual style you want for the video.",
    sceneCount: "Number of scenes the video will have.",
    maxDuration: "Total maximum duration of the video, in seconds.",
    constraints:
      "Elements you want to avoid or limit in the result (e.g., no text on screen).",
  }

  function handleFieldEnter(field: keyof typeof fieldHelp) {
    setActiveHelp(fieldHelp[field])
  }

  function clearHelp() {
    setActiveHelp("")
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const projectName = formData.get("name") as string
    const theme = formData.get("theme") as string
    const style = formData.get("style") as string
    const constraints = formData.get("constraints") as string
    const sceneCount = parseInt(formData.get("sceneCount") as string, 10)
    const maxDuration = parseInt(formData.get("maxDuration") as string, 10)
    const generationMode = "sequential"

    // Validate that each scene doesn't exceed 8 seconds
    const maxSecondsPerScene = 5
    const secondsPerScene = maxDuration / sceneCount
    if (secondsPerScene > maxSecondsPerScene) {
      const toastText = `Each scene cannot exceed ${maxSecondsPerScene} seconds. With ${sceneCount} scenes and ${maxDuration}s duration, each scene would be ${secondsPerScene.toFixed(1)}s. Please reduce the duration or add more scenes.`
      toast.showToast("Error", toastText, "error")
      setIsLoading(false)
      return
    }

    await createProject({
      name: projectName,
      theme,
      style,
      constraints,
      sceneCount,
      maxDuration,
      generationMode,
    })
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative space-y-6 max-w-2xl mx-auto p-6 border rounded-lg shadow-sm"
    >
      <Link
        href="/dashboard"
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        title="Cancelar y volver al dashboard"
      >
        <X className="h-4 w-4" />
      </Link>
      <div className="space-y-2">
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="My Awesome Video Project"
          onFocus={() => handleFieldEnter("name")}
          onBlur={clearHelp}
          onMouseEnter={() => handleFieldEnter("name")}
          onMouseLeave={clearHelp}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme">Video Idea / Theme</Label>
        <Textarea
          id="theme"
          name="theme"
          required
          placeholder="A commercial for a new futuristic running shoe..."
          className="h-32"
          onFocus={() => handleFieldEnter("theme")}
          onBlur={clearHelp}
          onMouseEnter={() => handleFieldEnter("theme")}
          onMouseLeave={clearHelp}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="style">Visual Style</Label>
          <div className="relative">
            <select
              id="style"
              name="style"
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              onFocus={() => handleFieldEnter("style")}
              onBlur={clearHelp}
              onMouseEnter={() => handleFieldEnter("style")}
              onMouseLeave={clearHelp}
            >
              <option value="cinematic">Cinematic</option>
              <option value="animated">Animated / Cartoon</option>
              <option value="realistic">Hyper Realistic</option>
              <option value="cyberpunk">Cyberpunk</option>
              <option value="vintage">Vintage</option>
              <option value="custom">Custom Style</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sceneCount">Number of Scenes</Label>
          <Input
            id="sceneCount"
            name="sceneCount"
            type="number"
            min={1}
            max={10}
            defaultValue={3}
            onFocus={() => handleFieldEnter("sceneCount")}
            onBlur={clearHelp}
            onMouseEnter={() => handleFieldEnter("sceneCount")}
            onMouseLeave={clearHelp}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="maxDuration">Max duration</Label>
          <Input
            id="maxDuration"
            name="maxDuration"
            type="number"
            min={10}
            max={300}
            defaultValue={60}
            onFocus={() => handleFieldEnter("maxDuration")}
            onBlur={clearHelp}
            onMouseEnter={() => handleFieldEnter("maxDuration")}
            onMouseLeave={clearHelp}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="constraints">Constraints / Negative Prompts</Label>
        <Textarea
          id="constraints"
          name="constraints"
          placeholder="No text on screen, no people, etc."
          onFocus={() => handleFieldEnter("constraints")}
          onBlur={clearHelp}
          onMouseEnter={() => handleFieldEnter("constraints")}
          onMouseLeave={clearHelp}
        />
      </div>

      <div className="text-xs text-muted-foreground min-h-[1.5rem]">
        {activeHelp ||
          "Hover over each field or selection to see a description."}
      </div>


      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Generating Concept..." : "Create Project"}
      </Button>
    </form>
  )
}
