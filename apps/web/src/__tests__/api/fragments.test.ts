import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/fragments/route'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/ai/factory')

describe('/api/fragments', () => {
  let mockSupabase: any

  beforeEach(() => {
    const { createClient } = require('@/lib/supabase/server')
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        single: jest.fn(),
      })),
    }
    createClient.mockReturnValue(mockSupabase)

    // Mock AI services
    const { getClassificationService } = require('@/lib/ai/factory')
    getClassificationService.mockReturnValue({
      detectPII: jest.fn().mockResolvedValue([]),
    })

    jest.clearAllMocks()
  })

  describe('GET /api/fragments', () => {
    it('should return fragments for authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null,
      })

      const mockFragments = [
        {
          id: 'fragment1',
          title: 'Test Fragment',
          body: 'Test content',
          created_at: new Date().toISOString(),
        },
      ]

      mockSupabase.from().range.mockResolvedValue({
        data: mockFragments,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/fragments?limit=20&offset=0'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.fragments).toEqual(mockFragments)
      expect(data.pagination.limit).toBe(20)
    })

    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/fragments')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should handle search queries', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null,
      })

      mockSupabase.from().range.mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/fragments?q=test&tags=personal&emotions=happy'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockSupabase.from).toHaveBeenCalledWith('fragment')
    })
  })

  describe('POST /api/fragments', () => {
    it('should create fragment with valid data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null,
      })

      const mockFragment = {
        id: 'fragment1',
        title: 'New Fragment',
        body: 'Fragment content',
        user_id: 'user123',
        status: 'PROCESSING',
      }

      mockSupabase.from().single.mockResolvedValue({
        data: mockFragment,
        error: null,
      })

      const fragmentData = {
        title: 'New Fragment',
        body: 'Fragment content',
        eventAt: new Date().toISOString(),
        visibility: 'PRIVATE',
        tags: ['test'],
        media: [],
      }

      const request = new NextRequest('http://localhost:3000/api/fragments', {
        method: 'POST',
        body: JSON.stringify(fragmentData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.fragment).toEqual(mockFragment)
    })

    it('should reject fragments with PII', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null,
      })

      // Mock PII detection
      const { getClassificationService } = require('@/lib/ai/factory')
      getClassificationService.mockReturnValue({
        detectPII: jest.fn().mockResolvedValue([
          { type: 'email', text: 'user@example.com', start: 0, end: 16 },
        ]),
      })

      const fragmentData = {
        title: 'Contact me at user@example.com',
        body: 'Fragment content',
        eventAt: new Date().toISOString(),
        visibility: 'PRIVATE',
        tags: [],
        media: [],
      }

      const request = new NextRequest('http://localhost:3000/api/fragments', {
        method: 'POST',
        body: JSON.stringify(fragmentData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('PII detected in content')
      expect(data.piiDetections).toHaveLength(1)
    })

    it('should validate required fields', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null,
      })

      const invalidData = {
        title: '', // Empty title should fail validation
        body: 'Fragment content',
      }

      const request = new NextRequest('http://localhost:3000/api/fragments', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(400)
    })

    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/fragments', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test', body: 'Test' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })
})
