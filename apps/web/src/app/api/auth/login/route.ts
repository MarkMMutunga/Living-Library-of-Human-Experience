/**
 * Living Library of Human Experience - Authentication API
 * 
 * Copyright (c) 2025 Mark Mikile Mutunga
 * Author: Mark Mikile Mutunga <markmiki03@gmail.com>
 * Phone: +254 707 678 643
 * 
 * This file is part of the Living Library of Human Experience platform.
 * Licensed under proprietary license - see LICENSE file for details.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { email } = loginSchema.parse(body)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (error) {
      console.error('Auth error:', error)
      return NextResponse.json({ 
        error: 'Failed to send magic link',
        message: error.message 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Magic link sent successfully' 
    })

  } catch (error) {
    console.error('API error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid email format',
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
