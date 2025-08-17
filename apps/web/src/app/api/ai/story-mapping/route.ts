import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface StoryMap {
  id: string;
  fragmentId: string;
  themes: string[];
  emotions: string[];
  timeContext: {
    period: string;
    era: string;
    significance: string;
  };
  relationships: {
    people: string[];
    places: string[];
    events: string[];
  };
  insights: {
    lessons: string[];
    wisdom: string[];
    patterns: string[];
  };
  aiConfidence: number;
  generatedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const fragmentId = searchParams.get('fragmentId');

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (fragmentId) {
      // Get specific story map
      const storyMap = await generateStoryMap(fragmentId);
      return NextResponse.json({ storyMap });
    } else {
      // Get user's story maps
      const { data: fragments } = await supabase
        .from('fragment')
        .select('id, title, content')
        .eq('created_by', user.id)
        .eq('status', 'active');

      // Generate story maps for user's fragments (mock implementation)
      const storyMaps = await Promise.all(
        (fragments || []).slice(0, 10).map(async (fragment) => {
          return await generateStoryMap(fragment.id, fragment.content);
        })
      );

      return NextResponse.json({ storyMaps });
    }
  } catch (error) {
    console.error('Error in story mapping API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { fragmentId, regenerate } = await request.json();

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns the fragment
    const { data: fragment } = await supabase
      .from('fragment')
      .select('content')
      .eq('id', fragmentId)
      .eq('created_by', user.id)
      .single();

    if (!fragment) {
      return NextResponse.json({ error: 'Fragment not found' }, { status: 404 });
    }

    // Generate new story map
    const storyMap = await generateStoryMap(fragmentId, fragment.content);

    // In production, save to database
    // await saveStoryMap(storyMap);

    return NextResponse.json({ storyMap });
  } catch (error) {
    console.error('Error generating story map:', error);
    return NextResponse.json({ error: 'Failed to generate story map' }, { status: 500 });
  }
}

async function generateStoryMap(fragmentId: string, content?: string): Promise<StoryMap> {
  // Simulate AI analysis - in production, this would call OpenAI/Claude
  const mockAnalysis = analyzeContent(content || '');

  return {
    id: `map_${fragmentId}_${Date.now()}`,
    fragmentId,
    themes: mockAnalysis.themes,
    emotions: mockAnalysis.emotions,
    timeContext: mockAnalysis.timeContext,
    relationships: mockAnalysis.relationships,
    insights: mockAnalysis.insights,
    aiConfidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
    generatedAt: new Date().toISOString()
  };
}

function analyzeContent(content: string): any {
  // Mock AI analysis - in production, replace with actual AI service calls
  const themes = [
    'Personal Growth', 'Resilience', 'Family Bonds', 'Career Journey', 
    'Love & Relationships', 'Loss & Grief', 'Achievement', 'Learning',
    'Adventure', 'Healing', 'Discovery', 'Transformation'
  ];
  
  const emotions = [
    'Joy', 'Sadness', 'Fear', 'Anger', 'Surprise', 'Anticipation',
    'Trust', 'Hope', 'Gratitude', 'Pride', 'Nostalgia', 'Wonder'
  ];

  const timePeriods = [
    'Childhood', 'Adolescence', 'Young Adulthood', 'Middle Age', 
    'Golden Years', 'Early Career', 'Retirement', 'Student Years'
  ];

  const eras = [
    '1950s-1960s', '1970s-1980s', '1990s-2000s', '2010s-2020s', 
    'Pre-Internet Era', 'Digital Age', 'Social Media Era', 'Post-Pandemic'
  ];

  // Simple keyword-based analysis (in production, use sophisticated NLP)
  const selectedThemes = themes
    .filter(() => Math.random() > 0.7)
    .slice(0, Math.floor(Math.random() * 3) + 2);

  const selectedEmotions = emotions
    .filter(() => Math.random() > 0.6)
    .slice(0, Math.floor(Math.random() * 4) + 2);

  return {
    themes: selectedThemes,
    emotions: selectedEmotions,
    timeContext: {
      period: timePeriods[Math.floor(Math.random() * timePeriods.length)],
      era: eras[Math.floor(Math.random() * eras.length)],
      significance: generateSignificance(selectedThemes[0])
    },
    relationships: {
      people: generateRelatedPeople(),
      places: generateRelatedPlaces(),
      events: generateRelatedEvents()
    },
    insights: {
      lessons: generateLessons(selectedThemes),
      wisdom: generateWisdom(selectedEmotions),
      patterns: generatePatterns()
    }
  };
}

function generateSignificance(theme: string): string {
  const significances = {
    'Personal Growth': 'A pivotal moment in personal development and self-discovery',
    'Resilience': 'Demonstrates human capacity to overcome adversity',
    'Family Bonds': 'Highlights the enduring power of family connections',
    'Career Journey': 'Marks an important milestone in professional development',
    'Love & Relationships': 'Captures the essence of human connection and intimacy',
    'Loss & Grief': 'Explores the profound impact of loss on personal growth'
  };
  
  return significances[theme as keyof typeof significances] || 'A meaningful life experience with lasting impact';
}

function generateRelatedPeople(): string[] {
  const roles = ['Parent', 'Sibling', 'Friend', 'Mentor', 'Colleague', 'Partner', 'Child', 'Teacher'];
  return roles.filter(() => Math.random() > 0.6).slice(0, 3);
}

function generateRelatedPlaces(): string[] {
  const places = ['Home', 'School', 'Workplace', 'Hospital', 'Park', 'Church', 'Community Center', 'Beach'];
  return places.filter(() => Math.random() > 0.7).slice(0, 2);
}

function generateRelatedEvents(): string[] {
  const events = ['Graduation', 'Wedding', 'Birth', 'Funeral', 'Promotion', 'Move', 'Celebration', 'Crisis'];
  return events.filter(() => Math.random() > 0.8).slice(0, 2);
}

function generateLessons(themes: string[]): string[] {
  const lessons = [
    'Every challenge is an opportunity for growth',
    'The importance of perseverance in difficult times',
    'How relationships shape our understanding of ourselves',
    'The value of taking calculated risks',
    'Learning to find joy in simple moments',
    'The power of vulnerability in building connections'
  ];
  
  return lessons.filter(() => Math.random() > 0.5).slice(0, 3);
}

function generateWisdom(emotions: string[]): string[] {
  const wisdom = [
    'Emotions are temporary but memories last forever',
    'Authentic connections require courage and openness',
    'Growth often comes from our most difficult experiences',
    'The present moment is all we truly have',
    'Compassion for others begins with self-compassion',
    'Every ending creates space for new beginnings'
  ];
  
  return wisdom.filter(() => Math.random() > 0.6).slice(0, 2);
}

function generatePatterns(): string[] {
  const patterns = [
    'Recurring theme of overcoming obstacles through determination',
    'Pattern of finding strength through community support',
    'Tendency to discover personal values during times of change',
    'Consistent growth through embracing uncertainty',
    'Pattern of learning through reflection and introspection'
  ];
  
  return patterns.filter(() => Math.random() > 0.7).slice(0, 2);
}
