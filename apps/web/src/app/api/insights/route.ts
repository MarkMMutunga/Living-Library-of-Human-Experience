import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { insightsAnalyzer } from '@/lib/ml/insights-analyzer';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const analysisType = searchParams.get('type') || 'full';

    // Generate fresh insights
    let insights;
    
    switch (analysisType) {
      case 'patterns':
        insights = await insightsAnalyzer.generatePersonalInsights(userId);
        insights = { patterns: insights.patterns, metadata: insights.metadata };
        break;
        
      case 'growth':
        insights = await insightsAnalyzer.generatePersonalInsights(userId);
        insights = { 
          growthInsights: insights.growthInsights, 
          summary: insights.summary,
          metadata: insights.metadata 
        };
        break;
        
      case 'relationships':
        insights = await insightsAnalyzer.generatePersonalInsights(userId);
        insights = { 
          relationshipMappings: insights.relationshipMappings,
          metadata: insights.metadata 
        };
        break;
        
      default: // 'full'
        insights = await insightsAnalyzer.generatePersonalInsights(userId);
        break;
    }

    return NextResponse.json({
      success: true,
      data: insights,
      cached: false,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('ML insights generation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate insights',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { action, parameters = {} } = body;

    switch (action) {
      case 'analyze_specific_pattern':
        return await analyzeSpecificPattern(userId, parameters);
        
      case 'compare_periods':
        return await comparePeriods(userId, parameters);
        
      case 'predict_trends':
        return await predictTrends(userId, parameters);
        
      case 'generate_recommendations':
        return await generatePersonalizedRecommendations(userId, parameters);
        
      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('ML insights action failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process insights action',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper functions for specific analysis actions

async function analyzeSpecificPattern(userId: string, parameters: any) {
  try {
    const { patternType, timeRange, themes } = parameters;
    
    const supabase = createClient();
    
    // Build query based on parameters
    let query = supabase
      .from('fragment')
      .select('*')
      .eq('user_id', userId);
    
    if (timeRange?.start) {
      query = query.gte('created_at', timeRange.start);
    }
    if (timeRange?.end) {
      query = query.lte('created_at', timeRange.end);
    }
    
    const { data: fragments, error } = await query;
    
    if (error) {
      throw new Error('Failed to fetch fragments for pattern analysis');
    }

    // Filter by themes if specified
    let filteredFragments = fragments;
    if (themes && themes.length > 0) {
      filteredFragments = fragments?.filter(fragment => 
        themes.some((theme: string) => 
          fragment.system_themes?.includes(theme)
        )
      ) || [];
    }

    // Generate targeted analysis
    const insights = await insightsAnalyzer.generatePersonalInsights(userId);
    
    // Filter results based on pattern type
    let specificInsights;
    switch (patternType) {
      case 'emotional':
        specificInsights = insights.patterns.filter(p => p.type === 'emotional');
        break;
      case 'thematic':
        specificInsights = insights.patterns.filter(p => p.type === 'thematic');
        break;
      case 'temporal':
        specificInsights = insights.patterns.filter(p => p.type === 'temporal');
        break;
      default:
        specificInsights = insights.patterns;
    }

    return NextResponse.json({
      success: true,
      data: {
        patterns: specificInsights,
        analyzedFragments: filteredFragments?.length || 0,
        parameters: parameters
      }
    });

  } catch (error) {
    throw new Error(`Pattern analysis failed: ${error}`);
  }
}

async function comparePeriods(userId: string, parameters: any) {
  try {
    const { period1, period2, compareBy = 'themes' } = parameters;
    
    const supabase = createClient();
    
    // Fetch fragments for both periods
    const [period1Fragments, period2Fragments] = await Promise.all([
      supabase
        .from('fragment')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', period1.start)
        .lte('created_at', period1.end),
      supabase
        .from('fragment')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', period2.start)
        .lte('created_at', period2.end)
    ]);

    if (period1Fragments.error || period2Fragments.error) {
      throw new Error('Failed to fetch fragments for period comparison');
    }

    // Compare the periods
    const comparison = {
      period1: {
        fragments: period1Fragments.data?.length || 0,
        themes: extractThemeFrequency(period1Fragments.data || []),
        emotions: extractEmotionFrequency(period1Fragments.data || []),
        averageLength: calculateAverageLength(period1Fragments.data || [])
      },
      period2: {
        fragments: period2Fragments.data?.length || 0,
        themes: extractThemeFrequency(period2Fragments.data || []),
        emotions: extractEmotionFrequency(period2Fragments.data || []),
        averageLength: calculateAverageLength(period2Fragments.data || [])
      },
      changes: {
        fragmentCount: (period2Fragments.data?.length || 0) - (period1Fragments.data?.length || 0),
        emergingThemes: findEmergingElements(
          extractThemeFrequency(period1Fragments.data || []),
          extractThemeFrequency(period2Fragments.data || [])
        ),
        changingEmotions: findChangingElements(
          extractEmotionFrequency(period1Fragments.data || []),
          extractEmotionFrequency(period2Fragments.data || [])
        )
      }
    };

    return NextResponse.json({
      success: true,
      data: comparison
    });

  } catch (error) {
    throw new Error(`Period comparison failed: ${error}`);
  }
}

async function predictTrends(userId: string, parameters: any) {
  try {
    const { timeHorizon = 6, confidence = 0.7 } = parameters;
    
    // Get full insights for trend analysis
    const insights = await insightsAnalyzer.generatePersonalInsights(userId);
    
    // Analyze growth trends to make predictions
    const predictions = {
      likelyThemes: insights.growthInsights
        .filter(g => g.direction === 'growing' && g.strength > confidence)
        .map(g => ({
          theme: g.area,
          probability: g.strength,
          reasoning: `Based on ${g.timeline.length} months of growth data`
        })),
      emotionalTrajectory: insights.temporalTrends
        .slice(-3) // Last 3 periods
        .map(trend => ({
          period: trend.period,
          dominantEmotion: Object.entries(trend.emotions)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral',
          confidence: 0.6
        })),
      writingPatterns: {
        expectedFrequency: calculateTrendProjection(insights.temporalTrends, 'writingFrequency'),
        expectedLength: calculateTrendProjection(insights.temporalTrends, 'averageLength'),
        timeHorizon: `${timeHorizon} months`
      }
    };

    return NextResponse.json({
      success: true,
      data: predictions
    });

  } catch (error) {
    throw new Error(`Trend prediction failed: ${error}`);
  }
}

async function generatePersonalizedRecommendations(userId: string, parameters: any) {
  try {
    const { focus = 'growth', count = 5 } = parameters;
    
    const insights = await insightsAnalyzer.generatePersonalInsights(userId);
    
    let recommendations;
    switch (focus) {
      case 'exploration':
        recommendations = insights.recommendations.explorationSuggestions.slice(0, count);
        break;
      case 'writing':
        recommendations = insights.recommendations.writingPrompts.slice(0, count);
        break;
      case 'reflection':
        recommendations = insights.recommendations.reflectionQuestions.slice(0, count);
        break;
      default: // 'growth'
        recommendations = insights.recommendations.growthOpportunities.slice(0, count);
    }

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        focus,
        basedOn: {
          patterns: insights.patterns.length,
          fragments: insights.metadata.analyzedFragments,
          confidence: insights.metadata.confidence
        }
      }
    });

  } catch (error) {
    throw new Error(`Recommendation generation failed: ${error}`);
  }
}

// Utility functions
function extractThemeFrequency(fragments: any[]): Record<string, number> {
  const frequency: Record<string, number> = {};
  fragments.forEach(fragment => {
    (fragment.system_themes || []).forEach((theme: string) => {
      frequency[theme] = (frequency[theme] || 0) + 1;
    });
  });
  return frequency;
}

function extractEmotionFrequency(fragments: any[]): Record<string, number> {
  const frequency: Record<string, number> = {};
  fragments.forEach(fragment => {
    (fragment.system_emotions || []).forEach((emotion: string) => {
      frequency[emotion] = (frequency[emotion] || 0) + 1;
    });
  });
  return frequency;
}

function calculateAverageLength(fragments: any[]): number {
  if (fragments.length === 0) return 0;
  return fragments.reduce((sum, f) => sum + (f.body?.length || 0), 0) / fragments.length;
}

function findEmergingElements(
  period1: Record<string, number>, 
  period2: Record<string, number>
): Array<{element: string; change: number}> {
  const emerging: Array<{element: string; change: number}> = [];
  
  for (const [element, count2] of Object.entries(period2)) {
    const count1 = period1[element] || 0;
    const change = count2 - count1;
    if (change > 0) {
      emerging.push({ element, change });
    }
  }
  
  return emerging.sort((a, b) => b.change - a.change).slice(0, 5);
}

function findChangingElements(
  period1: Record<string, number>, 
  period2: Record<string, number>
): Array<{element: string; change: number; direction: 'increase' | 'decrease'}> {
  const changing: Array<{element: string; change: number; direction: 'increase' | 'decrease'}> = [];
  
  const allElements = new Set([...Object.keys(period1), ...Object.keys(period2)]);
  
  for (const element of allElements) {
    const count1 = period1[element] || 0;
    const count2 = period2[element] || 0;
    const change = Math.abs(count2 - count1);
    
    if (change > 0) {
      changing.push({ 
        element, 
        change, 
        direction: count2 > count1 ? 'increase' : 'decrease' 
      });
    }
  }
  
  return changing.sort((a, b) => b.change - a.change).slice(0, 5);
}

function calculateTrendProjection(trends: any[], metric: string): number {
  if (trends.length < 2) return 0;
  
  // Simple linear projection based on recent trends
  const recent = trends.slice(-3);
  const values = recent.map(t => t[metric] || 0);
  
  if (values.length < 2) return values[0] || 0;
  
  // Calculate trend
  const sum = values.reduce((a, b) => a + b, 0);
  const average = sum / values.length;
  
  // Simple projection (could be enhanced with more sophisticated algorithms)
  const lastValue = values[values.length - 1];
  const trend = lastValue - values[0];
  
  return average + (trend * 0.5); // Conservative projection
}
