import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { FragmentDetail } from '@/components/fragments/fragment-detail'

interface FragmentPageProps {
  params: { id: string }
}

export default async function FragmentPage({ params }: FragmentPageProps) {
  const supabase = createClient()
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Fetch fragment details
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/fragments/${params.id}`, {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
    })

    if (response.status === 404) {
      notFound()
    }

    if (!response.ok) {
      throw new Error('Failed to fetch fragment')
    }

    const { fragment } = await response.json()

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <a 
                href="/" 
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back to Library
              </a>
              <h1 className="text-2xl font-bold text-foreground">
                Fragment Details
              </h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <FragmentDetail fragment={fragment} />
        </main>
      </div>
    )
  } catch (error) {
    console.error('Error fetching fragment:', error)
    notFound()
  }
}
