'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CreateFragmentForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    eventAt: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm format
    locationText: '',
    visibility: 'PRIVATE' as const,
    tags: [] as string[],
  })
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/fragments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          eventAt: new Date(formData.eventAt).toISOString(),
        }),
      })

      if (response.ok) {
        const { fragment } = await response.json()
        router.push(`/fragments/${fragment.id}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create fragment')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
          Title *
        </label>
        <input
          id="title"
          type="text"
          required
          maxLength={80}
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Give your experience a meaningful title..."
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {formData.title.length}/80 characters
        </p>
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-foreground mb-2">
          Your Experience *
        </label>
        <textarea
          id="body"
          required
          rows={8}
          value={formData.body}
          onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
          placeholder="Describe your experience, thoughts, feelings, and any important details..."
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-vertical"
        />
      </div>

      <div>
        <label htmlFor="eventAt" className="block text-sm font-medium text-foreground mb-2">
          When did this happen? *
        </label>
        <input
          id="eventAt"
          type="datetime-local"
          required
          value={formData.eventAt}
          onChange={(e) => setFormData(prev => ({ ...prev, eventAt: e.target.value }))}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="locationText" className="block text-sm font-medium text-foreground mb-2">
          Location (optional)
        </label>
        <input
          id="locationText"
          type="text"
          value={formData.locationText}
          onChange={(e) => setFormData(prev => ({ ...prev, locationText: e.target.value }))}
          placeholder="Where did this happen? (e.g., 'Coffee shop in downtown', 'Home', 'Central Park')"
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Tags (optional)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a tag..."
            className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
          >
            Add
          </button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-primary/60 hover:text-primary"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="visibility" className="block text-sm font-medium text-foreground mb-2">
          Privacy Setting
        </label>
        <select
          id="visibility"
          value={formData.visibility}
          onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as any }))}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        >
          <option value="PRIVATE">Private (only you can see)</option>
          <option value="UNLISTED">Unlisted (accessible via direct link)</option>
          <option value="PUBLIC">Public (visible to everyone)</option>
        </select>
      </div>

      <div className="flex gap-4 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-4 py-2 border border-input rounded-md text-foreground hover:bg-accent hover:text-accent-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md font-medium transition-colors"
        >
          {loading ? 'Creating...' : 'Create Fragment'}
        </button>
      </div>
    </form>
  )
}
