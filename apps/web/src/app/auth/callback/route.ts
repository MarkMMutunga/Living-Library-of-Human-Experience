import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check if user exists in our app_user table
      const { data: existingUser, error: userError } = await supabase
        .from('app_user')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (userError && userError.code === 'PGRST116') {
        // User doesn't exist, create them
        const { error: insertError } = await supabase
          .from('app_user')
          .insert({
            id: data.user.id,
            email: data.user.email!,
          })

        if (insertError) {
          console.error('Failed to create user:', insertError)
        } else {
          // Create default consent record
          await supabase
            .from('consent')
            .insert({
              user_id: data.user.id,
              share_for_research: false,
              allow_model_training: false,
              receive_study_invites: false,
            })
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Auth failed, redirect to login with error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
