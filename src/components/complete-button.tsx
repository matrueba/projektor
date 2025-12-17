'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { markProjectAsComplete } from "@/app/actions"

export function CompleteButton({ projectId }: { projectId: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleClick = async () => {
        setIsLoading(true)
        try {
            const result = await markProjectAsComplete(projectId)
            if (result && (result as any).error) {
                alert("Failed to mark as complete: " + (result as any).error)
            } else {
                router.refresh()
            }
        } catch (error) {
            console.error(error)
            alert("An error occurred while marking as complete: " + (error as Error).message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button size="sm" onClick={handleClick} disabled={isLoading}>
            {isLoading ? "Marking..." : "Mark as complete and download"}
        </Button>
    )
}
