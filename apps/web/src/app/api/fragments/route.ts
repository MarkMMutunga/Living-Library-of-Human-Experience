import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createFragmentSchema, searchFragmentsSchema } from '@/lib/validations'
import { getClassificationService, getEmbeddingService } from '@/lib/ai/factory'

// GET /api/fragments - Search fragments
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const params = {
      q: searchParams.get('q') || '',
      limit: searchParams.get('limit') || '20',
      offset: searchParams.get('offset') || '0',
      visibility: searchParams.get('visibility') || undefined,
      tags: searchParams.getAll('tags'),
      emotions: searchParams.getAll('emotions'),
      themes: searchParams.getAll('themes'),
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
    }

    const validated = searchFragmentsSchema.parse(params)

    // Build query
    let query = supabase
      .from('fragment')
      .select(`
        id,
        title,
        body,
        transcript,
        event_at,
        location_text,
        lat,
        lng,
        visibility,
        tags,
        system_emotions,
        system_themes,
        life_stage,
        media,
        created_at,
        updated_at
      `)

    // Apply filters
    if (validated.visibility) {
      query = query.eq('visibility', validated.visibility)
    }

    if (validated.tags && validated.tags.length > 0) {
      query = query.overlaps('tags', validated.tags)
    }

    if (validated.emotions && validated.emotions.length > 0) {
      query = query.overlaps('system_emotions', validated.emotions)
    }

    if (validated.themes && validated.themes.length > 0) {
      query = query.overlaps('system_themes', validated.themes)
    }

    if (validated.dateFrom) {
      query = query.gte('event_at', validated.dateFrom)
    }

    if (validated.dateTo) {
      query = query.lte('event_at', validated.dateTo)
    }

    // Apply text search if provided
    if (validated.q) {
      // For simple implementation, use ilike search
      // In production, use the search_fragments function for hybrid search
      query = query.or(`title.ilike.%${validated.q}%,body.ilike.%${validated.q}%,transcript.ilike.%${validated.q}%`)
    }

    // Apply pagination and ordering
    query = query
      .order('event_at', { ascending: false })
      .range(validated.offset, validated.offset + validated.limit - 1)

    const { data: fragments, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch fragments' }, { status: 500 })
    }

    return NextResponse.json({ 
      fragments: fragments || [],
      pagination: {
        offset: validated.offset,
        limit: validated.limit,
        total: fragments?.length || 0,
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/fragments - Create fragment
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createFragmentSchema.parse(body)

    // Detect PII in the content
    const classificationService = getClassificationService()
    const fullText = `${validated.title} ${validated.body}`
    const piiDetections = await classificationService.detectPII(fullText)

    if (piiDetections.length > 0) {
      return NextResponse.json({
        error: 'PII detected in content',
        piiDetections,
      }, { status: 400 })
    }

    // Create fragment with PROCESSING status
    const { data: fragment, error } = await supabase
      .from('fragment')
      .insert({
        user_id: user.id,
        title: validated.title,
        body: validated.body,
        event_at: validated.eventAt,
        location_text: validated.locationText,
        lat: validated.lat,
        lng: validated.lng,
        visibility: validated.visibility,
        tags: validated.tags,
        media: validated.media,
        status: 'PROCESSING',
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create fragment' }, { status: 500 })
    }

    // Enqueue background processing
    await enqueueFragmentProcessing(fragment.id)

    return NextResponse.json({ fragment }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to enqueue background processing
async function enqueueFragmentProcessing(fragmentId: string) {
  try {
    // In a real implementation, this would use Supabase Queues
    // For now, we'll process immediately in the background
    processFragmentInBackground(fragmentId)
  } catch (error) {
    console.error('Failed to enqueue fragment processing:', error)
  }
}

// Background processing function
async function processFragmentInBackground(fragmentId: string) {
  try {
    const supabase = createClient()
    
    // Get the fragment
    const { data: fragment, error } = await supabase
      .from('fragment')
      .select('*')
      .eq('id', fragmentId)
      .single()

    if (error || !fragment) {
      console.error('Failed to fetch fragment for processing:', error)
      return
    }

    // Step 1: Transcribe media (if any audio/video)
    let transcript = fragment.transcript
    for (const mediaItem of fragment.media as any[]) {
      if (mediaItem.type === 'audio' || mediaItem.type === 'video') {
        // In a real implementation, this would use the transcription service
        // For now, we'll skip transcription
        console.log('Would transcribe:', mediaItem.url)
      }
    }

    // Step 2: Generate embeddings
    const embeddingService = getEmbeddingService()
    const fullText = `${fragment.title} ${fragment.body} ${transcript}`.slice(0, 8000)
    const embedding = await embeddingService.embed(fullText)

    // Step 3: Classify emotions and themes
    const classificationService = getClassificationService()
    const emotions = await classificationService.classifyEmotions(fullText)
    const themes = await classificationService.classifyThemes(fullText)

    // Step 4: Update fragment with processed data
    await supabase
      .from('fragment')
      .update({
        transcript,
        embedding: `[${embedding.join(',')}]`, // Convert to PostgreSQL array format
        system_emotions: emotions,
        system_themes: themes,
        status: 'READY',
        updated_at: new Date().toISOString(),
      })
      .eq('id', fragmentId)

    // Step 5: Create links
    await createLinksForFragment(fragmentId)

  } catch (error) {
    console.error('Fragment processing error:', error)
    
    // Mark fragment as failed
    const supabase = createClient()
    await supabase
      .from('fragment')
      .update({ status: 'FAILED' })
      .eq('id', fragmentId)
  }
}

// Helper function to create links
async function createLinksForFragment(fragmentId: string) {
  try {
    const supabase = createClient()
    
    // Call the database functions to create links
    await supabase.rpc('create_semantic_links', { fragment_id: fragmentId })
    await supabase.rpc('create_rule_links', { fragment_id: fragmentId })
    
  } catch (error) {
    console.error('Link creation error:', error)
  }
}
