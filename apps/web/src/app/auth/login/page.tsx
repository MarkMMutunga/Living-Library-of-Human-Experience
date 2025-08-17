import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth/auth-form'

export default async function LoginPage() {
  const supabase = createClient()
  
  // Check if user is already authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome to LLHE
          </h1>
          <p className="text-muted-foreground">
            Sign in to access your personal library of experiences
          </p>
        </div>
        
        <AuthForm />
        
        <div className="text-center text-sm text-muted-foreground">
          <p>
            By signing in, you agree to our privacy-first approach. 
            Your data is private by default and you have full control.
          </p>
        </div>
      </div>
    </div>
  )
}
