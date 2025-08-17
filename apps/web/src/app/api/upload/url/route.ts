import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createUploadUrlSchema } from '@/lib/validations'

// POST /api/upload/url - Create signed upload URL
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createUploadUrlSchema.parse(body)

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/m4a',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ]

    if (!allowedTypes.includes(validated.fileType)) {
      return NextResponse.json({ 
        error: 'Unsupported file type',
        allowedTypes 
      }, { status: 400 })
    }

    // Generate unique file path
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2)
    const extension = validated.fileName.split('.').pop()
    const uniqueFileName = `${user.id}/${timestamp}-${random}.${extension}`

    // Create signed upload URL
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('fragments')
      .createSignedUploadUrl(uniqueFileName, {
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage error:', uploadError)
      return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 })
    }

    // Get the public URL for the file
    const { data: publicUrlData } = supabase.storage
      .from('fragments')
      .getPublicUrl(uniqueFileName)

    return NextResponse.json({
      uploadUrl: uploadData.signedUrl,
      publicUrl: publicUrlData.publicUrl,
      filePath: uniqueFileName,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
    })

  } catch (error) {
    console.error('API error:', error)
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
