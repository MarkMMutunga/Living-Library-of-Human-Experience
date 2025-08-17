import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'my-collections';

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (tab === 'invites') {
      // Return mock collaboration invites
      const mockInvites = [
        {
          id: '1',
          collectionId: '4',
          collectionTitle: 'Mental Health Awareness',
          invitedBy: 'user_789',
          invitedByName: 'Dr. Alex Thompson',
          invitedUser: user.id,
          role: 'contributor',
          status: 'pending',
          sentAt: '2025-08-16T14:30:00Z'
        },
        {
          id: '2',
          collectionId: '5',
          collectionTitle: 'Entrepreneurship Journey',
          invitedBy: 'user_555',
          invitedByName: 'Lisa Park',
          invitedUser: user.id,
          role: 'editor',
          status: 'pending',
          sentAt: '2025-08-15T10:15:00Z'
        }
      ];

      return NextResponse.json({ invites: mockInvites });
    } else {
      // Return mock collections based on tab
      const mockCollections = [
        {
          id: '1',
          title: 'Recovery Stories',
          description: 'A curated collection of inspiring recovery journeys from our community',
          createdBy: user.id,
          creatorName: 'You',
          privacy: 'public',
          fragmentCount: 24,
          collaborators: ['user_456', 'user_789'],
          tags: ['recovery', 'inspiration', 'health'],
          likes: 127,
          views: 1240,
          comments: 45,
          createdAt: '2025-08-10T14:30:00Z',
          updatedAt: '2025-08-16T09:15:00Z',
          canEdit: true
        },
        {
          id: '2',
          title: 'Cultural Heritage Stories',
          description: 'Stories preserving family traditions and cultural memories',
          createdBy: 'user_456',
          creatorName: 'Maria Rodriguez',
          privacy: 'community',
          fragmentCount: 18,
          collaborators: [user.id, 'user_101', 'user_202'],
          tags: ['culture', 'family', 'tradition'],
          likes: 89,
          views: 620,
          comments: 32,
          createdAt: '2025-08-08T11:20:00Z',
          updatedAt: '2025-08-15T16:45:00Z',
          isCollaborator: true,
          canEdit: false
        },
        {
          id: '3',
          title: 'Life Lessons Learned',
          description: 'Wisdom and insights gained through life experiences',
          createdBy: user.id,
          creatorName: 'You',
          privacy: 'private',
          fragmentCount: 12,
          collaborators: [],
          tags: ['wisdom', 'lessons', 'personal'],
          likes: 34,
          views: 156,
          comments: 8,
          createdAt: '2025-08-12T08:00:00Z',
          updatedAt: '2025-08-17T07:30:00Z',
          canEdit: true
        },
        {
          id: '4',
          title: 'Community Wisdom',
          description: 'Shared insights and experiences from our diverse community',
          createdBy: 'user_999',
          creatorName: 'Community Admin',
          privacy: 'public',
          fragmentCount: 56,
          collaborators: ['user_111', 'user_222', 'user_333'],
          tags: ['community', 'wisdom', 'shared'],
          likes: 234,
          views: 2100,
          comments: 78,
          createdAt: '2025-08-05T14:30:00Z',
          updatedAt: '2025-08-16T12:00:00Z',
          canEdit: false
        }
      ];

      // Filter based on tab
      let filteredCollections = mockCollections;
      if (tab === 'my-collections') {
        filteredCollections = mockCollections.filter(c => c.createdBy === user.id);
      } else if (tab === 'shared-with-me') {
        filteredCollections = mockCollections.filter(c => c.isCollaborator);
      } else if (tab === 'public') {
        filteredCollections = mockCollections.filter(c => c.privacy === 'public');
      }

      return NextResponse.json({ collections: filteredCollections });
    }
  } catch (error) {
    console.error('Error in collections API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { title, description, privacy, tags } = await request.json();

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, just return a mock response
    // In production, this would create a new collection in the database
    const newCollection = {
      id: `new_${Date.now()}`,
      title,
      description,
      createdBy: user.id,
      creatorName: 'You',
      privacy,
      tags: tags || [],
      fragmentCount: 0,
      collaborators: [],
      likes: 0,
      views: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      canEdit: true
    };

    return NextResponse.json({ collection: newCollection });
  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const { inviteId, action } = await request.json();

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, just log the action
    // In production, this would update the collection_collaborators table
    console.log(`Collection invite ${action}: ${inviteId} by user ${user.id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error responding to collection invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('id');

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, just log the deletion
    // In production, this would delete the collection from the database
    console.log(`Deleting collection ${collectionId} by user ${user.id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
