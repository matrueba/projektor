'use client'

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export default function GoogleSignInButton() {
  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  return (
    <Button onClick={handleLogin} size="lg">
      Sign in with Google
    </Button>
  )
}
