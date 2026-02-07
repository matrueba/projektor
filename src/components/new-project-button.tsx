"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { checkComfyUIConnection } from "@/app/actions/comfyui-actions"
import { useToast } from "@/components/ui/toast"

export function NewProjectButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const toast = useToast()

  const handleCreateProject = async () => {
    setIsLoading(true)
    try {
      await checkComfyUIConnection()
      router.push("/new")
    } catch (error) {
      toast.showToast(
        "Connection Error",
        "Failed to connect to ComfyUI. Please check your configuration in Settings.",
        "error",
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleCreateProject} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Plus className="w-4 h-4 mr-2" />
      )}
      New Project
    </Button>
  )
}
