import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Settings, HelpCircle } from "lucide-react"
import { ProjectCard } from "@/components/project-card"
import { getProjects } from "@/lib/db"
import { NewProjectButton } from "@/components/new-project-button"

export default async function Dashboard() {
  const projects = await getProjects()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b h-16 flex items-center px-6 justify-between">
        <h1 className="font-bold text-xl">Projektor Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="gap-2">
            <Link href="/help/comfyui">
              <span className="text-sm font-medium">ComfyUI Setup Guide</span>
              <HelpCircle className="w-4 h-4" />
            </Link>
          </Button>
          <Link href="/settings">
            <Button variant="ghost" size="icon" title="Settings">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">My Projects</h2>
          <NewProjectButton />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects?.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}

          {(!projects || projects.length === 0) && (
            <div className="col-span-full text-center py-12 text-muted-foreground border-dashed border-2 rounded-lg">
              No projects yet. Start creating!
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
