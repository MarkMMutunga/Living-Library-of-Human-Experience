import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/login/route'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithOtp: jest.fn(),
    },
  })),
}))

describe('/api/auth/login', () => {
  let mockSupabase: any

  beforeEach(() => {
    const { createClient } = require('@/lib/supabase/server')
    mockSupabase = createClient()
    jest.clearAllMocks()
  })

  it('should send magic link for valid email', async () => {
    mockSupabase.auth.signInWithOtp.mockResolvedValue({ error: null })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Magic link sent successfully')
    expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: {
        shouldCreateUser: true,
        emailRedirectTo: 'http://localhost:3000/auth/callback',
      },
    })
  })

  it('should reject invalid email format', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid email format')
  })

  it('should handle Supabase auth errors', async () => {
    mockSupabase.auth.signInWithOtp.mockResolvedValue({
      error: { message: 'Rate limit exceeded' },
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Failed to send magic link')
    expect(data.message).toBe('Rate limit exceeded')
  })

  it('should handle missing email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid email format')
  })
})
