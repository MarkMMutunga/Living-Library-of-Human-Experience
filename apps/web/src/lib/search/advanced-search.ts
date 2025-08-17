import { createClient } from '@/lib/supabase/server';
import { aiAnalysisService } from '../ai/openai-service';
import { vectorSearchService } from '../ai/vector-search';

export interface AdvancedSearchFilters {
  themes?: string[];
  emotions?: string[];
  timeRange?: {
    start?: Date;
    end?: Date;
    era?: 'childhood' | 'youth' | 'adulthood' | 'recent';
  };
  contentType?: 'all' | 'short' | 'medium' | 'long';
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
  significance?: {
    min?: number;
    max?: number;
  };
  location?: string;
  people?: string[];
  events?: string[];
}

export interface SearchSuggestion {
  type: 'theme' | 'emotion' | 'person' | 'place' | 'time' | 'query';
  value: string;
  confidence: number;
  context?: string;
  count?: number;
}

export interface SearchCluster {
  id: string;
  title: string;
  description: string;
  fragments: any[];
  commonThemes: string[];
  commonEmotions: string[];
  timeSpan?: {
    start: Date;
    end: Date;
  };
  significance: number;
}

export interface AdvancedSearchResult {
  fragments: any[];
  clusters: SearchCluster[];
  suggestions: SearchSuggestion[];
  analytics: {
    totalResults: number;
    searchTime: number;
    method: 'semantic' | 'traditional' | 'hybrid';
    relevanceScore: number;
  };
  insights: {
    patterns: string[];
    themes: string[];
    timeDistribution: any;
    emotionalTone: string;
  };
}

export class AdvancedSearchService {
  
  /**
   * Perform comprehensive search with advanced filtering and clustering
   */
  async advancedSearch(
    query: string,
    filters: AdvancedSearchFilters = {},
    userId: string,
    options: {
      includeAnalytics?: boolean;
      includeClustering?: boolean;
      includeSuggestions?: boolean;
      limit?: number;
    } = {}
  ): Promise<AdvancedSearchResult> {
    
    const startTime = Date.now();
    const {
      includeAnalytics = true,
      includeClustering = true,
      includeSuggestions = true,
      limit = 20
    } = options;

    try {
      // Step 1: Execute multi-method search
      const searchResults = await this.executeMultiMethodSearch(
        query,
        filters,
        userId,
        limit
      );

      // Step 2: Cluster results if requested
      let clusters: SearchCluster[] = [];
      if (includeClustering && searchResults.length > 3) {
        clusters = await this.clusterSearchResults(searchResults);
      }

      // Step 3: Generate search suggestions if requested
      let suggestions: SearchSuggestion[] = [];
      if (includeSuggestions) {
        suggestions = await this.generateSearchSuggestions(
          query,
          filters,
          userId,
          searchResults
        );
      }

      // Step 4: Generate analytics and insights
      const searchTime = Date.now() - startTime;
      const analytics = includeAnalytics 
        ? await this.generateSearchAnalytics(searchResults, searchTime)
        : {
            totalResults: searchResults.length,
            searchTime,
            method: 'hybrid' as const,
            relevanceScore: 0.8
          };

      const insights = await this.generateSearchInsights(searchResults, query);

      return {
        fragments: searchResults.slice(0, limit),
        clusters,
        suggestions,
        analytics,
        insights
      };

    } catch (error) {
      console.error('Advanced search error:', error);
      throw new Error('Search failed');
    }
  }

  /**
   * Execute search using multiple methods and merge results
   */
  private async executeMultiMethodSearch(
    query: string,
    filters: AdvancedSearchFilters,
    userId: string,
    limit: number
  ): Promise<any[]> {
    
    const supabase = createClient();
    let allResults: any[] = [];

    // Method 1: Semantic/Vector Search (if query provided)
    if (query.trim()) {
      try {
        const semanticResults = await vectorSearchService.semanticSearch(
          query,
          this.convertToSearchFilters(filters),
          Math.min(limit, 10)
        );
        
        allResults = semanticResults.map(result => ({
          ...result,
          searchMethod: 'semantic',
          relevanceScore: result.similarity || 0.8
        }));
      } catch (error) {
        console.error('Semantic search failed:', error);
      }
    }

    // Method 2: Traditional Database Search
    let dbQuery = supabase
      .from('fragment')
      .select(`
        id,
        title,
        body,
        system_themes,
        system_emotions,
        created_at,
        updated_at,
        user_id
      `)
      .eq('user_id', userId);

    // Apply text search
    if (query.trim()) {
      dbQuery = dbQuery.or(`title.ilike.%${query}%,body.ilike.%${query}%`);
    }

    // Apply filters
    dbQuery = this.applyAdvancedFilters(dbQuery, filters);

    const { data: dbResults, error } = await dbQuery
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && dbResults) {
      const dbResultsWithScore = dbResults.map(result => ({
        ...result,
        searchMethod: 'traditional',
        relevanceScore: this.calculateRelevanceScore(result, query, filters)
      }));

      // Merge and deduplicate results
      const existingIds = new Set(allResults.map(r => r.id));
      const newResults = dbResultsWithScore.filter(r => !existingIds.has(r.id));
      allResults = [...allResults, ...newResults];
    }

    // Sort by relevance score
    return allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Cluster search results by themes, time, and content similarity
   */
  private async clusterSearchResults(results: any[]): Promise<SearchCluster[]> {
    
    if (results.length < 3) return [];

    try {
      // Group by common themes first
      const themeGroups = this.groupByThemes(results);
      
      // Create clusters from theme groups
      const clusters: SearchCluster[] = [];
      
      for (const [themeKey, fragments] of Object.entries(themeGroups)) {
        if (fragments.length >= 2) {
          const commonThemes = this.extractCommonThemes(fragments);
          const commonEmotions = this.extractCommonEmotions(fragments);
          const timeSpan = this.calculateTimeSpan(fragments);
          
          clusters.push({
            id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: this.generateClusterTitle(commonThemes, fragments.length),
            description: this.generateClusterDescription(commonThemes, commonEmotions, fragments.length),
            fragments,
            commonThemes,
            commonEmotions,
            timeSpan,
            significance: this.calculateClusterSignificance(fragments)
          });
        }
      }

      // Sort clusters by significance
      return clusters.sort((a, b) => b.significance - a.significance);

    } catch (error) {
      console.error('Clustering failed:', error);
      return [];
    }
  }

  /**
   * Generate intelligent search suggestions
   */
  async generateSearchSuggestions(
    query: string,
    filters: AdvancedSearchFilters,
    userId: string,
    results: any[]
  ): Promise<SearchSuggestion[]> {
    
    const suggestions: SearchSuggestion[] = [];
    const supabase = createClient();

    try {
      // Get user's content for suggestions
      const { data: userFragments } = await supabase
        .from('fragment')
        .select('system_themes, system_emotions, title, body')
        .eq('user_id', userId)
        .limit(100);

      if (!userFragments) return suggestions;

      // Extract popular themes
      const allThemes = userFragments.flatMap(f => f.system_themes || []);
      const themeCount = allThemes.reduce((acc, theme) => {
        acc[theme] = (acc[theme] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const popularThemes = Object.entries(themeCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .filter(([theme, count]) => count >= 2);

      popularThemes.forEach(([theme, count]) => {
        suggestions.push({
          type: 'theme',
          value: theme,
          confidence: Math.min(0.9, count / userFragments.length * 2),
          context: `Found in ${count} of your stories`,
          count
        });
      });

      // Extract popular emotions
      const allEmotions = userFragments.flatMap(f => f.system_emotions || []);
      const emotionCount = allEmotions.reduce((acc, emotion) => {
        acc[emotion] = (acc[emotion] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const popularEmotions = Object.entries(emotionCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .filter(([emotion, count]) => count >= 2);

      popularEmotions.forEach(([emotion, count]) => {
        suggestions.push({
          type: 'emotion',
          value: emotion,
          confidence: Math.min(0.8, count / userFragments.length * 2),
          context: `Appears in ${count} memories`,
          count
        });
      });

      // Generate AI-powered query suggestions if OpenAI is available
      if (query && query.length > 3) {
        try {
          const relatedQueries = await this.generateRelatedQueries(query, results);
          relatedQueries.forEach(relatedQuery => {
            suggestions.push({
              type: 'query',
              value: relatedQuery,
              confidence: 0.7,
              context: 'AI suggested'
            });
          });
        } catch (error) {
          console.error('AI suggestion generation failed:', error);
        }
      }

      // Time-based suggestions
      const timeBasedSuggestions = this.generateTimeBasedSuggestions(userFragments);
      suggestions.push(...timeBasedSuggestions);

      return suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10);

    } catch (error) {
      console.error('Suggestion generation failed:', error);
      return [];
    }
  }

  /**
   * Generate search analytics and insights
   */
  private async generateSearchAnalytics(
    results: any[],
    searchTime: number
  ): Promise<AdvancedSearchResult['analytics']> {
    
    const semanticResults = results.filter(r => r.searchMethod === 'semantic');
    const traditionalResults = results.filter(r => r.searchMethod === 'traditional');
    
    const method = semanticResults.length > traditionalResults.length 
      ? 'semantic' 
      : traditionalResults.length > semanticResults.length 
        ? 'traditional' 
        : 'hybrid';

    const relevanceScore = results.length > 0
      ? results.reduce((sum, r) => sum + (r.relevanceScore || 0.5), 0) / results.length
      : 0;

    return {
      totalResults: results.length,
      searchTime,
      method,
      relevanceScore: Math.round(relevanceScore * 100) / 100
    };
  }

  /**
   * Generate insights about search results
   */
  private async generateSearchInsights(
    results: any[],
    query: string
  ): Promise<AdvancedSearchResult['insights']> {
    
    if (results.length === 0) {
      return {
        patterns: [],
        themes: [],
        timeDistribution: {},
        emotionalTone: 'neutral'
      };
    }

    // Extract patterns
    const patterns = this.identifyPatterns(results);
    
    // Extract themes
    const allThemes = results.flatMap(r => r.system_themes || []);
    const uniqueThemes = [...new Set(allThemes)].slice(0, 5);
    
    // Time distribution
    const timeDistribution = this.analyzeTimeDistribution(results);
    
    // Emotional tone analysis
    const emotionalTone = this.analyzeEmotionalTone(results);

    return {
      patterns,
      themes: uniqueThemes,
      timeDistribution,
      emotionalTone
    };
  }

  // Helper methods
  private convertToSearchFilters(filters: AdvancedSearchFilters): any {
    return {
      themes: filters.themes,
      emotions: filters.emotions,
      timeRange: filters.timeRange
    };
  }

  private applyAdvancedFilters(query: any, filters: AdvancedSearchFilters): any {
    if (filters.themes?.length) {
      query = query.overlaps('system_themes', filters.themes);
    }

    if (filters.emotions?.length) {
      query = query.overlaps('system_emotions', filters.emotions);
    }

    if (filters.timeRange?.start) {
      query = query.gte('created_at', filters.timeRange.start.toISOString());
    }

    if (filters.timeRange?.end) {
      query = query.lte('created_at', filters.timeRange.end.toISOString());
    }

    return query;
  }

  private calculateRelevanceScore(
    result: any, 
    query: string, 
    filters: AdvancedSearchFilters
  ): number {
    let score = 0.5; // Base score

    // Text relevance
    if (query) {
      const titleMatch = result.title?.toLowerCase().includes(query.toLowerCase()) ? 0.3 : 0;
      const bodyMatch = result.body?.toLowerCase().includes(query.toLowerCase()) ? 0.2 : 0;
      score += titleMatch + bodyMatch;
    }

    // Theme relevance
    if (filters.themes?.length && result.system_themes) {
      const themeMatches = filters.themes.filter(theme => 
        result.system_themes.includes(theme)
      ).length;
      score += (themeMatches / filters.themes.length) * 0.2;
    }

    // Emotion relevance
    if (filters.emotions?.length && result.system_emotions) {
      const emotionMatches = filters.emotions.filter(emotion => 
        result.system_emotions.includes(emotion)
      ).length;
      score += (emotionMatches / filters.emotions.length) * 0.1;
    }

    return Math.min(1, score);
  }

  private groupByThemes(results: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
    results.forEach(result => {
      const themes = result.system_themes || [];
      const mainTheme = themes[0] || 'general';
      
      if (!groups[mainTheme]) {
        groups[mainTheme] = [];
      }
      groups[mainTheme].push(result);
    });

    return groups;
  }

  private extractCommonThemes(fragments: any[]): string[] {
    const allThemes = fragments.flatMap(f => f.system_themes || []);
    const themeCount = allThemes.reduce((acc, theme) => {
      acc[theme] = (acc[theme] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(themeCount)
      .filter(([, count]) => (count as number) >= 2)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([theme]) => theme);
  }

  private extractCommonEmotions(fragments: any[]): string[] {
    const allEmotions = fragments.flatMap(f => f.system_emotions || []);
    const emotionCount = allEmotions.reduce((acc, emotion) => {
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(emotionCount)
      .filter(([, count]) => (count as number) >= 2)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([emotion]) => emotion);
  }

  private calculateTimeSpan(fragments: any[]): { start: Date; end: Date } | undefined {
    const dates = fragments
      .map(f => new Date(f.created_at))
      .filter(d => !isNaN(d.getTime()));

    if (dates.length === 0) return undefined;

    return {
      start: new Date(Math.min(...dates.map(d => d.getTime()))),
      end: new Date(Math.max(...dates.map(d => d.getTime())))
    };
  }

  private calculateClusterSignificance(fragments: any[]): number {
    // Simple significance calculation based on fragment count and theme consistency
    const baseScore = Math.min(fragments.length / 10, 1); // Max 1 for 10+ fragments
    const themeConsistency = this.calculateThemeConsistency(fragments);
    return (baseScore + themeConsistency) / 2;
  }

  private calculateThemeConsistency(fragments: any[]): number {
    const allThemes = fragments.flatMap(f => f.system_themes || []);
    const uniqueThemes = new Set(allThemes);
    return uniqueThemes.size > 0 ? allThemes.length / uniqueThemes.size / fragments.length : 0;
  }

  private generateClusterTitle(themes: string[], count: number): string {
    if (themes.length === 0) return `${count} Related Memories`;
    if (themes.length === 1) return `${themes[0]} Stories (${count})`;
    return `${themes[0]} & ${themes[1]} Collection (${count})`;
  }

  private generateClusterDescription(
    themes: string[], 
    emotions: string[], 
    count: number
  ): string {
    const themeText = themes.length > 0 ? themes.slice(0, 2).join(' and ') : 'various themes';
    const emotionText = emotions.length > 0 ? emotions.slice(0, 2).join(' and ') : 'mixed emotions';
    return `${count} memories exploring ${themeText} with ${emotionText}`;
  }

  private async generateRelatedQueries(query: string, results: any[]): Promise<string[]> {
    try {
      // Use AI to generate related queries based on search results
      const themes = results.flatMap(r => r.system_themes || []).slice(0, 5);
      const prompt = `Based on the search query "${query}" and these related themes: ${themes.join(', ')}, suggest 3 related search queries that might interest someone exploring their personal memories:`;
      
      // This would call OpenAI to generate suggestions
      // For now, return simple variations
      return [
        `${query} memories`,
        `childhood ${query}`,
        `recent ${query}`
      ].filter(q => q !== query);
    } catch (error) {
      return [];
    }
  }

  private generateTimeBasedSuggestions(fragments: any[]): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    
    // Recent memories suggestion
    suggestions.push({
      type: 'time',
      value: 'recent memories',
      confidence: 0.6,
      context: 'Explore what you\'ve written recently'
    });

    // Seasonal suggestions based on current date
    const currentMonth = new Date().getMonth();
    const seasons = ['winter', 'spring', 'summer', 'fall'];
    const currentSeason = seasons[Math.floor(currentMonth / 3)];
    
    suggestions.push({
      type: 'time',
      value: `${currentSeason} memories`,
      confidence: 0.5,
      context: `Current season: ${currentSeason}`
    });

    return suggestions;
  }

  private identifyPatterns(results: any[]): string[] {
    const patterns: string[] = [];
    
    if (results.length > 5) {
      patterns.push('Rich collection of memories');
    }
    
    const timeSpan = this.calculateTimeSpan(results);
    if (timeSpan) {
      const daysDiff = Math.floor((timeSpan.end.getTime() - timeSpan.start.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 365) {
        patterns.push('Spans multiple years');
      } else if (daysDiff > 30) {
        patterns.push('Covers several months');
      }
    }

    const commonThemes = this.extractCommonThemes(results);
    if (commonThemes.length > 0) {
      patterns.push(`Common themes: ${commonThemes.slice(0, 2).join(', ')}`);
    }

    return patterns;
  }

  private analyzeTimeDistribution(results: any[]): any {
    const distribution: Record<string, number> = {};
    
    results.forEach(result => {
      const date = new Date(result.created_at);
      const year = date.getFullYear().toString();
      distribution[year] = (distribution[year] || 0) + 1;
    });

    return distribution;
  }

  private analyzeEmotionalTone(results: any[]): string {
    const allEmotions = results.flatMap(r => r.system_emotions || []);
    
    if (allEmotions.length === 0) return 'neutral';

    const positiveEmotions = ['joy', 'happiness', 'love', 'excitement', 'gratitude', 'hope'];
    const negativeEmotions = ['sadness', 'anger', 'fear', 'anxiety', 'disappointment'];
    
    const positiveCount = allEmotions.filter(e => 
      positiveEmotions.some(pe => e.toLowerCase().includes(pe))
    ).length;
    
    const negativeCount = allEmotions.filter(e => 
      negativeEmotions.some(ne => e.toLowerCase().includes(ne))
    ).length;

    if (positiveCount > negativeCount * 1.5) return 'positive';
    if (negativeCount > positiveCount * 1.5) return 'negative';
    return 'mixed';
  }
}

export const advancedSearchService = new AdvancedSearchService();
