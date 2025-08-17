/**
 * Living Library of Human Experience - Create Fragment Page
 * 
 * Copyright (c) 2025 Mark Mikile Mutunga
 * Author: Mark Mikile Mutunga <markmiki03@gmail.com>
 * Phone: +254 707 678 643
 * 
 * This file is part of the Living Library of Human Experience platform.
 * Licensed under proprietary license - see LICENSE file for details.
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateFragmentForm } from '@/components/fragments/create-fragment-form'

export default async function CreateFragmentPage() {
  const supabase = createClient()
  
  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/login')
  }

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
              Create New Fragment
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <CreateFragmentForm />
        </div>
      </main>
    </div>
  )
}
