import { CreateProjectForm } from '@/components/create-project-form'

export default function NewProjectPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b h-16 flex items-center px-6">
        <h1 className="font-bold text-xl">New Project</h1>
      </header>
      <main className="flex-1 p-8">
        <CreateProjectForm />
      </main>
    </div>
  )
}
