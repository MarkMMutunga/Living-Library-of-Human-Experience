import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/links/recompute/[fragmentId] - Recompute links for a fragment
export async function POST(
  request: NextRequest,
  { params }: { params: { fragmentId: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fragmentId = params.fragmentId

    // Verify fragment exists and user has access
    const { data: fragment, error: fragmentError } = await supabase
      .from('fragment')
      .select('id, user_id, status')
      .eq('id', fragmentId)
      .single()

    if (fragmentError) {
      if (fragmentError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Fragment not found' }, { status: 404 })
      }
      console.error('Database error:', fragmentError)
      return NextResponse.json({ error: 'Failed to fetch fragment' }, { status: 500 })
    }

    // Check if user owns the fragment or fragment is public
    if (fragment.user_id !== user.id) {
      // Check if fragment is public
      const { data: publicFragment, error: publicError } = await supabase
        .from('fragment')
        .select('visibility')
        .eq('id', fragmentId)
        .eq('visibility', 'PUBLIC')
        .single()

      if (publicError || !publicFragment) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Check if fragment is ready for linking
    if (fragment.status !== 'READY') {
      return NextResponse.json({ 
        error: 'Fragment is not ready for linking',
        status: fragment.status 
      }, { status: 400 })
    }

    try {
      // Remove existing links for this fragment
      await supabase
        .from('link')
        .delete()
        .or(`from_id.eq.${fragmentId},to_id.eq.${fragmentId}`)

      // Create semantic links
      const { error: semanticError } = await supabase
        .rpc('create_semantic_links', { fragment_id: fragmentId })

      if (semanticError) {
        console.error('Semantic links error:', semanticError)
      }

      // Create rule-based links  
      const { error: ruleError } = await supabase
        .rpc('create_rule_links', { fragment_id: fragmentId })

      if (ruleError) {
        console.error('Rule links error:', ruleError)
      }

      // Get the updated links
      const { data: links, error: linksError } = await supabase
        .from('link')
        .select(`
          id,
          type,
          score,
          reason,
          created_at,
          to_fragment:fragment!link_to_id_fkey(
            id,
            title,
            body,
            event_at,
            visibility,
            tags,
            system_emotions,
            system_themes
          )
        `)
        .eq('from_id', fragmentId)
        .order('score', { ascending: false })

      if (linksError) {
        console.error('Links fetch error:', linksError)
        return NextResponse.json({ error: 'Failed to fetch updated links' }, { status: 500 })
      }

      // Log audit event
      await supabase
        .from('audit_event')
        .insert({
          user_id: user.id,
          action: 'links_recomputed',
          subject_id: fragmentId,
          meta: { 
            links_created: links?.length || 0,
            recomputed_at: new Date().toISOString()
          },
        })

      return NextResponse.json({ 
        success: true,
        linksCreated: links?.length || 0,
        links: links || []
      })

    } catch (linkError) {
      console.error('Link computation error:', linkError)
      return NextResponse.json({ error: 'Failed to recompute links' }, { status: 500 })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
