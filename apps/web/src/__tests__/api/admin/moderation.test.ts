import { GET, PATCH } from '@/app/api/admin/moderation/route';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  }))
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

describe('/api/admin/moderation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/moderation', () => {
    it('should return 401 for unauthenticated users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      const request = new NextRequest('http://localhost:3000/api/admin/moderation');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return moderation items for authenticated users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/admin/moderation');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
    });

    it('should filter items by status', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/admin/moderation?filter=pending');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items.every((item: any) => item.status === 'pending')).toBe(true);
    });

    it('should filter items by high priority', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/admin/moderation?filter=high-priority');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items.every((item: any) => ['high', 'critical'].includes(item.severity))).toBe(true);
    });
  });

  describe('PATCH /api/admin/moderation', () => {
    it('should return 401 for unauthenticated users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      const request = new NextRequest('http://localhost:3000/api/admin/moderation', {
        method: 'PATCH',
        body: JSON.stringify({ id: '1', action: 'approve' })
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should successfully approve moderation item', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/admin/moderation', {
        method: 'PATCH',
        body: JSON.stringify({ 
          id: '1', 
          action: 'approve',
          notes: 'Content is appropriate'
        })
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should successfully reject moderation item', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/admin/moderation', {
        method: 'PATCH',
        body: JSON.stringify({ 
          id: '1', 
          action: 'reject',
          notes: 'Content violates guidelines'
        })
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
