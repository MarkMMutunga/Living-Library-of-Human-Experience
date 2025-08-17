'use client'

import { Fragment } from '@/types/database'
import { formatDate, formatRelativeTime } from '@/lib/utils'

interface FragmentDetailProps {
  fragment: Fragment & {
    links_from?: any[]
    links_to?: any[]
  }
}

export function FragmentDetail({ fragment }: FragmentDetailProps) {
  const mediaItems = Array.isArray(fragment.media) ? fragment.media : []
  const allLinks = [...(fragment.links_from || []), ...(fragment.links_to || [])]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Fragment Header */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-card-foreground mb-2">
              {fragment.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <time title={formatDate(fragment.event_at)}>
                {formatRelativeTime(fragment.event_at)}
              </time>
              {fragment.location_text && (
                <>
                  <span>•</span>
                  <span>{fragment.location_text}</span>
                </>
              )}
              <span>•</span>
              <span className={`flex items-center gap-1 ${
                fragment.visibility === 'PUBLIC' ? 'text-green-600' :
                fragment.visibility === 'UNLISTED' ? 'text-yellow-600' :
                'text-gray-600'
              }`}>
                {fragment.visibility.toLowerCase()}
              </span>
            </div>
          </div>
          
          {/* Status indicator */}
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
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
        <div className="prose prose-gray max-w-none mb-6">
          <div className="whitespace-pre-wrap text-card-foreground">
            {fragment.body}
          </div>
        </div>

        {/* Transcript */}
        {fragment.transcript && fragment.transcript.trim() && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Transcript</h3>
            <div className="bg-muted rounded-lg p-4">
              <p className="text-muted-foreground whitespace-pre-wrap">
                {fragment.transcript}
              </p>
            </div>
          </div>
        )}

        {/* Media */}
        {mediaItems.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">
              Attachments ({mediaItems.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mediaItems.map((item: any, index: number) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      {item.type === 'image' && (
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                      {item.type === 'audio' && (
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      )}
                      {item.type === 'video' && (
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-card-foreground">
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)} File
                      </p>
                      {item.duration && (
                        <p className="text-sm text-muted-foreground">
                          Duration: {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                        </p>
                      )}
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 text-sm font-medium"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags and Classifications */}
        <div className="space-y-4">
          {fragment.tags && fragment.tags.length > 0 && (
            <div>
              <h4 className="font-medium text-card-foreground mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {fragment.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {fragment.system_emotions && fragment.system_emotions.length > 0 && (
            <div>
              <h4 className="font-medium text-card-foreground mb-2">Detected Emotions</h4>
              <div className="flex flex-wrap gap-2">
                {fragment.system_emotions.map((emotion, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full"
                  >
                    {emotion}
                  </span>
                ))}
              </div>
            </div>
          )}

          {fragment.system_themes && fragment.system_themes.length > 0 && (
            <div>
              <h4 className="font-medium text-card-foreground mb-2">Detected Themes</h4>
              <div className="flex flex-wrap gap-2">
                {fragment.system_themes.map((theme, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connected Fragments */}
      {allLinks.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">
            Connected Fragments ({allLinks.length})
          </h2>
          <div className="space-y-4">
            {allLinks.slice(0, 6).map((link: any) => {
              const connectedFragment = link.to_fragment || link.from_fragment
              return (
                <div key={link.id} className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-card-foreground mb-1">
                        {connectedFragment.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {connectedFragment.body.slice(0, 150)}...
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-1 rounded-full ${
                          link.type === 'SEMANTIC' ? 'bg-purple-100 text-purple-800' :
                          link.type === 'SHARED_TAG' ? 'bg-blue-100 text-blue-800' :
                          link.type === 'SAME_TIMEWINDOW' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {link.type.replace('_', ' ')}
                        </span>
                        <span className="text-muted-foreground">
                          Score: {(link.score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <a
                      href={`/fragments/${connectedFragment.id}`}
                      className="text-primary hover:text-primary/80 text-sm font-medium"
                    >
                      View →
                    </a>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">
                    <strong>Connection reason:</strong> {link.reason}
                  </div>
                </div>
              )
            })}
          </div>
          {allLinks.length > 6 && (
            <p className="text-center text-muted-foreground mt-4">
              And {allLinks.length - 6} more connections...
            </p>
          )}
        </div>
      )}
    </div>
  )
}
