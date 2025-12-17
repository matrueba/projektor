'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { generateImagesForProject } from "@/app/actions"

export function GenerateImagesButton({ projectId }: { projectId: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleClick = async () => {
        setIsLoading(true)
        try {
            const result = await generateImagesForProject(projectId)
            if (result && (result as any).error) {
                alert("Failed to generate images: " + (result as any).error)
            } else {
                router.refresh()
            }
        } catch (error) {
            console.error(error)
            alert("An error occurred while generating images: " + (error as Error).message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button size="sm" onClick={handleClick} disabled={isLoading}>
            {isLoading ? "Generating..." : "Generate Images"}
        </Button>
    )
}
