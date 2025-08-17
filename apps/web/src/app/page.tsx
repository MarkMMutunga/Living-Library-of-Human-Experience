/**
 * Living Library of Human Experience - Main Page
 * 
 * Copyright (c) 2025 Mark Mikile Mutunga
 * Author: Mark Mikile Mutunga <markmiki03@gmail.com>
 * Phone: +254 707 678 643
 * 
 * This file is part of the Living Library of Human Experience platform.
 * Licensed under proprietary license - see LICENSE file for details.
 */

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FragmentsList } from '@/components/fragments/fragments-list'
import { CreateFragmentButton } from '@/components/fragments/create-fragment-button'
import { SearchBar } from '@/components/search/search-bar'
import LandingPage from './landing/page'

export default async function HomePage({
  searchParams,
}: {
  searchParams: { q?: string; tab?: string }
}) {
  const supabase = createClient()
  
  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    // Show landing page for unauthenticated users
    return <LandingPage />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">
              Living Library of Human Experiences
            </h1>
            <div className="flex items-center gap-4">
              <CreateFragmentButton />
              <div className="text-sm text-muted-foreground">
                Welcome, {user?.email || 'User'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="space-y-6">
              {/* Search */}
              <div>
                <h2 className="text-lg font-semibold mb-3">Search</h2>
                <SearchBar defaultValue={searchParams.q} />
              </div>

              {/* Navigation */}
              <nav>
                <h2 className="text-lg font-semibold mb-3">Explore</h2>
                <ul className="space-y-2">
                  <li>
                    <a 
                      href="/?tab=all" 
                      className={`block px-3 py-2 rounded-md text-sm hover:bg-accent ${
                        (!searchParams.tab || searchParams.tab === 'all') ? 'bg-accent' : ''
                      }`}
                    >
                      All Fragments
                    </a>
                  </li>
                  <li>
                    <a 
                      href="/?tab=themes" 
                      className={`block px-3 py-2 rounded-md text-sm hover:bg-accent ${
                        searchParams.tab === 'themes' ? 'bg-accent' : ''
                      }`}
                    >
                      By Themes
                    </a>
                  </li>
                  <li>
                    <a 
                      href="/?tab=emotions" 
                      className={`block px-3 py-2 rounded-md text-sm hover:bg-accent ${
                        searchParams.tab === 'emotions' ? 'bg-accent' : ''
                      }`}
                    >
                      By Emotions
                    </a>
                  </li>
                  <li>
                    <a 
                      href="/?tab=map" 
                      className={`block px-3 py-2 rounded-md text-sm hover:bg-accent ${
                        searchParams.tab === 'map' ? 'bg-accent' : ''
                      }`}
                    >
                      Map View
                    </a>
                  </li>
                  <li>
                    <a 
                      href="/?tab=timeline" 
                      className={`block px-3 py-2 rounded-md text-sm hover:bg-accent ${
                        searchParams.tab === 'timeline' ? 'bg-accent' : ''
                      }`}
                    >
                      Timeline
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">
            <Suspense fallback={<div>Loading fragments...</div>}>
              <FragmentsList 
                searchQuery={searchParams.q}
                activeTab={searchParams.tab || 'all'}
              />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}
