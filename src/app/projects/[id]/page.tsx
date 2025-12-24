import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Palette, CircleDot } from "lucide-react"
import { cookies } from "next/headers"
import BatchView from "./batch"
import SequentialView from "./sequential"


export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  const { data: scenes } = await supabase
    .from('scenes')
    .select('*')
    .eq('projectId', id)
    .order('order', { ascending: true })

  if (!project) {
    return <div>Project not found</div>
  }

  let status = project.status || 'draft'
  let generationMode = project.generationMode || 'batch'
  const statusDescription = status === 'draft' ? 'Draft - Not started' :
    status === 'script' ? 'Script Generated - Waiting for image generation' :
      status === 'image' ? 'Images Generated - Waiting for video generation' :
        status === 'video' ? 'Video Generated - Ready to download' :
          status === 'completed' ? 'Completed - All tasks finished' :
            'failed';



  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 space-y-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>

          <div className="border-b pb-8">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">{project.name}</h1>
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50">
                <Palette className="w-4 h-4" />
                <span className="font-medium text-foreground">{project.style}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50">
                <CircleDot className="w-4 h-4" />
                <span className="font-medium text-foreground capitalize">{statusDescription}</span>
              </div>
            </div>
            {project.theme && (
              <div className="mt-3 text-sm text-muted-foreground">
                Theme: <span className="font-medium text-foreground">{project.theme}</span>
              </div>
            )}
          </div>
        </div>
        {generationMode === 'batch' && scenes && <BatchView status={status} scenes={scenes} project={project} />}
        {generationMode === 'sequential' && scenes && <SequentialView status={status} scenes={scenes} project={project} />}
      </div>
    </div>
  )
}
