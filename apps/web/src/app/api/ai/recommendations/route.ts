import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiAnalysisService } from '@/lib/ai/openai-service';
import { vectorSearchService } from '@/lib/ai/vector-search';

interface RecommendationRequest {
  fragmentId?: string;
  userId?: string;
  themes?: string[];
  emotions?: string[];
  timeframe?: string;
  type?: 'similar' | 'complementary' | 'growth' | 'wisdom';
  limit?: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body: RecommendationRequest = await request.json();
    const { fragmentId, themes, emotions, type = 'similar', limit = 5 } = body;

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let sourceFragment;
    let analysisThemes = themes;
    let analysisEmotions = emotions;

    // If fragmentId provided, fetch the fragment and its analysis
    if (fragmentId) {
      const { data: fragment, error: fragmentError } = await supabase
        .from('fragment')
        .select(`
          id,
          title,
          body,
          system_themes,
          system_emotions,
          user_id
        `)
        .eq('id', fragmentId)
        .single();

      if (fragmentError || !fragment) {
        return NextResponse.json({ error: 'Fragment not found' }, { status: 404 });
      }

      // Check if user owns the fragment or has access
      if (fragment.user_id !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      sourceFragment = fragment;
      analysisThemes = fragment.system_themes || themes;
      analysisEmotions = fragment.system_emotions || emotions;

      // If no themes/emotions in database, analyze the content
      if (!analysisThemes?.length && !analysisEmotions?.length && fragment.body) {
        try {
          const analysis = await aiAnalysisService.analyzeStoryContent(
            fragment.body,
            fragment.title
          );
          analysisThemes = analysis.themes;
          analysisEmotions = analysis.emotions;

          // Update the fragment with analysis
          await supabase
            .from('fragment')
            .update({
              system_themes: analysis.themes,
              system_emotions: analysis.emotions,
              updated_at: new Date().toISOString()
            })
            .eq('id', fragmentId);
        } catch (analysisError) {
          console.error('Failed to analyze fragment:', analysisError);
        }
      }
    }

    if (!analysisThemes?.length && !analysisEmotions?.length) {
      return NextResponse.json({ 
        error: 'No themes or emotions provided for recommendations' 
      }, { status: 400 });
    }

    let recommendations;

    // Use vector search for similar content if we have a fragment
    if (sourceFragment?.body) {
      try {
        const similarFragments = await vectorSearchService.findSimilarFragments(
          sourceFragment.body,
          limit + 1 // +1 to exclude source fragment
        );

        // Filter out the source fragment and map to expected format
        const filteredFragments = similarFragments
          .filter((f: any) => f.fragment_id !== fragmentId)
          .slice(0, limit);

        recommendations = filteredFragments.map((result: any) => ({
          id: result.fragment_id,
          title: result.title || 'Untitled',
          snippet: result.content?.substring(0, 200) + '...' || '',
          similarity: result.similarity,
          themes: result.system_themes || [],
          emotions: result.system_emotions || [],
          reason: `Similar content with ${Math.round(result.similarity * 100)}% similarity`,
          type: 'vector_similarity',
          recommendedAt: new Date().toISOString()
        }));
      } catch (vectorError) {
        console.error('Vector search failed, falling back to theme-based search:', vectorError);
        recommendations = await getThemeBasedRecommendations(
          supabase,
          user.id,
          analysisThemes || [],
          analysisEmotions || [],
          type,
          limit,
          fragmentId
        );
      }
    } else {
      // Fallback to theme-based recommendations
      recommendations = await getThemeBasedRecommendations(
        supabase,
        user.id,
        analysisThemes || [],
        analysisEmotions || [],
        type,
        limit,
        fragmentId
      );
    }

    // Generate AI insights about the recommendations
    let aiInsights;
    if (recommendations.length > 0) {
      try {
        aiInsights = await aiAnalysisService.generateRecommendations(
          analysisThemes || [],
          analysisEmotions || [],
          recommendations.map((r: any) => ({ title: r.title, themes: r.themes, emotions: r.emotions }))
        );
      } catch (insightError) {
        console.error('Failed to generate AI insights:', insightError);
        aiInsights = {
          summary: 'Recommendations based on content analysis',
          patterns: ['Thematic similarity', 'Emotional resonance'],
          insights: ['These stories share common themes and emotions']
        };
      }
    }

    return NextResponse.json({
      recommendations,
      sourceFragment: sourceFragment ? {
        id: sourceFragment.id,
        title: sourceFragment.title,
        themes: analysisThemes,
        emotions: analysisEmotions
      } : null,
      aiInsights,
      metadata: {
        type,
        totalRecommendations: recommendations.length,
        generatedAt: new Date().toISOString(),
        method: sourceFragment?.body ? 'vector_search' : 'theme_based'
      }
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    
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

async function getThemeBasedRecommendations(
  supabase: any,
  userId: string,
  themes: string[],
  emotions: string[],
  type: string,
  limit: number,
  excludeFragmentId?: string
) {
  // Build query for theme-based recommendations
  let query = supabase
    .from('fragment')
    .select(`
      id,
      title,
      body,
      system_themes,
      system_emotions,
      created_at
    `)
    .eq('user_id', userId);

  if (excludeFragmentId) {
    query = query.neq('id', excludeFragmentId);
  }

  const { data: fragments, error } = await query.limit(50); // Get more to filter

  if (error || !fragments) {
    return [];
  }

  // Score fragments based on theme and emotion overlap
  const scoredFragments = fragments
    .map((fragment: any) => {
      const fragmentThemes = fragment.system_themes || [];
      const fragmentEmotions = fragment.system_emotions || [];
      
      const themeOverlap = themes.filter(theme => 
        fragmentThemes.some((ft: string) => ft.toLowerCase().includes(theme.toLowerCase()))
      ).length;
      
      const emotionOverlap = emotions.filter(emotion => 
        fragmentEmotions.some((fe: string) => fe.toLowerCase().includes(emotion.toLowerCase()))
      ).length;

      const score = (themeOverlap * 2 + emotionOverlap) / (themes.length + emotions.length);

      return {
        ...fragment,
        score,
        themeOverlap,
        emotionOverlap
      };
    })
    .filter((fragment: any) => fragment.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, limit);

  return scoredFragments.map((fragment: any) => ({
    id: fragment.id,
    title: fragment.title,
    snippet: fragment.body?.substring(0, 200) + '...',
    similarity: fragment.score,
    themes: fragment.system_themes || [],
    emotions: fragment.system_emotions || [],
    reason: `${fragment.themeOverlap} shared themes, ${fragment.emotionOverlap} shared emotions`,
    type: 'theme_based',
    recommendedAt: new Date().toISOString()
  }));
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

    // Get user's recent fragments for general recommendations
    const { data: recentFragments, error: fragmentsError } = await supabase
      .from('fragment')
      .select(`
        id,
        title,
        body,
        system_themes,
        system_emotions,
        created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (fragmentsError || !recentFragments?.length) {
      return NextResponse.json({
        recommendations: [],
        message: 'No fragments found for recommendations'
      });
    }

    // Analyze user's content patterns
    const allThemes = recentFragments.flatMap(f => f.system_themes || []);
    const allEmotions = recentFragments.flatMap(f => f.system_emotions || []);
    
    const themeFrequency = allThemes.reduce((acc, theme) => {
      acc[theme] = (acc[theme] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const emotionFrequency = allEmotions.reduce((acc, emotion) => {
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topThemes = Object.entries(themeFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([theme]) => theme);

    const topEmotions = Object.entries(emotionFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([emotion]) => emotion);

    return NextResponse.json({
      userPatterns: {
        topThemes,
        topEmotions,
        totalFragments: recentFragments.length,
        analysisAvailable: recentFragments.filter(f => f.system_themes?.length || f.system_emotions?.length).length
      },
      suggestions: {
        exploreThemes: topThemes.slice(0, 3),
        exploreEmotions: topEmotions.slice(0, 3),
        writingPrompts: [
          `Write about a time when you experienced ${topEmotions[0] || 'joy'}`,
          `Explore your relationship with ${topThemes[0] || 'family'}`,
          `Reflect on how you've grown in the area of ${topThemes[1] || 'personal development'}`
        ]
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting user recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
