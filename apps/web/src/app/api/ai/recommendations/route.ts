import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RecommendationRequest {
  userId?: string;
  fragmentId?: string;
  themes?: string[];
  count?: number;
  type: 'similar' | 'related' | 'discover' | 'trending';
}

interface Recommendation {
  fragmentId: string;
  title: string;
  content: string;
  author: string;
  themes: string[];
  similarity: number;
  reason: string;
  engagementScore: number;
  createdAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body: RecommendationRequest = await request.json();
    const { type, fragmentId, themes, count = 10 } = body;

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let recommendations: Recommendation[] = [];

    switch (type) {
      case 'similar':
        recommendations = await getSimilarStories(supabase, fragmentId!, count);
        break;
      case 'related':
        recommendations = await getRelatedStories(supabase, themes!, count);
        break;
      case 'discover':
        recommendations = await getDiscoveryRecommendations(supabase, user.id, count);
        break;
      case 'trending':
        recommendations = await getTrendingStories(supabase, count);
        break;
      default:
        return NextResponse.json({ error: 'Invalid recommendation type' }, { status: 400 });
    }

    // Add personalization based on user preferences and history
    const personalizedRecommendations = await personalizeRecommendations(
      supabase, 
      user.id, 
      recommendations
    );

    return NextResponse.json({ 
      recommendations: personalizedRecommendations,
      type,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in recommendations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's recommendation history and preferences
    const userProfile = await getUserRecommendationProfile(supabase, user.id);
    
    // Generate comprehensive recommendations
    const [similar, discover, trending] = await Promise.all([
      getSimilarStories(supabase, userProfile.lastReadFragment, 5),
      getDiscoveryRecommendations(supabase, user.id, 5),
      getTrendingStories(supabase, 5)
    ]);

    return NextResponse.json({
      profile: userProfile,
      recommendations: {
        similar,
        discover,
        trending
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting user recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getSimilarStories(
  supabase: any, 
  fragmentId: string, 
  count: number
): Promise<Recommendation[]> {
  // In production, this would use vector similarity search
  // For now, we'll simulate with mock data
  
  const mockRecommendations: Recommendation[] = [
    {
      fragmentId: 'frag_001',
      title: 'Finding Strength in Adversity',
      content: 'A story about overcoming life\'s greatest challenges...',
      author: 'Sarah Chen',
      themes: ['Resilience', 'Personal Growth', 'Hope'],
      similarity: 0.92,
      reason: 'Similar themes of resilience and personal transformation',
      engagementScore: 4.7,
      createdAt: '2025-08-15T10:30:00Z'
    },
    {
      fragmentId: 'frag_002',
      title: 'The Journey Home',
      content: 'Reflections on family, belonging, and identity...',
      author: 'Maria Rodriguez',
      themes: ['Family', 'Identity', 'Belonging'],
      similarity: 0.87,
      reason: 'Shared emotional journey and family dynamics',
      engagementScore: 4.5,
      createdAt: '2025-08-14T15:45:00Z'
    },
    {
      fragmentId: 'frag_003',
      title: 'Lessons from My Grandmother',
      content: 'Wisdom passed down through generations...',
      author: 'James Wilson',
      themes: ['Wisdom', 'Family', 'Tradition'],
      similarity: 0.84,
      reason: 'Similar storytelling style and generational insights',
      engagementScore: 4.8,
      createdAt: '2025-08-13T09:20:00Z'
    }
  ];

  return mockRecommendations.slice(0, count);
}

async function getRelatedStories(
  supabase: any, 
  themes: string[], 
  count: number
): Promise<Recommendation[]> {
  // Mock implementation - in production, query by themes
  const mockRecommendations: Recommendation[] = [
    {
      fragmentId: 'frag_004',
      title: 'Breaking Free from Fear',
      content: 'How I learned to embrace uncertainty and take risks...',
      author: 'Alex Thompson',
      themes: ['Courage', 'Growth', 'Fear'],
      similarity: 0.89,
      reason: `Related to your interest in: ${themes.join(', ')}`,
      engagementScore: 4.6,
      createdAt: '2025-08-16T11:15:00Z'
    },
    {
      fragmentId: 'frag_005',
      title: 'The Art of Letting Go',
      content: 'Finding peace through acceptance and release...',
      author: 'Linda Park',
      themes: ['Healing', 'Acceptance', 'Peace'],
      similarity: 0.86,
      reason: `Explores similar themes: ${themes.slice(0, 2).join(', ')}`,
      engagementScore: 4.4,
      createdAt: '2025-08-12T14:30:00Z'
    }
  ];

  return mockRecommendations.slice(0, count);
}

async function getDiscoveryRecommendations(
  supabase: any, 
  userId: string, 
  count: number
): Promise<Recommendation[]> {
  // Mock implementation - in production, analyze user patterns
  const mockRecommendations: Recommendation[] = [
    {
      fragmentId: 'frag_006',
      title: 'Dancing with Uncertainty',
      content: 'Learning to find joy in the unknown...',
      author: 'Rachel Kim',
      themes: ['Adventure', 'Uncertainty', 'Joy'],
      similarity: 0.75,
      reason: 'Discover new perspectives outside your usual reading',
      engagementScore: 4.3,
      createdAt: '2025-08-17T08:45:00Z'
    },
    {
      fragmentId: 'frag_007',
      title: 'The Language of Dreams',
      content: 'How dreams shaped my understanding of creativity...',
      author: 'David Martinez',
      themes: ['Creativity', 'Dreams', 'Inspiration'],
      similarity: 0.72,
      reason: 'Expand your horizons with creative storytelling',
      engagementScore: 4.1,
      createdAt: '2025-08-11T16:20:00Z'
    }
  ];

  return mockRecommendations.slice(0, count);
}

async function getTrendingStories(
  supabase: any, 
  count: number
): Promise<Recommendation[]> {
  // Mock implementation - in production, analyze engagement metrics
  const mockRecommendations: Recommendation[] = [
    {
      fragmentId: 'frag_008',
      title: 'The Digital Detox Experiment',
      content: 'What I learned from 30 days without social media...',
      author: 'Emily Zhang',
      themes: ['Technology', 'Mindfulness', 'Modern Life'],
      similarity: 0.68,
      reason: 'Trending: High engagement from the community',
      engagementScore: 4.9,
      createdAt: '2025-08-16T20:10:00Z'
    },
    {
      fragmentId: 'frag_009',
      title: 'Building Bridges Across Generations',
      content: 'Connecting with my teenage daughter in the digital age...',
      author: 'Michael Brown',
      themes: ['Parenting', 'Generation Gap', 'Communication'],
      similarity: 0.71,
      reason: 'Popular: Resonating with many parents today',
      engagementScore: 4.7,
      createdAt: '2025-08-15T12:55:00Z'
    }
  ];

  return mockRecommendations.slice(0, count);
}

async function personalizeRecommendations(
  supabase: any,
  userId: string,
  recommendations: Recommendation[]
): Promise<Recommendation[]> {
  // Mock personalization - in production, use ML model
  // Adjust scores based on user preferences, reading history, etc.
  
  return recommendations.map(rec => ({
    ...rec,
    // Add small random personalization boost
    similarity: Math.min(1, rec.similarity + (Math.random() * 0.1 - 0.05)),
    reason: `${rec.reason} • Personalized for you`
  })).sort((a, b) => b.similarity - a.similarity);
}

async function getUserRecommendationProfile(supabase: any, userId: string) {
  // Mock user profile - in production, analyze user behavior
  return {
    userId,
    preferredThemes: ['Personal Growth', 'Family', 'Resilience'],
    readingPatterns: {
      timeOfDay: 'evening',
      avgReadTime: '8 minutes',
      preferredLength: 'medium'
    },
    engagementHistory: {
      totalReads: 45,
      avgRating: 4.3,
      favoriteAuthors: ['Sarah Chen', 'Maria Rodriguez']
    },
    lastReadFragment: 'frag_recent_001',
    recommendationAccuracy: 0.78,
    lastUpdated: new Date().toISOString()
  };
}
