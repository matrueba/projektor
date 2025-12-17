'use client'

import { deleteAccount } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>
      
      <div className="border border-destructive/50 rounded-lg p-6 max-w-xl">
        <h2 className="text-xl font-semibold text-destructive mb-4">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Permanently delete your account and all of your content. This action cannot be undone.
        </p>
        
        <Button 
          variant="destructive"
          onClick={async () => {
            if (confirm('Are you sure?')) {
              await deleteAccount()
              router.push('/')
            }
          }}
        >
          Delete Account
        </Button>
      </div>
    </div>
  )
}
