import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'pending';

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, return mock data since we haven't migrated the database yet
    // In production, this would check user role and fetch from moderation_items table
    const mockItems = [
      {
        id: '1',
        type: 'fragment',
        title: 'Personal Story About Recovery',
        content: 'This story contains potentially sensitive content about addiction recovery...',
        reportedBy: 'user123',
        reportReason: 'Potentially triggering content',
        severity: 'medium',
        status: 'pending',
        createdAt: '2025-08-17T10:30:00Z',
        aiConfidence: 0.75,
        reportCount: 2
      },
      {
        id: '2',
        type: 'comment',
        title: 'Comment on "Life Lessons"',
        content: 'This comment may contain inappropriate language...',
        reportedBy: 'user456',
        reportReason: 'Inappropriate language',
        severity: 'high',
        status: 'pending',
        createdAt: '2025-08-17T09:15:00Z',
        aiConfidence: 0.92,
        reportCount: 5
      }
    ];

    const filteredItems = mockItems.filter(item => 
      filter === 'all' || 
      (filter === 'pending' && item.status === 'pending') ||
      (filter === 'high-priority' && (item.severity === 'high' || item.severity === 'critical'))
    );

    return NextResponse.json({ items: filteredItems });
  } catch (error) {
    console.error('Error in moderation API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const { id, action, notes } = await request.json();

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, just return success
    // In production, this would update the moderation_items table
    console.log(`Moderation action: ${action} for item ${id} with notes: ${notes}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in moderation API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
