import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface AnalyticsRequest {
  timeRange?: {
    start: string;
    end: string;
  };
  metrics?: ('engagement' | 'content' | 'user_behavior' | 'trends' | 'insights')[];
  filters?: {
    userId?: string;
    themes?: string[];
    contentType?: string;
  };
}

interface AnalyticsData {
  overview: {
    totalFragments: number;
    totalUsers: number;
    totalEngagement: number;
    growthRate: number;
    timeRange: { start: string; end: string };
  };
  engagement: {
    dailyActive: { date: string; count: number }[];
    readingPatterns: {
      averageReadTime: number;
      completionRate: number;
      returnVisitorRate: number;
      peakHours: string[];
    };
    interactionMetrics: {
      likes: number;
      shares: number;
      comments: number;
      bookmarks: number;
    };
    contentPopularity: {
      title: string;
      views: number;
      engagement: number;
      themes: string[];
    }[];
  };
  content: {
    themeDistribution: { theme: string; count: number; percentage: number }[];
    emotionalMapping: { emotion: string; intensity: number; frequency: number }[];
    contentQuality: {
      averageLength: number;
      readabilityScore: number;
      diversityIndex: number;
      originalityScore: number;
    };
    growthTrends: {
      weeklySubmissions: { week: string; count: number }[];
      qualityTrend: { week: string; avgScore: number }[];
      themeEvolution: { week: string; dominantThemes: string[] }[];
    };
  };
  userBehavior: {
    demographicBreakdown: {
      ageGroups: { group: string; percentage: number }[];
      geographicDistribution: { region: string; users: number }[];
      userJourneyStages: { stage: string; count: number }[];
    };
    behaviorPatterns: {
      sessionDuration: { avg: number; median: number; p95: number };
      navigationPaths: { path: string; frequency: number }[];
      contentPreferences: { category: string; preference: number }[];
    };
    retentionMetrics: {
      dailyRetention: number[];
      weeklyRetention: number[];
      monthlyRetention: number[];
      cohortAnalysis: {
        cohort: string;
        retention: { day: number; rate: number }[];
      }[];
    };
  };
  trends: {
    emergingThemes: { theme: string; growth: number; momentum: number }[];
    viralContent: { contentId: string; title: string; viralityScore: number }[];
    communityPulse: {
      mood: string;
      energy: number;
      engagement: number;
      collaboration: number;
    };
    predictiveInsights: {
      nextWeekTrends: string[];
      contentGaps: string[];
      opportunityAreas: string[];
    };
  };
  insights: {
    userJourneyAnalysis: {
      onboardingSuccess: number;
      featureAdoption: { feature: string; adoption: number }[];
      dropoffPoints: { point: string; rate: number }[];
    };
    contentEffectiveness: {
      highPerformingFormats: string[];
      optimalLength: { min: number; max: number };
      bestPublishingTimes: string[];
    };
    communityHealth: {
      diversityScore: number;
      inclusivityIndex: number;
      toxicityLevel: number;
      moderationEfficiency: number;
    };
    recommendations: {
      type: 'feature' | 'content' | 'community' | 'technical';
      priority: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      impact: string;
    }[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body: AnalyticsRequest = await request.json();
    
    // Get user session and check admin permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has analytics permissions (admin/moderator)
    const { data: userProfile } = await supabase
      .from('app_user')
      .select('role, verification_level')
      .eq('id', user.id)
      .single();

    if (!userProfile || !['admin', 'moderator'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const analyticsData = await generateAnalytics(supabase, body);

    return NextResponse.json({
      analytics: analyticsData,
      generatedAt: new Date().toISOString(),
      requestedBy: user.id
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    // Get user session and check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metric = searchParams.get('metric');
    const timeRange = searchParams.get('timeRange') || '30d';

    // Generate quick analytics overview
    const quickStats = await generateQuickStats(supabase, timeRange, metric);

    return NextResponse.json({
      quickStats,
      availableMetrics: [
        'engagement', 'content', 'user_behavior', 'trends', 'insights'
      ],
      timeRanges: ['1d', '7d', '30d', '90d', '1y'],
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting quick analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateAnalytics(
  supabase: any,
  request: AnalyticsRequest
): Promise<AnalyticsData> {
  // Mock comprehensive analytics - in production, this would query actual data
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  return {
    overview: {
      totalFragments: 1247,
      totalUsers: 342,
      totalEngagement: 8956,
      growthRate: 0.23, // 23% growth
      timeRange: {
        start: request.timeRange?.start || thirtyDaysAgo.toISOString(),
        end: request.timeRange?.end || now.toISOString()
      }
    },
    
    engagement: {
      dailyActive: generateDailyActiveUsers(30),
      readingPatterns: {
        averageReadTime: 4.7, // minutes
        completionRate: 0.78,
        returnVisitorRate: 0.45,
        peakHours: ['19:00', '20:00', '21:00', '22:00']
      },
      interactionMetrics: {
        likes: 3245,
        shares: 567,
        comments: 892,
        bookmarks: 1123
      },
      contentPopularity: [
        {
          title: 'Finding Peace in Chaos',
          views: 1247,
          engagement: 0.89,
          themes: ['Mindfulness', 'Resilience', 'Mental Health']
        },
        {
          title: 'Letters to My Younger Self',
          views: 1105,
          engagement: 0.84,
          themes: ['Wisdom', 'Growth', 'Reflection']
        },
        {
          title: 'The Language of Grief',
          views: 967,
          engagement: 0.91,
          themes: ['Loss', 'Healing', 'Acceptance']
        }
      ]
    },
    
    content: {
      themeDistribution: [
        { theme: 'Personal Growth', count: 245, percentage: 19.6 },
        { theme: 'Family', count: 189, percentage: 15.2 },
        { theme: 'Love', count: 167, percentage: 13.4 },
        { theme: 'Career', count: 134, percentage: 10.7 },
        { theme: 'Mental Health', count: 112, percentage: 9.0 },
        { theme: 'Adventure', count: 98, percentage: 7.9 },
        { theme: 'Loss', count: 87, percentage: 7.0 },
        { theme: 'Creativity', count: 76, percentage: 6.1 },
        { theme: 'Education', count: 65, percentage: 5.2 },
        { theme: 'Other', count: 74, percentage: 5.9 }
      ],
      emotionalMapping: [
        { emotion: 'Joy', intensity: 7.2, frequency: 234 },
        { emotion: 'Gratitude', intensity: 8.1, frequency: 198 },
        { emotion: 'Sadness', intensity: 6.8, frequency: 156 },
        { emotion: 'Hope', intensity: 7.9, frequency: 189 },
        { emotion: 'Anxiety', intensity: 5.4, frequency: 134 },
        { emotion: 'Love', intensity: 8.7, frequency: 278 },
        { emotion: 'Anger', intensity: 4.2, frequency: 67 },
        { emotion: 'Peace', intensity: 8.0, frequency: 145 }
      ],
      contentQuality: {
        averageLength: 342, // words
        readabilityScore: 7.8, // out of 10
        diversityIndex: 0.87, // theme diversity
        originalityScore: 0.92 // uniqueness
      },
      growthTrends: {
        weeklySubmissions: generateWeeklySubmissions(12),
        qualityTrend: generateQualityTrend(12),
        themeEvolution: generateThemeEvolution(12)
      }
    },
    
    userBehavior: {
      demographicBreakdown: {
        ageGroups: [
          { group: '18-24', percentage: 15.2 },
          { group: '25-34', percentage: 28.7 },
          { group: '35-44', percentage: 23.1 },
          { group: '45-54', percentage: 18.9 },
          { group: '55-64', percentage: 10.3 },
          { group: '65+', percentage: 3.8 }
        ],
        geographicDistribution: [
          { region: 'North America', users: 156 },
          { region: 'Europe', users: 89 },
          { region: 'Asia', users: 67 },
          { region: 'Australia/Oceania', users: 18 },
          { region: 'South America', users: 8 },
          { region: 'Africa', users: 4 }
        ],
        userJourneyStages: [
          { stage: 'New Users', count: 45 },
          { stage: 'Active Contributors', count: 123 },
          { stage: 'Regular Readers', count: 98 },
          { stage: 'Community Leaders', count: 34 },
          { stage: 'Alumni/Dormant', count: 42 }
        ]
      },
      behaviorPatterns: {
        sessionDuration: { avg: 12.4, median: 8.7, p95: 34.2 }, // minutes
        navigationPaths: [
          { path: 'Home → Browse → Read', frequency: 0.34 },
          { path: 'Home → Create → Submit', frequency: 0.23 },
          { path: 'Search → Read → Related', frequency: 0.19 },
          { path: 'Profile → My Stories → Edit', frequency: 0.12 },
          { path: 'Browse → Filter → Read', frequency: 0.12 }
        ],
        contentPreferences: [
          { category: 'Short Stories (< 500 words)', preference: 0.67 },
          { category: 'Medium Articles (500-1000)', preference: 0.78 },
          { category: 'Long Essays (> 1000)', preference: 0.34 },
          { category: 'Poetry', preference: 0.45 },
          { category: 'Letters', preference: 0.56 }
        ]
      },
      retentionMetrics: {
        dailyRetention: [1.0, 0.67, 0.45, 0.34, 0.28, 0.25, 0.23],
        weeklyRetention: [1.0, 0.45, 0.32, 0.25, 0.21],
        monthlyRetention: [1.0, 0.34, 0.28, 0.24],
        cohortAnalysis: [
          {
            cohort: 'Jan 2025',
            retention: [
              { day: 1, rate: 1.0 },
              { day: 7, rate: 0.52 },
              { day: 30, rate: 0.31 }
            ]
          }
        ]
      }
    },
    
    trends: {
      emergingThemes: [
        { theme: 'Digital Wellness', growth: 0.45, momentum: 0.78 },
        { theme: 'Climate Anxiety', growth: 0.38, momentum: 0.65 },
        { theme: 'Remote Work Life', growth: 0.29, momentum: 0.54 },
        { theme: 'Intergenerational Stories', growth: 0.23, momentum: 0.67 }
      ],
      viralContent: [
        { contentId: 'viral_001', title: 'The Day I Learned to Fly', viralityScore: 0.94 },
        { contentId: 'viral_002', title: 'Conversations with Grandmother', viralityScore: 0.87 },
        { contentId: 'viral_003', title: 'Finding Home in Unexpected Places', viralityScore: 0.82 }
      ],
      communityPulse: {
        mood: 'Optimistic and Reflective',
        energy: 7.3,
        engagement: 8.1,
        collaboration: 6.8
      },
      predictiveInsights: {
        nextWeekTrends: [
          'Seasonal Reflection (Winter/Holiday themes)',
          'New Year Aspirations',
          'Family Gathering Stories'
        ],
        contentGaps: [
          'Professional Development Stories',
          'Cultural Heritage Narratives',
          'Environmental Consciousness'
        ],
        opportunityAreas: [
          'Video/Audio Story Integration',
          'Collaborative Story Projects',
          'Intergenerational Dialogue Features'
        ]
      }
    },
    
    insights: {
      userJourneyAnalysis: {
        onboardingSuccess: 0.73,
        featureAdoption: [
          { feature: 'Story Creation', adoption: 0.67 },
          { feature: 'Story Reading', adoption: 0.89 },
          { feature: 'Community Interaction', adoption: 0.45 },
          { feature: 'Profile Customization', adoption: 0.34 },
          { feature: 'Collections', adoption: 0.28 }
        ],
        dropoffPoints: [
          { point: 'After Registration', rate: 0.23 },
          { point: 'First Story Creation', rate: 0.18 },
          { point: 'Week 2 Engagement', rate: 0.15 }
        ]
      },
      contentEffectiveness: {
        highPerformingFormats: [
          'Personal Growth Stories',
          'Family Memories',
          'Life Lessons Learned',
          'Overcoming Challenges'
        ],
        optimalLength: { min: 250, max: 750 }, // words
        bestPublishingTimes: [
          'Sunday 19:00-21:00',
          'Wednesday 20:00-22:00',
          'Saturday 10:00-12:00'
        ]
      },
      communityHealth: {
        diversityScore: 0.78, // theme and demographic diversity
        inclusivityIndex: 0.84, // welcoming environment
        toxicityLevel: 0.03, // very low
        moderationEfficiency: 0.92 // response time and accuracy
      },
      recommendations: [
        {
          type: 'feature',
          priority: 'high',
          title: 'Audio Story Support',
          description: 'Add ability to record and share audio versions of stories',
          impact: 'Increase accessibility and engagement by 25%'
        },
        {
          type: 'content',
          priority: 'medium',
          title: 'Cultural Heritage Initiative',
          description: 'Promote stories about cultural traditions and heritage',
          impact: 'Increase diversity and educational value'
        },
        {
          type: 'community',
          priority: 'high',
          title: 'Mentorship Program',
          description: 'Connect experienced storytellers with newcomers',
          impact: 'Improve retention and story quality'
        },
        {
          type: 'technical',
          priority: 'medium',
          title: 'Mobile App Development',
          description: 'Create dedicated mobile applications for iOS and Android',
          impact: 'Increase mobile engagement by 40%'
        }
      ]
    }
  };
}

async function generateQuickStats(supabase: any, timeRange: string, metric?: string | null) {
  // Mock quick stats for dashboard widgets
  return {
    totalUsers: 342,
    activeUsers24h: 67,
    newStories24h: 12,
    engagementRate: 0.78,
    topThemes: ['Personal Growth', 'Family', 'Love'],
    trendingContent: 'Finding Peace in Chaos',
    communityMood: 'Reflective and Hopeful'
  };
}

function generateDailyActiveUsers(days: number) {
  const data = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const baseUsers = 50;
    const variation = Math.floor(Math.random() * 30) - 15;
    const weekendBoost = [0, 6].includes(date.getDay()) ? 10 : 0;
    
    data.push({
      date: date.toISOString().split('T')[0],
      count: Math.max(20, baseUsers + variation + weekendBoost)
    });
  }
  
  return data;
}

function generateWeeklySubmissions(weeks: number): { week: string; count: number }[] {
  const data = [];
  const now = new Date();
  
  for (let i = weeks - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekStr = `Week of ${date.toISOString().split('T')[0]}`;
    
    data.push({
      week: weekStr,
      count: Math.floor(Math.random() * 30) + 15
    });
  }
  
  return data;
}

function generateQualityTrend(weeks: number): { week: string; avgScore: number }[] {
  const data = [];
  const now = new Date();
  
  for (let i = weeks - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekStr = `Week of ${date.toISOString().split('T')[0]}`;
    
    data.push({
      week: weekStr,
      avgScore: Math.round((Math.random() * 2 + 7) * 10) / 10
    });
  }
  
  return data;
}

function generateWeeklyData(type: 'submissions' | 'quality', weeks: number) {
  if (type === 'submissions') {
    return generateWeeklySubmissions(weeks);
  } else {
    return generateQualityTrend(weeks);
  }
}

function generateThemeEvolution(weeks: number) {
  const themes = [
    ['Personal Growth', 'Family', 'Love'],
    ['Career', 'Mental Health', 'Creativity'],
    ['Adventure', 'Loss', 'Education'],
    ['Hope', 'Resilience', 'Change']
  ];
  
  const data = [];
  const now = new Date();
  
  for (let i = weeks - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekStr = `Week of ${date.toISOString().split('T')[0]}`;
    const themeSet = themes[Math.floor(Math.random() * themes.length)];
    
    data.push({
      week: weekStr,
      dominantThemes: themeSet
    });
  }
  
  return data;
}
