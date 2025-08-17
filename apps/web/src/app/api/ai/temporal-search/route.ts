import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiAnalysisService } from '@/lib/ai/openai-service';
import { vectorSearchService } from '@/lib/ai/vector-search';

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
  sortBy?: 'chronological' | 'relevance' | 'emotional_intensity' | 'significance';
  limit?: number;
  semanticSearch?: boolean;
}

interface TemporalFragment {
  id: string;
  title: string;
  content: string;
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
    temporalRelevance: number;
    similarity?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body: TemporalSearchRequest = await request.json();
    const { 
      query, 
      timeFrame, 
      filters, 
      sortBy = 'relevance', 
      limit = 10,
      semanticSearch = true
    } = body;

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let fragments: any[] = [];
    let searchMethod = 'database';

    // If we have a text query and semantic search is enabled, use vector search
    if (query && semanticSearch) {
      try {
        const semanticResults = await vectorSearchService.semanticSearch(
          query,
          {}, // empty filters for now
          limit * 2 // Get more results to filter by other criteria
        );

        fragments = semanticResults.map((result: any) => ({
          id: result.fragment_id,
          title: result.title || 'Untitled',
          body: result.content,
          system_themes: result.system_themes || [],
          system_emotions: result.system_emotions || [],
          created_at: result.created_at,
          updated_at: result.updated_at,
          similarity: result.similarity,
          user_id: result.user_id
        }));

        searchMethod = 'semantic';
      } catch (vectorError) {
        console.error('Semantic search failed, falling back to database search:', vectorError);
      }
    }

    // If semantic search didn't work or wasn't requested, use database search
    if (fragments.length === 0) {
      let dbQuery = supabase
        .from('fragment')
        .select(`
          id,
          title,
          body,
          system_themes,
          system_emotions,
          created_at,
          updated_at,
          user_id
        `)
        .eq('user_id', user.id);

      // Apply text search if query provided
      if (query) {
        dbQuery = dbQuery.or(`title.ilike.%${query}%,body.ilike.%${query}%`);
      }

      // Apply theme filters
      if (filters?.themes?.length) {
        dbQuery = dbQuery.overlaps('system_themes', filters.themes);
      }

      // Apply emotion filters
      if (filters?.emotions?.length) {
        dbQuery = dbQuery.overlaps('system_emotions', filters.emotions);
      }

      // Apply date range filters
      if (timeFrame?.start) {
        dbQuery = dbQuery.gte('created_at', timeFrame.start);
      }
      if (timeFrame?.end) {
        dbQuery = dbQuery.lte('created_at', timeFrame.end);
      }

      // Order results
      switch (sortBy) {
        case 'chronological':
          dbQuery = dbQuery.order('created_at', { ascending: false });
          break;
        case 'relevance':
        default:
          dbQuery = dbQuery.order('updated_at', { ascending: false });
          break;
      }

      const { data: dbFragments, error: dbError } = await dbQuery.limit(limit * 2);

      if (dbError) {
        console.error('Database search error:', dbError);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
      }

      fragments = dbFragments || [];
    }

    // Filter results to user's content only
    fragments = fragments.filter(f => f.user_id === user.id);

    // Apply additional AI-based filtering and analysis
    let processedFragments: TemporalFragment[] = [];

    if (fragments.length > 0) {
      // Process each fragment for temporal context
      processedFragments = await Promise.all(
        fragments.slice(0, limit).map(async (fragment: any) => {
          let timeContext = {
            lifePeriod: 'unknown',
            significance: 5.0,
            seasonality: undefined as string | undefined,
            estimatedAge: undefined as number | undefined,
            originalDate: undefined as string | undefined
          };

          // Try to extract temporal context using AI if content is substantial
          if (fragment.body && fragment.body.length > 100) {
            try {
              const temporalAnalysis = await aiAnalysisService.analyzeStoryContent(
                fragment.body,
                fragment.title
              );

              // Map AI analysis to temporal context
              timeContext = {
                lifePeriod: extractLifePeriod(temporalAnalysis.summary),
                significance: Math.random() * 4 + 6, // 6-10 range for now
                seasonality: extractSeasonality(fragment.body),
                estimatedAge: extractAge(fragment.body),
                originalDate: fragment.created_at
              };
            } catch (aiError) {
              console.error('AI temporal analysis failed:', aiError);
              // Use fallback analysis
              timeContext = {
                lifePeriod: inferLifePeriodFromThemes(fragment.system_themes || []),
                significance: 5.0,
                seasonality: extractSeasonality(fragment.body),
                estimatedAge: undefined,
                originalDate: fragment.created_at
              };
            }
          }

          return {
            id: fragment.id,
            title: fragment.title || 'Untitled',
            content: fragment.body?.substring(0, 300) + '...' || '',
            timeContext,
            themes: fragment.system_themes || [],
            emotions: fragment.system_emotions || [],
            location: extractLocation(fragment.body),
            connections: {
              relatedFragments: [], // Would need additional analysis
              timelinePosition: calculateTimelinePosition(fragment.created_at),
              narrativeArc: 'personal_experience'
            },
            metadata: {
              createdAt: fragment.created_at,
              lastModified: fragment.updated_at,
              temporalRelevance: calculateTemporalRelevance(timeContext, timeFrame),
              similarity: fragment.similarity
            }
          };
        })
      );

      // Sort based on specified criteria
      processedFragments = sortTemporalFragments(processedFragments, sortBy);
    }

    // Generate AI insights about the temporal patterns
    let temporalInsights;
    if (processedFragments.length > 0) {
      try {
        const patterns = analyzeTemporalPatterns(processedFragments);
        temporalInsights = {
          patterns,
          summary: generateTemporalSummary(processedFragments, query),
          timeline: buildTimeline(processedFragments),
          themes: extractCommonThemes(processedFragments),
          emotionalJourney: analyzeEmotionalJourney(processedFragments)
        };
      } catch (insightError) {
        console.error('Failed to generate temporal insights:', insightError);
        temporalInsights = {
          patterns: ['Personal narrative progression'],
          summary: `Found ${processedFragments.length} relevant memories`,
          timeline: [],
          themes: [],
          emotionalJourney: 'Complex emotional progression'
        };
      }
    }

    return NextResponse.json({
      fragments: processedFragments,
      searchMetadata: {
        query,
        method: searchMethod,
        totalResults: processedFragments.length,
        timeFrame,
        filters,
        sortBy
      },
      temporalInsights,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in temporal search:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('OpenAI')) {
        return NextResponse.json({ 
          error: 'AI service temporarily unavailable',
          details: 'Please try again later'
        }, { status: 503 });
      }
    }
    
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

    // Get user's temporal patterns and timeline overview
    const { data: fragments, error: fragmentsError } = await supabase
      .from('fragment')
      .select(`
        id,
        title,
        body,
        system_themes,
        system_emotions,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fragmentsError || !fragments?.length) {
      return NextResponse.json({
        timeline: [],
        patterns: [],
        message: 'No fragments found for temporal analysis'
      });
    }

    // Analyze temporal patterns across all user content
    const timelineData = fragments.map(fragment => ({
      date: fragment.created_at,
      title: fragment.title,
      themes: fragment.system_themes || [],
      emotions: fragment.system_emotions || []
    }));

    const temporalPatterns = {
      totalMemories: fragments.length,
      timeSpan: {
        earliest: fragments[fragments.length - 1]?.created_at,
        latest: fragments[0]?.created_at
      },
      themesOverTime: analyzeThemesOverTime(fragments),
      emotionalProgression: analyzeEmotionalProgression(fragments),
      significantPeriods: identifySignificantPeriods(fragments),
      writingPatterns: analyzeWritingPatterns(fragments)
    };

    return NextResponse.json({
      timeline: timelineData.slice(0, 20), // Recent 20 for overview
      patterns: temporalPatterns,
      suggestions: {
        exploreEras: ['childhood', 'youth', 'recent'],
        searchPrompts: [
          'Memories about family',
          'Times of change',
          'Moments of joy',
          'Learning experiences'
        ]
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting temporal overview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions
function extractLifePeriod(summary: string): string {
  const keywords = {
    childhood: ['child', 'kid', 'young', 'school', 'parent', 'home'],
    youth: ['teen', 'adolescent', 'high school', 'college', 'university'],
    adulthood: ['work', 'career', 'marriage', 'family', 'responsibility'],
    recent: ['recent', 'lately', 'now', 'current', 'today']
  };

  for (const [period, words] of Object.entries(keywords)) {
    if (words.some(word => summary.toLowerCase().includes(word))) {
      return period;
    }
  }
  return 'unknown';
}

function inferLifePeriodFromThemes(themes: string[]): string {
  const themeMapping = {
    childhood: ['family', 'school', 'innocence', 'play'],
    youth: ['identity', 'independence', 'exploration', 'education'],
    adulthood: ['career', 'relationships', 'responsibility', 'achievement'],
    recent: ['reflection', 'wisdom', 'legacy', 'mentoring']
  };

  for (const [period, periodThemes] of Object.entries(themeMapping)) {
    if (themes.some(theme => 
      periodThemes.some(pt => theme.toLowerCase().includes(pt))
    )) {
      return period;
    }
  }
  return 'unknown';
}

function extractSeasonality(content: string): string | undefined {
  const seasons = ['spring', 'summer', 'fall', 'autumn', 'winter'];
  const seasonWords = {
    spring: ['spring', 'bloom', 'fresh', 'new'],
    summer: ['summer', 'hot', 'vacation', 'beach'],
    fall: ['fall', 'autumn', 'leaves', 'harvest'],
    winter: ['winter', 'cold', 'snow', 'holiday']
  };

  for (const [season, words] of Object.entries(seasonWords)) {
    if (words.some(word => content.toLowerCase().includes(word))) {
      return season;
    }
  }
  return undefined;
}

function extractAge(content: string): number | undefined {
  const ageMatch = content.match(/(?:was|am|turned)\s+(\d{1,2})\s+(?:years?\s+old)?/i);
  return ageMatch ? parseInt(ageMatch[1]) : undefined;
}

function extractLocation(content: string): string | undefined {
  // Simple location extraction - could be enhanced with NLP
  const locationPatterns = [
    /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
  ];

  for (const pattern of locationPatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0].replace(/^(in|at)\s+/, '');
    }
  }
  return undefined;
}

function calculateTimelinePosition(createdAt: string): number {
  // Simple calculation based on creation date
  const date = new Date(createdAt);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, 100 - (daysDiff / 365) * 10); // Rough timeline position
}

function calculateTemporalRelevance(timeContext: any, timeFrame: any): number {
  if (!timeFrame) return 0.5;
  
  // Simple relevance calculation based on time context match
  let relevance = 0.5;
  
  if (timeFrame.era && timeContext.lifePeriod === timeFrame.era) {
    relevance += 0.3;
  }
  
  if (timeFrame.start && timeContext.originalDate) {
    const targetDate = new Date(timeFrame.start);
    const fragmentDate = new Date(timeContext.originalDate);
    const daysDiff = Math.abs(targetDate.getTime() - fragmentDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff < 365) relevance += 0.2;
  }
  
  return Math.min(1, relevance);
}

function sortTemporalFragments(fragments: TemporalFragment[], sortBy: string): TemporalFragment[] {
  switch (sortBy) {
    case 'chronological':
      return fragments.sort((a, b) => 
        new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime()
      );
    case 'emotional_intensity':
      return fragments.sort((a, b) => b.timeContext.significance - a.timeContext.significance);
    case 'significance':
      return fragments.sort((a, b) => b.timeContext.significance - a.timeContext.significance);
    case 'relevance':
    default:
      return fragments.sort((a, b) => 
        (b.metadata.similarity || b.metadata.temporalRelevance) - 
        (a.metadata.similarity || a.metadata.temporalRelevance)
      );
  }
}

function analyzeTemporalPatterns(fragments: TemporalFragment[]): string[] {
  const patterns = [];
  
  const lifePeriods = fragments.map(f => f.timeContext.lifePeriod);
  const periodCounts = lifePeriods.reduce((acc, period) => {
    acc[period] = (acc[period] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const dominantPeriod = Object.entries(periodCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0];
  
  if (dominantPeriod) {
    patterns.push(`Most memories from ${dominantPeriod} period`);
  }
  
  const seasons = fragments
    .map(f => f.timeContext.seasonality)
    .filter(Boolean);
  
  if (seasons.length > 0) {
    patterns.push(`Seasonal patterns detected`);
  }
  
  return patterns;
}

function generateTemporalSummary(fragments: TemporalFragment[], query?: string): string {
  const count = fragments.length;
  const periods = [...new Set(fragments.map(f => f.timeContext.lifePeriod))];
  
  if (query) {
    return `Found ${count} memories related to "${query}" across ${periods.length} life periods`;
  }
  
  return `Discovered ${count} memories spanning ${periods.length} different life periods`;
}

function buildTimeline(fragments: TemporalFragment[]): any[] {
  return fragments
    .filter(f => f.metadata.createdAt)
    .map(f => ({
      date: f.metadata.createdAt,
      title: f.title,
      period: f.timeContext.lifePeriod,
      significance: f.timeContext.significance
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function extractCommonThemes(fragments: TemporalFragment[]): string[] {
  const allThemes = fragments.flatMap(f => f.themes);
  const themeCount = allThemes.reduce((acc, theme) => {
    acc[theme] = (acc[theme] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(themeCount)
    .filter(([, count]) => count > 1)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([theme]) => theme);
}

function analyzeEmotionalJourney(fragments: TemporalFragment[]): string {
  const emotions = fragments.flatMap(f => f.emotions);
  const dominantEmotions = emotions.slice(0, 3);
  
  if (dominantEmotions.length === 0) {
    return 'Complex emotional journey';
  }
  
  return `Journey through ${dominantEmotions.join(', ')}`;
}

function analyzeThemesOverTime(fragments: any[]): any {
  // Simple theme analysis over time
  return {
    early: fragments.slice(-5).flatMap(f => f.system_themes || []).slice(0, 3),
    recent: fragments.slice(0, 5).flatMap(f => f.system_themes || []).slice(0, 3)
  };
}

function analyzeEmotionalProgression(fragments: any[]): any {
  return {
    early: fragments.slice(-5).flatMap(f => f.system_emotions || []).slice(0, 3),
    recent: fragments.slice(0, 5).flatMap(f => f.system_emotions || []).slice(0, 3)
  };
}

function identifySignificantPeriods(fragments: any[]): any[] {
  // Group by month and find periods with high activity
  const periodActivity = fragments.reduce((acc, fragment) => {
    const month = fragment.created_at.substring(0, 7); // YYYY-MM
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(periodActivity)
    .filter(([, count]) => (count as number) >= 3)
    .map(([period, count]) => ({ period, count: count as number }))
    .slice(0, 5);
}

function analyzeWritingPatterns(fragments: any[]): any {
  const avgLength = fragments.reduce((sum, f) => sum + (f.body?.length || 0), 0) / fragments.length;
  
  return {
    averageLength: Math.round(avgLength),
    mostProductivePeriod: 'Recent months', // Could be enhanced
    preferredThemes: fragments.flatMap(f => f.system_themes || []).slice(0, 3)
  };
}
