import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { advancedSearchService, AdvancedSearchFilters } from '@/lib/search/advanced-search';

interface AdvancedSearchRequest {
  query: string;
  filters?: AdvancedSearchFilters;
  options?: {
    includeAnalytics?: boolean;
    includeClustering?: boolean;
    includeSuggestions?: boolean;
    limit?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body: AdvancedSearchRequest = await request.json();
    const { query, filters = {}, options = {} } = body;

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate query
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Search query is required' 
      }, { status: 400 });
    }

    // Execute advanced search
    const searchResults = await advancedSearchService.advancedSearch(
      query.trim(),
      filters,
      user.id,
      {
        includeAnalytics: options.includeAnalytics ?? true,
        includeClustering: options.includeClustering ?? true,
        includeSuggestions: options.includeSuggestions ?? true,
        limit: options.limit ?? 20
      }
    );

    // Log search for analytics (optional)
    try {
      await logSearchQuery(user.id, query, filters, searchResults.analytics);
    } catch (logError) {
      console.error('Failed to log search query:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      results: searchResults,
      metadata: {
        query,
        filters,
        userId: user.id,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('OpenAI')) {
        return NextResponse.json({ 
          error: 'AI search service temporarily unavailable',
          details: 'Please try again later'
        }, { status: 503 });
      }
      
      if (error.message.includes('Search failed')) {
        return NextResponse.json({ 
          error: 'Search failed',
          details: 'Please try a different query or check your filters'
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: 'An unexpected error occurred during search'
    }, { status: 500 });
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

    const action = searchParams.get('action');

    switch (action) {
      case 'suggestions':
        return await handleSearchSuggestions(user.id, searchParams);
      
      case 'filters':
        return await handleAvailableFilters(user.id);
      
      case 'analytics':
        return await handleSearchAnalytics(user.id, searchParams);
      
      default:
        return NextResponse.json({ 
          error: 'Invalid action. Available actions: suggestions, filters, analytics' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Advanced search GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleSearchSuggestions(userId: string, searchParams: URLSearchParams) {
  try {
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get user's recent searches and content for suggestions
    const suggestions = await advancedSearchService.generateSearchSuggestions(
      query,
      {},
      userId,
      []
    );

    return NextResponse.json({
      suggestions: suggestions.slice(0, limit),
      query,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Search suggestions error:', error);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}

async function handleAvailableFilters(userId: string) {
  try {
    const supabase = createClient();
    
    // Get user's available themes, emotions, and other filter options
    const { data: fragments, error } = await supabase
      .from('fragment')
      .select('system_themes, system_emotions, created_at')
      .eq('user_id', userId)
      .not('system_themes', 'is', null)
      .not('system_emotions', 'is', null);

    if (error) {
      throw error;
    }

    const allThemes = fragments?.flatMap(f => f.system_themes || []) || [];
    const allEmotions = fragments?.flatMap(f => f.system_emotions || []) || [];

    // Count occurrences
    const themeCount = allThemes.reduce((acc, theme) => {
      acc[theme] = (acc[theme] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const emotionCount = allEmotions.reduce((acc, emotion) => {
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get date range
    const dates = fragments?.map(f => new Date(f.created_at)) || [];
    const dateRange = dates.length > 0 ? {
      earliest: new Date(Math.min(...dates.map(d => d.getTime()))),
      latest: new Date(Math.max(...dates.map(d => d.getTime())))
    } : null;

    // Popular themes and emotions (appearing in at least 2 fragments)
    const popularThemes = Object.entries(themeCount)
      .filter(([, count]) => count >= 2)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .map(([theme, count]) => ({ value: theme, count }));

    const popularEmotions = Object.entries(emotionCount)
      .filter(([, count]) => count >= 2)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([emotion, count]) => ({ value: emotion, count }));

    return NextResponse.json({
      availableFilters: {
        themes: popularThemes,
        emotions: popularEmotions,
        dateRange,
        contentTypes: [
          { value: 'all', label: 'All Content', count: fragments?.length || 0 },
          { value: 'short', label: 'Short Stories', count: 0 }, // Would need to calculate
          { value: 'medium', label: 'Medium Stories', count: 0 },
          { value: 'long', label: 'Long Stories', count: 0 }
        ],
        eras: [
          { value: 'childhood', label: 'Childhood' },
          { value: 'youth', label: 'Youth' },
          { value: 'adulthood', label: 'Adulthood' },
          { value: 'recent', label: 'Recent' }
        ]
      },
      statistics: {
        totalFragments: fragments?.length || 0,
        uniqueThemes: Object.keys(themeCount).length,
        uniqueEmotions: Object.keys(emotionCount).length,
        dateSpan: dateRange
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Available filters error:', error);
    return NextResponse.json({ error: 'Failed to get available filters' }, { status: 500 });
  }
}

async function handleSearchAnalytics(userId: string, searchParams: URLSearchParams) {
  try {
    const timeframe = searchParams.get('timeframe') || '30d';
    const limit = parseInt(searchParams.get('limit') || '10');

    // This would fetch from a search_logs table if implemented
    // For now, return mock analytics
    const mockAnalytics = {
      topQueries: [
        { query: 'family memories', count: 15, avgResults: 8 },
        { query: 'childhood', count: 12, avgResults: 12 },
        { query: 'growth', count: 8, avgResults: 6 },
        { query: 'happiness', count: 7, avgResults: 9 },
        { query: 'challenges', count: 5, avgResults: 4 }
      ].slice(0, limit),
      
      searchTrends: {
        totalSearches: 47,
        avgResultsPerSearch: 8.3,
        avgSearchTime: 245, // milliseconds
        mostActiveDay: 'Tuesday',
        peakSearchHour: 19 // 7 PM
      },
      
      popularFilters: {
        themes: ['Personal Growth', 'Family', 'Adventure'],
        emotions: ['Joy', 'Gratitude', 'Excitement'],
        timeRanges: ['recent', 'childhood', 'last year']
      },
      
      searchSuccess: {
        withResults: 42,
        withoutResults: 5,
        successRate: 89.4
      },
      
      timeframe,
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(mockAnalytics);

  } catch (error) {
    console.error('Search analytics error:', error);
    return NextResponse.json({ error: 'Failed to get search analytics' }, { status: 500 });
  }
}

async function logSearchQuery(
  userId: string,
  query: string,
  filters: AdvancedSearchFilters,
  analytics: any
) {
  // This would log to a search_logs table for analytics
  // Implementation would depend on whether you want to track search behavior
  
  try {
    const supabase = createClient();
    
    // Example search log entry
    const searchLog = {
      user_id: userId,
      query,
      filters,
      results_count: analytics.totalResults,
      search_time_ms: analytics.searchTime,
      search_method: analytics.method,
      relevance_score: analytics.relevanceScore,
      timestamp: new Date().toISOString()
    };

    // Uncomment if you create a search_logs table
    // await supabase.from('search_logs').insert(searchLog);
    
    console.log('Search logged:', { query, userId, resultsCount: analytics.totalResults });
    
  } catch (error) {
    console.error('Failed to log search:', error);
    // Don't throw - logging failure shouldn't break search
  }
}
