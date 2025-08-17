import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiAnalysisService } from '@/lib/ai/openai-service';
import { vectorSearchService } from '@/lib/ai/vector-search';

interface StoryMappingRequest {
  fragmentId?: string;
  content?: string;
  title?: string;
  generateEmbedding?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body: StoryMappingRequest = await request.json();
    const { fragmentId, content, title, generateEmbedding = true } = body;

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let fragmentContent = content;
    let fragmentTitle = title;

    // If fragmentId provided, fetch the fragment
    if (fragmentId) {
      const { data: fragment, error: fragmentError } = await supabase
        .from('fragment')
        .select('title, body, user_id')
        .eq('id', fragmentId)
        .single();

      if (fragmentError || !fragment) {
        return NextResponse.json({ error: 'Fragment not found' }, { status: 404 });
      }

      // Check if user owns the fragment or has access
      if (fragment.user_id !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      fragmentContent = fragment.body;
      fragmentTitle = fragment.title;
    }

    if (!fragmentContent) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    // Analyze the story using OpenAI
    const analysis = await aiAnalysisService.analyzeStoryContent(
      fragmentContent,
      fragmentTitle
    );

    // Generate and store embedding if requested and fragmentId provided
    if (generateEmbedding && fragmentId) {
      try {
        await vectorSearchService.generateAndStoreEmbedding(
          fragmentId,
          `${fragmentTitle || ''}\n\n${fragmentContent}`
        );
      } catch (embeddingError) {
        console.error('Failed to generate embedding:', embeddingError);
        // Don't fail the request if embedding generation fails
      }
    }

    // Store analysis results in database if fragmentId provided
    if (fragmentId) {
      try {
        await supabase
          .from('fragment')
          .update({
            system_themes: analysis.themes,
            system_emotions: analysis.emotions,
            updated_at: new Date().toISOString()
          })
          .eq('id', fragmentId);
      } catch (updateError) {
        console.error('Failed to update fragment with analysis:', updateError);
        // Don't fail the request if database update fails
      }
    }

    return NextResponse.json({ 
      mapping: analysis,
      fragmentId,
      generatedAt: new Date().toISOString(),
      embeddingGenerated: generateEmbedding && fragmentId
    });
  } catch (error) {
    console.error('Error in story mapping API:', error);
    
    // Return appropriate error message
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
    const fragmentId = searchParams.get('fragmentId');

    if (!fragmentId) {
      return NextResponse.json({ error: 'Fragment ID required' }, { status: 400 });
    }

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch fragment with existing analysis
    const { data: fragment, error: fragmentError } = await supabase
      .from('fragment')
      .select(`
        id,
        title,
        body,
        system_themes,
        system_emotions,
        user_id,
        created_at,
        updated_at
      `)
      .eq('id', fragmentId)
      .single();

    if (fragmentError || !fragment) {
      return NextResponse.json({ error: 'Fragment not found' }, { status: 404 });
    }

    // Check access
    if (fragment.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // If no existing analysis, return indication that analysis is needed
    if (!fragment.system_themes?.length && !fragment.system_emotions?.length) {
      return NextResponse.json({
        fragmentId: fragment.id,
        title: fragment.title,
        analysisAvailable: false,
        message: 'Analysis not yet generated for this fragment'
      });
    }

    // Return existing analysis in expected format
    const mapping = {
      fragmentId: fragment.id,
      themes: fragment.system_themes || [],
      emotions: fragment.system_emotions || [],
      timeContext: {
        period: 'unknown', // Would need additional analysis
        significance: 7.5, // Default value
      },
      relationships: [],
      insights: [`This story explores themes of ${fragment.system_themes?.slice(0, 2).join(' and ')}`],
      patterns: ['Personal narrative pattern'],
      narrativeArc: 'Classic personal experience structure',
      emotionalJourney: {
        start: fragment.system_emotions?.[0] || 'neutral',
        peak: fragment.system_emotions?.[1] || 'intense',
        resolution: fragment.system_emotions?.[2] || 'resolved'
      },
      universalElements: fragment.system_themes?.slice(0, 3) || [],
      personalGrowth: ['Self-reflection', 'Experience integration'],
      summary: `A personal story about ${fragment.system_themes?.slice(0, 2).join(' and ')}`,
      keyMoments: ['Opening moment', 'Central experience', 'Resolution']
    };

    return NextResponse.json({
      mapping,
      analysisAvailable: true,
      lastAnalyzed: fragment.updated_at,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error retrieving story mapping:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
