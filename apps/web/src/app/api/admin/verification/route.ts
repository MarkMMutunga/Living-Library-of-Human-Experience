import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'requests';

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (type === 'requests') {
      // Return mock verification requests
      const mockRequests = [
        {
          id: '1',
          userId: 'user_123',
          userName: 'Dr. Sarah Chen',
          userEmail: 'sarah.chen@email.com',
          verificationType: 'expertise',
          submittedDocuments: ['medical_license.pdf', 'cv.pdf'],
          personalStatement: 'I am a practicing psychiatrist with 15 years of experience specializing in trauma recovery...',
          endorsements: 8,
          communityVotes: { positive: 24, negative: 2 },
          aiCredibilityScore: 0.94,
          status: 'pending',
          submittedAt: '2025-08-15T14:30:00Z'
        },
        {
          id: '2',
          userId: 'user_456',
          userName: 'Mark Thompson',
          userEmail: 'mark.t@email.com',
          verificationType: 'experience',
          submittedDocuments: ['testimonial.pdf'],
          personalStatement: 'I have lived experience with addiction recovery and have been sober for 8 years...',
          endorsements: 12,
          communityVotes: { positive: 45, negative: 1 },
          aiCredibilityScore: 0.87,
          status: 'under-review',
          submittedAt: '2025-08-14T09:15:00Z'
        }
      ];

      return NextResponse.json({ requests: mockRequests });
    } else {
      // Return mock trust metrics
      const mockMetrics = [
        {
          userId: 'user_789',
          userName: 'Alex Rivera',
          trustScore: 0.92,
          verificationLevel: 'verified',
          contributionCount: 34,
          positiveRatings: 128,
          communityReports: 0,
          accountAge: 245,
          lastActivity: '2025-08-17T08:30:00Z'
        },
        {
          userId: 'user_101',
          userName: 'Jamie Wilson',
          trustScore: 0.67,
          verificationLevel: 'basic',
          contributionCount: 8,
          positiveRatings: 23,
          communityReports: 1,
          accountAge: 45,
          lastActivity: '2025-08-16T15:45:00Z'
        }
      ];

      return NextResponse.json({ metrics: mockMetrics });
    }
  } catch (error) {
    console.error('Error in verification API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const { requestId, action, notes } = await request.json();

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, just log the action
    // In production, this would update the verification_requests table
    console.log(`Verification action: ${action} for request ${requestId} with notes: ${notes}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in verification API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
