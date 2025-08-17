'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, Clock, Tag, Heart, Calendar, MapPin, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchFilters {
  themes: string[];
  emotions: string[];
  timeRange: {
    start?: Date;
    end?: Date;
    era?: string;
  };
  contentType: string;
  sentiment: string;
  location: string;
  people: string[];
}

interface SearchSuggestion {
  type: string;
  value: string;
  confidence: number;
  context?: string;
  count?: number;
}

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
  significance: number;
}

interface AdvancedSearchResults {
  fragments: SearchResult[];
  clusters: SearchCluster[];
  suggestions: SearchSuggestion[];
  analytics: {
    totalResults: number;
    searchTime: number;
    method: string;
    relevanceScore: number;
  };
  insights: {
    patterns: string[];
    themes: string[];
    timeDistribution: Record<string, number>;
    emotionalTone: string;
  };
}

interface AdvancedSearchInterfaceProps {
  onResultsChange?: (results: AdvancedSearchResults | null) => void;
  className?: string;
}

export function AdvancedSearchInterface({ 
  onResultsChange, 
  className = '' 
}: AdvancedSearchInterfaceProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    themes: [],
    emotions: [],
    timeRange: {},
    contentType: 'all',
    sentiment: 'all',
    location: '',
    people: []
  });
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [availableFilters, setAvailableFilters] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<AdvancedSearchResults | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load available filters on mount
  useEffect(() => {
    loadAvailableFilters();
    loadSearchHistory();
  }, []);

  // Load suggestions when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 2) {
        loadSuggestions(query);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const loadAvailableFilters = async () => {
    try {
      const response = await fetch('/api/search/advanced?action=filters');
      if (response.ok) {
        const data = await response.json();
        setAvailableFilters(data.availableFilters);
      }
    } catch (error) {
      console.error('Failed to load available filters:', error);
    }
  };

  const loadSuggestions = async (searchQuery: string) => {
    try {
      const response = await fetch(`/api/search/advanced?action=suggestions&q=${encodeURIComponent(searchQuery)}&limit=8`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const loadSearchHistory = () => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history).slice(0, 5));
    }
  };

  const saveToSearchHistory = (searchQuery: string) => {
    const history = [searchQuery, ...searchHistory.filter(q => q !== searchQuery)].slice(0, 5);
    setSearchHistory(history);
    localStorage.setItem('searchHistory', JSON.stringify(history));
  };

  const performSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch('/api/search/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          filters: {
            themes: filters.themes,
            emotions: filters.emotions,
            timeRange: filters.timeRange,
            contentType: filters.contentType !== 'all' ? filters.contentType : undefined,
            sentiment: filters.sentiment !== 'all' ? filters.sentiment : undefined,
            location: filters.location || undefined,
            people: filters.people
          },
          options: {
            includeAnalytics: true,
            includeClustering: true,
            includeSuggestions: true,
            limit: 20
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
        onResultsChange?.(data.results);
        saveToSearchHistory(query.trim());
        setSuggestions([]); // Clear suggestions after search
      } else {
        const error = await response.json();
        console.error('Search failed:', error);
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('Search error:', error);
      // TODO: Show error message to user
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      performSearch();
    }
  };

  const applySuggestion = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'query') {
      setQuery(suggestion.value);
    } else if (suggestion.type === 'theme') {
      setFilters(prev => ({
        ...prev,
        themes: [...prev.themes, suggestion.value].filter((v, i, arr) => arr.indexOf(v) === i)
      }));
    } else if (suggestion.type === 'emotion') {
      setFilters(prev => ({
        ...prev,
        emotions: [...prev.emotions, suggestion.value].filter((v, i, arr) => arr.indexOf(v) === i)
      }));
    }
    setSuggestions([]);
  };

  const removeFilter = (type: keyof SearchFilters, value: string) => {
    setFilters(prev => {
      if (type === 'themes' || type === 'emotions' || type === 'people') {
        return {
          ...prev,
          [type]: (prev[type] as string[]).filter(v => v !== value)
        };
      }
      return prev;
    });
  };

  const clearAllFilters = () => {
    setFilters({
      themes: [],
      emotions: [],
      timeRange: {},
      contentType: 'all',
      sentiment: 'all',
      location: '',
      people: []
    });
  };

  const hasActiveFilters = filters.themes.length > 0 || filters.emotions.length > 0 || 
    Object.keys(filters.timeRange).length > 0 || filters.contentType !== 'all' || 
    filters.sentiment !== 'all' || filters.location || filters.people.length > 0;

  return (
    <div className={`advanced-search-interface ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search your memories, themes, emotions..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={hasActiveFilters ? "default" : "outline"}
            size="sm"
            className="px-4 py-3"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {filters.themes.length + filters.emotions.length + (filters.location ? 1 : 0)}
              </span>
            )}
          </Button>

          <Button
            onClick={performSearch}
            disabled={!query.trim() || isSearching}
            size="sm"
            className="px-6 py-3"
          >
            {isSearching ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              'Search'
            )}
          </Button>
        </div>

        {/* Search Suggestions */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => applySuggestion(suggestion)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between group"
              >
                <div className="flex items-center space-x-2">
                  {suggestion.type === 'theme' && <Tag className="h-3 w-3 text-blue-500" />}
                  {suggestion.type === 'emotion' && <Heart className="h-3 w-3 text-red-500" />}
                  {suggestion.type === 'time' && <Clock className="h-3 w-3 text-green-500" />}
                  {suggestion.type === 'query' && <Search className="h-3 w-3 text-gray-500" />}
                  <span className="text-sm font-medium">{suggestion.value}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {suggestion.count && (
                    <span className="text-xs text-gray-500">({suggestion.count})</span>
                  )}
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100">
                    {suggestion.context}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Search History */}
        {query.length === 0 && searchHistory.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-40 bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
            <div className="px-4 py-2 text-xs font-medium text-gray-500 border-b">Recent Searches</div>
            {searchHistory.map((historyQuery, index) => (
              <button
                key={index}
                onClick={() => setQuery(historyQuery)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm flex items-center space-x-2"
              >
                <Clock className="h-3 w-3 text-gray-400" />
                <span>{historyQuery}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Advanced Filters</h3>
            {hasActiveFilters && (
              <Button onClick={clearAllFilters} variant="ghost" size="sm">
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Themes Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                <Tag className="inline h-3 w-3 mr-1" />
                Themes
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value && !filters.themes.includes(e.target.value)) {
                    setFilters(prev => ({
                      ...prev,
                      themes: [...prev.themes, e.target.value]
                    }));
                  }
                  e.target.value = '';
                }}
                className="w-full text-sm border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Add theme...</option>
                {availableFilters?.themes?.map((theme: any) => (
                  <option key={theme.value} value={theme.value}>
                    {theme.value} ({theme.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Emotions Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                <Heart className="inline h-3 w-3 mr-1" />
                Emotions
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value && !filters.emotions.includes(e.target.value)) {
                    setFilters(prev => ({
                      ...prev,
                      emotions: [...prev.emotions, e.target.value]
                    }));
                  }
                  e.target.value = '';
                }}
                className="w-full text-sm border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Add emotion...</option>
                {availableFilters?.emotions?.map((emotion: any) => (
                  <option key={emotion.value} value={emotion.value}>
                    {emotion.value} ({emotion.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Time Period Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                <Calendar className="inline h-3 w-3 mr-1" />
                Time Period
              </label>
              <select
                value={filters.timeRange.era || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  timeRange: { ...prev.timeRange, era: e.target.value || undefined }
                }))}
                className="w-full text-sm border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Any time</option>
                <option value="childhood">Childhood</option>
                <option value="youth">Youth</option>
                <option value="adulthood">Adulthood</option>
                <option value="recent">Recent</option>
              </select>
            </div>

            {/* Content Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <select
                value={filters.contentType}
                onChange={(e) => setFilters(prev => ({ ...prev, contentType: e.target.value }))}
                className="w-full text-sm border border-gray-300 rounded px-3 py-2"
              >
                <option value="all">All content</option>
                <option value="short">Short stories</option>
                <option value="medium">Medium stories</option>
                <option value="long">Long stories</option>
              </select>
            </div>

            {/* Sentiment Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                <Zap className="inline h-3 w-3 mr-1" />
                Sentiment
              </label>
              <select
                value={filters.sentiment}
                onChange={(e) => setFilters(prev => ({ ...prev, sentiment: e.target.value }))}
                className="w-full text-sm border border-gray-300 rounded px-3 py-2"
              >
                <option value="all">Any sentiment</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="neutral">Neutral</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                <MapPin className="inline h-3 w-3 mr-1" />
                Location
              </label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter location..."
                className="w-full text-sm border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {filters.themes.map(theme => (
                  <span
                    key={theme}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {theme}
                    <button
                      onClick={() => removeFilter('themes', theme)}
                      className="ml-1 hover:text-blue-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                
                {filters.emotions.map(emotion => (
                  <span
                    key={emotion}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800"
                  >
                    <Heart className="h-3 w-3 mr-1" />
                    {emotion}
                    <button
                      onClick={() => removeFilter('emotions', emotion)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                {filters.timeRange.era && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    <Calendar className="h-3 w-3 mr-1" />
                    {filters.timeRange.era}
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, timeRange: {} }))}
                      className="ml-1 hover:text-green-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {filters.location && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                    <MapPin className="h-3 w-3 mr-1" />
                    {filters.location}
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, location: '' }))}
                      className="ml-1 hover:text-purple-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Results Summary */}
      {results && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="font-medium text-blue-900">
                {results.analytics.totalResults} results found
              </span>
              <span className="text-blue-700">
                in {results.analytics.searchTime}ms
              </span>
              <span className="text-blue-600">
                via {results.analytics.method} search
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-700">Relevance:</span>
              <span className="font-medium text-blue-900">
                {Math.round(results.analytics.relevanceScore * 100)}%
              </span>
            </div>
          </div>
          
          {results.insights.patterns.length > 0 && (
            <div className="mt-2 text-xs text-blue-800">
              <strong>Patterns:</strong> {results.insights.patterns.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
