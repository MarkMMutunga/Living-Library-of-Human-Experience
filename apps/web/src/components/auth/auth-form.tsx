/**
 * Living Library of Human Experience - Authentication Form Component
 * 
 * Copyright (c) 2025 Mark Mikile Mutunga
 * Author: Mark Mikile Mutunga <markmiki03@gmail.com>
 * Phone: +254 707 678 643
 * 
 * This file is part of the Living Library of Human Experience platform.
 * Licensed under proprietary license - see LICENSE file for details.
 */

'use client'

import { useState } from 'react'

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: 'Check your email for a magic link to sign in!' 
        })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Failed to send magic link' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
      </div>

      {message && (
        <div className={`p-3 rounded-md text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md font-medium transition-colors"
      >
        {loading ? 'Sending...' : 'Send Magic Link'}
      </button>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          We'll send you a secure link to sign in without a password
        </p>
      </div>
    </form>
  )
}
