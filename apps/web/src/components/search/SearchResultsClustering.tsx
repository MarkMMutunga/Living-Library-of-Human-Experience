'use client';

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  Tag, 
  Heart, 
  Star,
  BarChart3,
  Grid3x3,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  themes: string[];
  emotions: string[];
  createdAt: string;
  relevanceScore: number;
  searchMethod: string;
}

interface SearchCluster {
  id: string;
  title: string;
  description: string;
  fragments: SearchResult[];
  commonThemes: string[];
  commonEmotions: string[];
  timeSpan?: {
    start: Date;
    end: Date;
  };
  significance: number;
}

interface SearchResultsClusteringProps {
  clusters: SearchCluster[];
  individualResults: SearchResult[];
  onResultClick?: (result: SearchResult) => void;
  className?: string;
}

type ViewMode = 'clusters' | 'list' | 'grid';

export function SearchResultsClustering({
  clusters = [],
  individualResults = [],
  onResultClick,
  className = ''
}: SearchResultsClusteringProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('clusters');
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'significance'>('relevance');

  const toggleCluster = (clusterId: string) => {
    const newExpanded = new Set(expandedClusters);
    if (newExpanded.has(clusterId)) {
      newExpanded.delete(clusterId);
    } else {
      newExpanded.add(clusterId);
    }
    setExpandedClusters(newExpanded);
  };

  const sortResults = (results: SearchResult[]) => {
    return [...results].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'significance':
          return b.relevanceScore - a.relevanceScore;
        case 'relevance':
        default:
          return b.relevanceScore - a.relevanceScore;
      }
    });
  };

  const sortClusters = (clusterList: SearchCluster[]) => {
    return [...clusterList].sort((a, b) => {
      switch (sortBy) {
        case 'significance':
          return b.significance - a.significance;
        case 'date':
          return b.fragments.length - a.fragments.length; // More fragments = more recent activity
        case 'relevance':
        default:
          return b.significance - a.significance;
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeSpan = (timeSpan?: { start: Date; end: Date }) => {
    if (!timeSpan) return '';
    
    const start = new Date(timeSpan.start);
    const end = new Date(timeSpan.end);
    const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return formatDate(start.toISOString());
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  const ResultCard = ({ result, isInCluster = false }: { result: SearchResult; isInCluster?: boolean }) => (
    <div 
      className={`${isInCluster ? 'ml-6 border-l-2 border-blue-200 pl-4' : ''} bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer`}
      onClick={() => onResultClick?.(result)}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 line-clamp-1">{result.title}</h4>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span className="bg-gray-100 px-2 py-1 rounded">
            {Math.round(result.relevanceScore * 100)}%
          </span>
          <span className={`px-2 py-1 rounded ${
            result.searchMethod === 'semantic' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {result.searchMethod}
          </span>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
        {result.content}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {result.themes.length > 0 && (
            <div className="flex items-center space-x-1">
              <Tag className="h-3 w-3 text-blue-500" />
              <div className="flex space-x-1">
                {result.themes.slice(0, 2).map(theme => (
                  <span key={theme} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {theme}
                  </span>
                ))}
                {result.themes.length > 2 && (
                  <span className="text-xs text-gray-500">+{result.themes.length - 2}</span>
                )}
              </div>
            </div>
          )}
          
          {result.emotions.length > 0 && (
            <div className="flex items-center space-x-1">
              <Heart className="h-3 w-3 text-red-500" />
              <div className="flex space-x-1">
                {result.emotions.slice(0, 2).map(emotion => (
                  <span key={emotion} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                    {emotion}
                  </span>
                ))}
                {result.emotions.length > 2 && (
                  <span className="text-xs text-gray-500">+{result.emotions.length - 2}</span>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>{formatDate(result.createdAt)}</span>
        </div>
      </div>
    </div>
  );

  const ClusterCard = ({ cluster }: { cluster: SearchCluster }) => {
    const isExpanded = expandedClusters.has(cluster.id);
    
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg overflow-hidden">
        <div 
          className="p-4 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => toggleCluster(cluster.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-blue-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-blue-600" />
              )}
              <div>
                <h3 className="font-semibold text-blue-900">{cluster.title}</h3>
                <p className="text-sm text-blue-700 mt-1">{cluster.description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-gray-700">
                  {Math.round(cluster.significance * 10) / 10}
                </span>
              </div>
              <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                {cluster.fragments.length} memories
              </span>
            </div>
          </div>
          
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {cluster.commonThemes.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Tag className="h-3 w-3 text-blue-600" />
                  <span className="text-xs text-blue-800">
                    {cluster.commonThemes.join(', ')}
                  </span>
                </div>
              )}
              
              {cluster.commonEmotions.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Heart className="h-3 w-3 text-red-600" />
                  <span className="text-xs text-red-800">
                    {cluster.commonEmotions.join(', ')}
                  </span>
                </div>
              )}
            </div>
            
            {cluster.timeSpan && (
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <Clock className="h-3 w-3" />
                <span>{formatTimeSpan(cluster.timeSpan)}</span>
              </div>
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div className="border-t border-blue-200 bg-white">
            <div className="p-4 space-y-3">
              {sortResults(cluster.fragments).map(result => (
                <ResultCard key={result.id} result={result} isInCluster={true} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const sortedClusters = sortClusters(clusters);
  const sortedIndividualResults = sortResults(individualResults);
  const totalResults = clusters.reduce((sum, cluster) => sum + cluster.fragments.length, 0) + individualResults.length;

  return (
    <div className={`search-results-clustering ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">View:</span>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('clusters')}
                className={`px-3 py-1 text-xs ${
                  viewMode === 'clusters' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="h-3 w-3 mr-1 inline" />
                Clusters
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-xs ${
                  viewMode === 'list' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <List className="h-3 w-3 mr-1 inline" />
                List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-xs ${
                  viewMode === 'grid' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Grid3x3 className="h-3 w-3 mr-1 inline" />
                Grid
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="relevance">Relevance</option>
              <option value="date">Date</option>
              <option value="significance">Significance</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          {totalResults} total results
          {clusters.length > 0 && ` • ${clusters.length} clusters`}
        </div>
      </div>

      {/* Results Display */}
      <div className="space-y-4">
        {viewMode === 'clusters' && (
          <>
            {/* Clusters */}
            {sortedClusters.map(cluster => (
              <ClusterCard key={cluster.id} cluster={cluster} />
            ))}
            
            {/* Individual Results */}
            {sortedIndividualResults.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Individual Results ({sortedIndividualResults.length})
                </h3>
                <div className="space-y-3">
                  {sortedIndividualResults.map(result => (
                    <ResultCard key={result.id} result={result} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {viewMode === 'list' && (
          <div className="space-y-3">
            {[
              ...sortedClusters.flatMap(cluster => cluster.fragments),
              ...sortedIndividualResults
            ].map(result => (
              <ResultCard key={result.id} result={result} />
            ))}
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              ...sortedClusters.flatMap(cluster => cluster.fragments),
              ...sortedIndividualResults
            ].map(result => (
              <ResultCard key={result.id} result={result} />
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      {totalResults === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <BarChart3 className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600">
            Try adjusting your search terms or filters to find more content.
          </p>
        </div>
      )}

      {/* Quick Actions */}
      {totalResults > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedClusters(new Set(clusters.map(c => c.id)))}
              >
                Expand All Clusters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedClusters(new Set())}
              >
                Collapse All
              </Button>
            </div>
            
            <div className="text-xs text-gray-500">
              Found patterns in {clusters.length} clusters across {totalResults} memories
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
