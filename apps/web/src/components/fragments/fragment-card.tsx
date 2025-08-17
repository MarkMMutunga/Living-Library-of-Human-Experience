'use client'

import { Fragment } from '@/types/database'
import { formatRelativeTime, truncateText } from '@/lib/utils'

interface FragmentCardProps {
  fragment: Fragment
}

export function FragmentCard({ fragment }: FragmentCardProps) {
  const mediaCount = Array.isArray(fragment.media) ? fragment.media.length : 0

  return (
    <div className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-card-foreground mb-1">
            {fragment.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <time>{formatRelativeTime(fragment.event_at)}</time>
            {fragment.location_text && (
              <>
                <span>•</span>
                <span>{fragment.location_text}</span>
              </>
            )}
          </div>
        </div>
        
        {/* Status indicator */}
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          fragment.status === 'READY' 
            ? 'bg-green-100 text-green-800' 
            : fragment.status === 'PROCESSING'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {fragment.status}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-card-foreground">
          {truncateText(fragment.body, 200)}
        </p>
      </div>

      {/* Media indicator */}
      {mediaCount > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span>{mediaCount} attachment{mediaCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* Tags and Emotions */}
      <div className="space-y-2 mb-4">
        {fragment.tags && fragment.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {fragment.tags.slice(0, 5).map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
            {fragment.tags.length > 5 && (
              <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                +{fragment.tags.length - 5} more
              </span>
            )}
          </div>
        )}

        {fragment.system_emotions && fragment.system_emotions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {fragment.system_emotions.slice(0, 3).map((emotion, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
              >
                {emotion}
              </span>
            ))}
          </div>
        )}

        {fragment.system_themes && fragment.system_themes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {fragment.system_themes.slice(0, 3).map((theme, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {theme}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className={`flex items-center gap-1 ${
            fragment.visibility === 'PUBLIC' ? 'text-green-600' :
            fragment.visibility === 'UNLISTED' ? 'text-yellow-600' :
            'text-gray-600'
          }`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              {fragment.visibility === 'PUBLIC' ? (
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              ) : fragment.visibility === 'UNLISTED' ? (
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              ) : (
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              )}
            </svg>
            {fragment.visibility.toLowerCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button className="text-primary hover:text-primary/80 text-sm font-medium">
            View
          </button>
          <button className="text-muted-foreground hover:text-foreground text-sm">
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}
