'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { generateVideosForProject } from "@/app/actions"

export function GenerateVideosButton({ projectId }: { projectId: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleClick = async () => {
        setIsLoading(true)
        try {
            const result = await generateVideosForProject(projectId)
            if (result && (result as any).error) {
                alert("Failed to generate videos: " + (result as any).error)
            } else {
                router.refresh()
            }
        } catch (error) {
            console.error(error)
            alert("An error occurred while generating videos: " + (error as Error).message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button size="sm" onClick={handleClick} disabled={isLoading}>
            {isLoading ? "Generating..." : "Generate Videos"}
        </Button>
    )
}
