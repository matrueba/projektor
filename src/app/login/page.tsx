import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import GoogleSignInButton from "@/components/google-signin-button"

export default async function LoginPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full text-center items-center font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold mb-8">Projektor</h1>
      </div>
      
      <div className="flex flex-col items-center gap-4">
        <p className="text-xl mb-4">AI Video Generation Platform</p>
        
        <GoogleSignInButton />
      </div>
    </main>
  )
}
