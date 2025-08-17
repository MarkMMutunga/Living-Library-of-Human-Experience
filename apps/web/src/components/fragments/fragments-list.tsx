/**
 * Living Library of Human Experience - Fragments List Component
 * 
 * Copyright (c) 2025 Mark Mikile Mutunga
 * Author: Mark Mikile Mutunga <markmiki03@gmail.com>
 * Phone: +254 707 678 643
 * 
 * This file is part of the Living Library of Human Experience platform.
 * Licensed under proprietary license - see LICENSE file for details.
 */

'use client'

import { useEffect, useState } from 'react'
import { Fragment } from '@/types/database'
import { FragmentCard } from './fragment-card'

interface FragmentsListProps {
  searchQuery?: string
  activeTab: string
}

export function FragmentsList({ searchQuery, activeTab }: FragmentsListProps) {
  const [fragments, setFragments] = useState<Fragment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFragments() {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        if (searchQuery) params.set('q', searchQuery)
        params.set('limit', '20')

        const response = await fetch(`/api/fragments?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch fragments')
        }

        const data = await response.json()
        setFragments(data.fragments || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchFragments()
  }, [searchQuery])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted rounded-lg p-6">
              <div className="h-4 bg-muted-foreground/20 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-muted-foreground/20 rounded w-full mb-2"></div>
              <div className="h-4 bg-muted-foreground/20 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (fragments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          {searchQuery 
            ? `No fragments found for "${searchQuery}"`
            : 'No fragments yet. Create your first experience fragment!'
          }
        </p>
        {!searchQuery && (
          <a 
            href="/create" 
            className="text-primary hover:underline"
          >
            Create your first fragment
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {searchQuery ? `Search results for "${searchQuery}"` : 'Your Fragments'}
        </h2>
        <span className="text-sm text-muted-foreground">
          {fragments.length} fragment{fragments.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-4">
        {fragments.map((fragment) => (
          <FragmentCard key={fragment.id} fragment={fragment} />
        ))}
      </div>
    </div>
  )
}
