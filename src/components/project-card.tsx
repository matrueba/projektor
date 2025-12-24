"use client"

import Link from "next/link"
import { Trash2 } from "lucide-react"
import { useTransition, useState } from "react"
import { Button } from "@/components/ui/button"
import { deleteProject } from "@/app/actions"
import { cn } from "@/lib/utils"

interface ProjectCardProps {
  project: {
    id: string
    name: string
    theme: string | null
    status: string | null
    createdAt: string
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)

  const onConfirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    startTransition(async () => {
      const result = await deleteProject(project.id)
      if (result.success) {
        setIsOpen(false)
      }
    })
  }

  return (
    <div className="relative group block h-full">
      <Link href={`/projects/${project.id}`} className="block h-full">
        <div className="border rounded-lg p-6 hover:border-primary transition-colors h-full flex flex-col bg-card text-card-foreground shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg truncate pr-8">{project.name}</h3>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
            {project.theme || "No theme"}
          </p>
          <div className="mt-auto flex items-center justify-between text-xs">
            <span className={cn(
              "px-2 py-1 rounded-full",
              project.status === 'completed' ? 'bg-green-100 text-green-800' :
                project.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
            )}>
              {project.status || 'draft'}
            </span>
            <span className="text-muted-foreground">
              {new Date(project.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Link>

      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          variant="destructive"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsOpen(true)
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsOpen(false)
          }}
        >
          <div
            className="bg-background border p-6 rounded-lg shadow-lg max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-2">Are you absolutely sure?</h2>
            <p className="text-muted-foreground mb-6">
              This action cannot be undone. This will permanently delete the project
              "{project.name}" and all generated content.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={onConfirmDelete}
                disabled={isPending}
              >
                {isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
