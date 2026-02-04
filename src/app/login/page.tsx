import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/db"

export default async function LoginPage() {
  // In local mode, auto-redirect to dashboard
  const user = getCurrentUser()

  if (user) {
    redirect("/dashboard")
  }

  // Fallback - should not reach here in local mode
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full text-center items-center font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold mb-8">Projektor</h1>
      </div>

      <div className="flex flex-col items-center gap-4">
        <p className="text-xl mb-4">AI Video Generation Platform</p>
        <p className="text-muted-foreground">Local Mode - No login required</p>
      </div>
    </main>
  )
}
