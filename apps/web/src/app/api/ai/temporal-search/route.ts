import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface TemporalSearchRequest {
  query?: string;
  timeFrame?: {
    start?: string; // ISO date
    end?: string; // ISO date
    era?: 'childhood' | 'youth' | 'adulthood' | 'recent' | 'custom';
    period?: 'decade' | 'year' | 'season' | 'month';
  };
  filters?: {
    themes?: string[];
    emotions?: string[];
    ageRange?: { min: number; max: number };
    location?: string;
  };
  userId?: string;
  sortBy?: 'chronological' | 'relevance' | 'emotional_intensity' | 'significance';
  limit?: number;
}

interface TemporalFragment {
  id: string;
  title: string;
  content: string;
  author: string;
  timeContext: {
    originalDate?: string;
    estimatedAge?: number;
    lifePeriod: string;
    seasonality?: string;
    significance: number;
  };
  themes: string[];
  emotions: string[];
  location?: string;
  connections: {
    relatedFragments: string[];
    timelinePosition: number;
    narrativeArc: string;
  };
  metadata: {
    createdAt: string;
    lastModified: string;
    engagementScore: number;
    temporalRelevance: number;
  };
}

interface TimelineView {
  totalFragments: number;
  timeSpan: {
    earliest: string;
    latest: string;
    duration: string;
  };
  periods: {
    name: string;
    startDate: string;
    endDate: string;
    fragmentCount: number;
    keyThemes: string[];
    emotionalTone: string;
  }[];
  fragments: TemporalFragment[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body: TemporalSearchRequest = await request.json();
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchResults = await performTemporalSearch(supabase, user.id, body);
    const timelineView = await generateTimelineView(searchResults, body);

    return NextResponse.json({
      results: searchResults,
      timeline: timelineView,
      searchParams: body,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in temporal search:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = searchParams.get('userId') || user.id;
    const era = searchParams.get('era') as 'childhood' | 'youth' | 'adulthood' | 'recent';
    const period = searchParams.get('period') as 'decade' | 'year' | 'season' | 'month';

    // Generate user's complete temporal narrative
    const userTimeline = await generateUserTimeline(supabase, userId);
    const eraOverview = era ? await getEraOverview(supabase, userId, era) : null;
    const periodicBreakdown = period ? await getPeriodicBreakdown(supabase, userId, period) : null;

    return NextResponse.json({
      timeline: userTimeline,
      eraOverview,
      periodicBreakdown,
      insights: await generateTemporalInsights(supabase, userId),
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting temporal overview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function performTemporalSearch(
  supabase: any,
  userId: string,
  searchParams: TemporalSearchRequest
): Promise<TemporalFragment[]> {
  // Mock implementation - in production, this would query the database with temporal indexing
  const mockFragments: TemporalFragment[] = [
    {
      id: 'temp_001',
      title: 'First Day of School',
      content: 'I remember walking into that big classroom, my small hand clutching my mother\'s...',
      author: 'Current User',
      timeContext: {
        originalDate: '1995-09-05',
        estimatedAge: 6,
        lifePeriod: 'childhood',
        seasonality: 'autumn',
        significance: 8.5
      },
      themes: ['Education', 'Growing Up', 'Independence'],
      emotions: ['Nervousness', 'Excitement', 'Pride'],
      location: 'Elementary School, Springfield',
      connections: {
        relatedFragments: ['temp_002', 'temp_015'],
        timelinePosition: 0.1,
        narrativeArc: 'educational_journey'
      },
      metadata: {
        createdAt: '2025-08-15T10:30:00Z',
        lastModified: '2025-08-15T10:30:00Z',
        engagementScore: 4.2,
        temporalRelevance: 0.92
      }
    },
    {
      id: 'temp_002',
      title: 'High School Graduation',
      content: 'Throwing our caps in the air, we thought we were ready for anything...',
      author: 'Current User',
      timeContext: {
        originalDate: '2007-06-15',
        estimatedAge: 18,
        lifePeriod: 'youth',
        seasonality: 'summer',
        significance: 9.2
      },
      themes: ['Achievement', 'Transition', 'Friendship'],
      emotions: ['Joy', 'Anticipation', 'Nostalgia'],
      location: 'Springfield High School',
      connections: {
        relatedFragments: ['temp_001', 'temp_003'],
        timelinePosition: 0.3,
        narrativeArc: 'educational_journey'
      },
      metadata: {
        createdAt: '2025-08-14T15:45:00Z',
        lastModified: '2025-08-14T15:45:00Z',
        engagementScore: 4.8,
        temporalRelevance: 0.95
      }
    },
    {
      id: 'temp_003',
      title: 'My First Job Interview',
      content: 'Nervous sweats and a too-tight tie, but I was determined to make my mark...',
      author: 'Current User',
      timeContext: {
        originalDate: '2011-03-22',
        estimatedAge: 22,
        lifePeriod: 'early_adulthood',
        seasonality: 'spring',
        significance: 7.8
      },
      themes: ['Career', 'Ambition', 'Growth'],
      emotions: ['Anxiety', 'Determination', 'Hope'],
      location: 'Downtown Office Building',
      connections: {
        relatedFragments: ['temp_002', 'temp_004'],
        timelinePosition: 0.45,
        narrativeArc: 'professional_journey'
      },
      metadata: {
        createdAt: '2025-08-13T09:20:00Z',
        lastModified: '2025-08-13T09:20:00Z',
        engagementScore: 4.1,
        temporalRelevance: 0.87
      }
    },
    {
      id: 'temp_004',
      title: 'Becoming a Parent',
      content: 'Holding my daughter for the first time, everything else faded away...',
      author: 'Current User',
      timeContext: {
        originalDate: '2018-11-28',
        estimatedAge: 29,
        lifePeriod: 'adulthood',
        seasonality: 'late_autumn',
        significance: 10.0
      },
      themes: ['Family', 'Love', 'Responsibility'],
      emotions: ['Love', 'Wonder', 'Overwhelm'],
      location: 'St. Mary\'s Hospital',
      connections: {
        relatedFragments: ['temp_003', 'temp_005'],
        timelinePosition: 0.7,
        narrativeArc: 'family_journey'
      },
      metadata: {
        createdAt: '2025-08-12T14:30:00Z',
        lastModified: '2025-08-12T14:30:00Z',
        engagementScore: 4.9,
        temporalRelevance: 0.98
      }
    },
    {
      id: 'temp_005',
      title: 'Learning to Code During Pandemic',
      content: 'With the world on pause, I finally had time to chase that dream...',
      author: 'Current User',
      timeContext: {
        originalDate: '2020-05-15',
        estimatedAge: 31,
        lifePeriod: 'adulthood',
        seasonality: 'spring',
        significance: 8.7
      },
      themes: ['Learning', 'Adaptation', 'Technology'],
      emotions: ['Curiosity', 'Frustration', 'Achievement'],
      location: 'Home Office',
      connections: {
        relatedFragments: ['temp_004', 'temp_006'],
        timelinePosition: 0.8,
        narrativeArc: 'professional_journey'
      },
      metadata: {
        createdAt: '2025-08-11T16:20:00Z',
        lastModified: '2025-08-11T16:20:00Z',
        engagementScore: 4.4,
        temporalRelevance: 0.91
      }
    }
  ];

  // Filter based on search parameters
  let filteredFragments = mockFragments;

  if (searchParams.timeFrame?.era) {
    filteredFragments = filteredFragments.filter(f => 
      f.timeContext.lifePeriod.includes(searchParams.timeFrame!.era!)
    );
  }

  if (searchParams.timeFrame?.start || searchParams.timeFrame?.end) {
    filteredFragments = filteredFragments.filter(f => {
      if (!f.timeContext.originalDate) return false;
      const fragmentDate = new Date(f.timeContext.originalDate);
      const start = searchParams.timeFrame?.start ? new Date(searchParams.timeFrame.start) : null;
      const end = searchParams.timeFrame?.end ? new Date(searchParams.timeFrame.end) : null;
      
      if (start && fragmentDate < start) return false;
      if (end && fragmentDate > end) return false;
      return true;
    });
  }

  if (searchParams.filters?.themes) {
    filteredFragments = filteredFragments.filter(f =>
      f.themes.some(theme => searchParams.filters!.themes!.includes(theme))
    );
  }

  if (searchParams.filters?.emotions) {
    filteredFragments = filteredFragments.filter(f =>
      f.emotions.some(emotion => searchParams.filters!.emotions!.includes(emotion))
    );
  }

  // Sort results
  const sortBy = searchParams.sortBy || 'chronological';
  filteredFragments.sort((a, b) => {
    switch (sortBy) {
      case 'chronological':
        return new Date(a.timeContext.originalDate || '').getTime() - 
               new Date(b.timeContext.originalDate || '').getTime();
      case 'relevance':
        return b.metadata.temporalRelevance - a.metadata.temporalRelevance;
      case 'emotional_intensity':
        return b.timeContext.significance - a.timeContext.significance;
      case 'significance':
        return b.timeContext.significance - a.timeContext.significance;
      default:
        return 0;
    }
  });

  return filteredFragments.slice(0, searchParams.limit || 50);
}

async function generateTimelineView(
  fragments: TemporalFragment[],
  searchParams: TemporalSearchRequest
): Promise<TimelineView> {
  if (fragments.length === 0) {
    return {
      totalFragments: 0,
      timeSpan: { earliest: '', latest: '', duration: '' },
      periods: [],
      fragments: []
    };
  }

  const dates = fragments
    .map(f => f.timeContext.originalDate)
    .filter(Boolean)
    .map(d => new Date(d!))
    .sort((a, b) => a.getTime() - b.getTime());

  const earliest = dates[0];
  const latest = dates[dates.length - 1];
  const durationYears = (latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  // Group by periods
  const periods = groupFragmentsByPeriod(fragments, searchParams.timeFrame?.period || 'decade');

  return {
    totalFragments: fragments.length,
    timeSpan: {
      earliest: earliest.toISOString(),
      latest: latest.toISOString(),
      duration: `${Math.round(durationYears)} years`
    },
    periods,
    fragments
  };
}

function groupFragmentsByPeriod(fragments: TemporalFragment[], period: string) {
  // Mock implementation for period grouping
  return [
    {
      name: 'Childhood (1989-1999)',
      startDate: '1989-01-01',
      endDate: '1999-12-31',
      fragmentCount: fragments.filter(f => f.timeContext.lifePeriod === 'childhood').length,
      keyThemes: ['Education', 'Family', 'Growing Up'],
      emotionalTone: 'Wonder and Discovery'
    },
    {
      name: 'Youth (2000-2009)',
      startDate: '2000-01-01',
      endDate: '2009-12-31',
      fragmentCount: fragments.filter(f => f.timeContext.lifePeriod === 'youth').length,
      keyThemes: ['Friendship', 'Achievement', 'Transition'],
      emotionalTone: 'Excitement and Anticipation'
    },
    {
      name: 'Early Adulthood (2010-2019)',
      startDate: '2010-01-01',
      endDate: '2019-12-31',
      fragmentCount: fragments.filter(f => f.timeContext.lifePeriod.includes('adulthood')).length,
      keyThemes: ['Career', 'Family', 'Responsibility'],
      emotionalTone: 'Growth and Fulfillment'
    }
  ];
}

async function generateUserTimeline(supabase: any, userId: string) {
  // Mock comprehensive timeline
  return {
    userId,
    totalLifeFragments: 156,
    capturedTimespan: '1989-2025',
    majorLifeEvents: [
      { event: 'Birth', date: '1989-05-12', significance: 10 },
      { event: 'Started School', date: '1995-09-05', significance: 8.5 },
      { event: 'High School Graduation', date: '2007-06-15', significance: 9.2 },
      { event: 'College Graduation', date: '2011-05-20', significance: 9.0 },
      { event: 'First Job', date: '2011-07-01', significance: 7.8 },
      { event: 'Marriage', date: '2015-08-14', significance: 9.8 },
      { event: 'First Child', date: '2018-11-28', significance: 10.0 },
      { event: 'Career Change', date: '2020-09-01', significance: 8.3 }
    ],
    lifePhases: {
      childhood: { count: 23, themes: ['Wonder', 'Learning', 'Family'] },
      youth: { count: 31, themes: ['Discovery', 'Friendship', 'Achievement'] },
      adulthood: { count: 45, themes: ['Love', 'Career', 'Responsibility'] },
      recent: { count: 57, themes: ['Growth', 'Reflection', 'Wisdom'] }
    }
  };
}

async function getEraOverview(supabase: any, userId: string, era: string) {
  // Mock era-specific analysis
  return {
    era,
    dominantThemes: ['Education', 'Growing Up', 'Discovery'],
    emotionalProfile: 'Curiosity and Wonder',
    keyMemories: 3,
    significantRelationships: ['Parents', 'Teachers', 'Childhood Friends'],
    majorGrowthMoments: 2,
    challenges: ['School Anxiety', 'Social Fitting In'],
    achievements: ['Learning to Read', 'Making Friends', 'Academic Success']
  };
}

async function getPeriodicBreakdown(supabase: any, userId: string, period: string) {
  // Mock periodic analysis
  return {
    period,
    fragmentsPerPeriod: {
      '2020': 15,
      '2021': 12,
      '2022': 18,
      '2023': 22,
      '2024': 14,
      '2025': 8
    },
    seasonalPatterns: {
      spring: { count: 20, mood: 'Optimistic' },
      summer: { count: 25, mood: 'Energetic' },
      autumn: { count: 22, mood: 'Reflective' },
      winter: { count: 18, mood: 'Contemplative' }
    }
  };
}

async function generateTemporalInsights(supabase: any, userId: string) {
  // Mock insights based on temporal patterns
  return {
    narrativeArcs: [
      {
        name: 'Educational Journey',
        span: '1995-2011',
        keyMoments: 4,
        progression: 'Linear growth in confidence and knowledge'
      },
      {
        name: 'Professional Development',
        span: '2011-present',
        keyMoments: 6,
        progression: 'Evolving from uncertainty to expertise'
      },
      {
        name: 'Family Formation',
        span: '2015-present',
        keyMoments: 3,
        progression: 'Growing in love and responsibility'
      }
    ],
    temporalPatterns: {
      mostReflectiveMonth: 'December',
      mostActiveMonth: 'June',
      memoryDensity: 'Higher in formative years (16-25)',
      emotionalEvolution: 'From external to internal focus'
    },
    lifeRhythms: {
      cyclicalThemes: ['Growth', 'Challenge', 'Achievement', 'Reflection'],
      seasonalInfluences: 'Strong autumn reflection pattern',
      decadalShifts: 'Each decade shows increasing introspection'
    }
  };
}
