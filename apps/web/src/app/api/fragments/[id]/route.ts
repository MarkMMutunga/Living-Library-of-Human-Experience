import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateFragmentSchema } from '@/lib/validations'

// GET /api/fragments/[id] - Get specific fragment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fragmentId = params.id

    // Get fragment with links
    const { data: fragment, error } = await supabase
      .from('fragment')
      .select(`
        *,
        links_from:link!link_from_id_fkey(
          id,
          to_id,
          type,
          score,
          reason,
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
        ),
        links_to:link!link_to_id_fkey(
          id,
          from_id,
          type,
          score,
          reason,
          from_fragment:fragment!link_from_id_fkey(
            id,
            title,
            body,
            event_at,
            visibility,
            tags,
            system_emotions,
            system_themes
          )
        )
      `)
      .eq('id', fragmentId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Fragment not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch fragment' }, { status: 500 })
    }

    return NextResponse.json({ fragment })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/fragments/[id] - Update fragment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fragmentId = params.id
    const body = await request.json()
    const validated = updateFragmentSchema.parse(body)

    // Update fragment
    const { data: fragment, error } = await supabase
      .from('fragment')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fragmentId)
      .eq('user_id', user.id) // Ensure user owns the fragment
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Fragment not found or access denied' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update fragment' }, { status: 500 })
    }

    // If content changed, reprocess the fragment
    if (validated.title || validated.body) {
      await reprocessFragment(fragmentId)
    }

    return NextResponse.json({ fragment })

  } catch (error) {
    console.error('API error:', error)
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/fragments/[id] - Delete fragment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fragmentId = params.id

    // Get fragment to check ownership and get media URLs
    const { data: fragment, error: fetchError } = await supabase
      .from('fragment')
      .select('user_id, media')
      .eq('id', fragmentId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Fragment not found' }, { status: 404 })
      }
      console.error('Database error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch fragment' }, { status: 500 })
    }

    // Check ownership
    if (fragment.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete associated media files
    const mediaItems = fragment.media as any[]
    for (const mediaItem of mediaItems) {
      try {
        // Extract file path from URL
        const url = new URL(mediaItem.url)
        const filePath = url.pathname.split('/').pop()
        if (filePath) {
          await supabase.storage
            .from('fragments')
            .remove([filePath])
        }
      } catch (mediaError) {
        console.error('Failed to delete media file:', mediaError)
        // Continue with fragment deletion even if media cleanup fails
      }
    }

    // Delete fragment (this will cascade delete links due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('fragment')
      .delete()
      .eq('id', fragmentId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete fragment' }, { status: 500 })
    }

    // Log audit event
    await supabase
      .from('audit_event')
      .insert({
        user_id: user.id,
        action: 'fragment_deleted',
        subject_id: fragmentId,
        meta: { deleted_at: new Date().toISOString() },
      })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to reprocess fragment
async function reprocessFragment(fragmentId: string) {
  try {
    const supabase = createClient()
    
    // Mark fragment as processing
    await supabase
      .from('fragment')
      .update({ status: 'PROCESSING' })
      .eq('id', fragmentId)

    // In a real implementation, this would enqueue the fragment for reprocessing
    // For now, we'll skip this
    console.log('Would reprocess fragment:', fragmentId)
    
  } catch (error) {
    console.error('Failed to reprocess fragment:', error)
  }
}
