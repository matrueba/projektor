import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Plus, Settings, LogOut } from "lucide-react"
import { cookies } from "next/headers"
import { signOutAction } from "@/app/actions"
import { ProjectCard } from "@/components/project-card"

export default async function Dashboard() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b h-16 flex items-center px-6 justify-between">
        <h1 className="font-bold text-xl">Kreator Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
          <form action={signOutAction}>
            <Button variant="ghost" size="icon">
              <LogOut className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </header>

      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">My Projects</h2>
          <Link href="/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </Link>
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
