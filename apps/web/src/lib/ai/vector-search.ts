import { createClient } from '@/lib/supabase/server';
import { aiAnalysisService } from './openai-service';

export interface VectorSearchResult {
  fragmentId: string;
  title: string;
  content: string;
  similarity: number;
  themes: string[];
  emotions: string[];
  metadata: any;
}

export interface SearchFilters {
  themes?: string[];
  emotions?: string[];
  timeRange?: {
    start?: Date;
    end?: Date;
  };
  authors?: string[];
  minSimilarity?: number;
  contentType?: string[];
}

export class VectorSearchService {
  
  /**
   * Perform semantic search using vector similarity
   */
  async semanticSearch(
    query: string,
    filters: SearchFilters = {},
    limit: number = 10
  ): Promise<VectorSearchResult[]> {
    
    try {
      const supabase = createClient();
      
      // Generate embedding for search query
      const queryEmbedding = await aiAnalysisService.generateEmbedding(query);
      
      // Build the vector search query
      let searchQuery = supabase
        .from('fragment')
        .select(`
          id,
          title,
          body,
          system_themes,
          system_emotions,
          created_at,
          author:app_user(email, id),
          embedding
        `)
        .not('embedding', 'is', null);

      // Apply filters
      if (filters.themes && filters.themes.length > 0) {
        searchQuery = searchQuery.overlaps('system_themes', filters.themes);
      }

      if (filters.emotions && filters.emotions.length > 0) {
        searchQuery = searchQuery.overlaps('system_emotions', filters.emotions);
      }

      if (filters.timeRange?.start) {
        searchQuery = searchQuery.gte('created_at', filters.timeRange.start.toISOString());
      }

      if (filters.timeRange?.end) {
        searchQuery = searchQuery.lte('created_at', filters.timeRange.end.toISOString());
      }

      if (filters.authors && filters.authors.length > 0) {
        searchQuery = searchQuery.in('user_id', filters.authors);
      }

      // Execute search with vector similarity
      const { data: fragments, error } = await searchQuery.limit(limit * 3); // Get more for filtering

      if (error) {
        throw new Error(`Search query failed: ${error.message}`);
      }

      if (!fragments || fragments.length === 0) {
        return [];
      }

      // Calculate similarities and filter results
      const results: VectorSearchResult[] = fragments
        .map(fragment => {
          if (!fragment.embedding) return null;
          
          // Parse embedding from string to array
          let embeddingArray: number[];
          try {
            embeddingArray = typeof fragment.embedding === 'string' 
              ? JSON.parse(fragment.embedding) 
              : fragment.embedding;
          } catch (e) {
            return null;
          }
          
          const similarity = this.cosineSimilarity(queryEmbedding, embeddingArray);
          
          // Apply minimum similarity filter
          if (filters.minSimilarity && similarity < filters.minSimilarity) {
            return null;
          }

          return {
            fragmentId: fragment.id,
            title: fragment.title,
            content: fragment.body,
            similarity,
            themes: fragment.system_themes || [],
            emotions: fragment.system_emotions || [],
            metadata: {
              author: fragment.author,
              createdAt: fragment.created_at
            }
          };
        })
        .filter((result): result is VectorSearchResult => result !== null)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return results;
    } catch (error) {
      console.error('Error in semantic search:', error);
      throw new Error('Failed to perform semantic search');
    }
  }

  /**
   * Find similar fragments to a given fragment
   */
  async findSimilarFragments(
    fragmentId: string,
    limit: number = 10,
    excludeSelf: boolean = true
  ): Promise<VectorSearchResult[]> {
    
    try {
      const supabase = createClient();
      
      // Get the source fragment and its embedding
      const { data: sourceFragment, error: sourceError } = await supabase
        .from('fragment')
        .select('embedding, body, system_themes, system_emotions')
        .eq('id', fragmentId)
        .single();

      if (sourceError || !sourceFragment?.embedding) {
        throw new Error('Source fragment not found or missing embedding');
      }

      // Parse source embedding
      let sourceEmbedding: number[];
      try {
        sourceEmbedding = typeof sourceFragment.embedding === 'string' 
          ? JSON.parse(sourceFragment.embedding) 
          : sourceFragment.embedding;
      } catch (e) {
        throw new Error('Invalid source embedding format');
      }

      // Search for similar fragments
      let searchQuery = supabase
        .from('fragment')
        .select(`
          id,
          title,
          body,
          system_themes,
          system_emotions,
          created_at,
          author:app_user(email, id),
          embedding
        `)
        .not('embedding', 'is', null);

      if (excludeSelf) {
        searchQuery = searchQuery.neq('id', fragmentId);
      }

      const { data: candidates, error: searchError } = await searchQuery.limit(limit * 5);

      if (searchError) {
        throw new Error(`Similar fragments search failed: ${searchError.message}`);
      }

      if (!candidates || candidates.length === 0) {
        return [];
      }

      // Calculate similarities and return top results
      const results: VectorSearchResult[] = candidates
        .map(candidate => {
          if (!candidate.embedding) return null;
          
          // Parse candidate embedding
          let candidateEmbedding: number[];
          try {
            candidateEmbedding = typeof candidate.embedding === 'string' 
              ? JSON.parse(candidate.embedding) 
              : candidate.embedding;
          } catch (e) {
            return null;
          }
          
          const similarity = this.cosineSimilarity(sourceEmbedding, candidateEmbedding);
          
          return {
            fragmentId: candidate.id,
            title: candidate.title,
            content: candidate.body,
            similarity,
            themes: candidate.system_themes || [],
            emotions: candidate.system_emotions || [],
            metadata: {
              author: candidate.author,
              createdAt: candidate.created_at
            }
          };
        })
        .filter((result): result is VectorSearchResult => result !== null)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return results;
    } catch (error) {
      console.error('Error finding similar fragments:', error);
      throw new Error('Failed to find similar fragments');
    }
  }

  /**
   * Hybrid search combining full-text and vector search
   */
  async hybridSearch(
    query: string,
    filters: SearchFilters = {},
    limit: number = 10,
    weights: { vector: number; fulltext: number } = { vector: 0.7, fulltext: 0.3 }
  ): Promise<VectorSearchResult[]> {
    
    try {
      // Perform both searches in parallel
      const [vectorResults, fulltextResults] = await Promise.all([
        this.semanticSearch(query, filters, limit * 2),
        this.fulltextSearch(query, filters, limit * 2)
      ]);

      // Combine and rerank results
      const combinedResults = this.combineSearchResults(
        vectorResults,
        fulltextResults,
        weights,
        limit
      );

      return combinedResults;
    } catch (error) {
      console.error('Error in hybrid search:', error);
      throw new Error('Failed to perform hybrid search');
    }
  }

  /**
   * Full-text search using PostgreSQL FTS
   */
  async fulltextSearch(
    query: string,
    filters: SearchFilters = {},
    limit: number = 10
  ): Promise<VectorSearchResult[]> {
    
    try {
      const supabase = createClient();
      
      // Build full-text search query
      let searchQuery = supabase
        .from('fragment')
        .select(`
          id,
          title,
          body,
          system_themes,
          system_emotions,
          created_at,
          author:app_user(email, id)
        `)
        .textSearch('body', query, {
          type: 'websearch',
          config: 'english'
        });

      // Apply same filters as semantic search
      if (filters.themes && filters.themes.length > 0) {
        searchQuery = searchQuery.overlaps('system_themes', filters.themes);
      }

      if (filters.emotions && filters.emotions.length > 0) {
        searchQuery = searchQuery.overlaps('system_emotions', filters.emotions);
      }

      if (filters.timeRange?.start) {
        searchQuery = searchQuery.gte('created_at', filters.timeRange.start.toISOString());
      }

      if (filters.timeRange?.end) {
        searchQuery = searchQuery.lte('created_at', filters.timeRange.end.toISOString());
      }

      if (filters.authors && filters.authors.length > 0) {
        searchQuery = searchQuery.in('user_id', filters.authors);
      }

      const { data: fragments, error } = await searchQuery.limit(limit);

      if (error) {
        throw new Error(`Full-text search failed: ${error.message}`);
      }

      if (!fragments || fragments.length === 0) {
        return [];
      }

      // Convert to standard result format
      const results: VectorSearchResult[] = fragments.map((fragment, index) => ({
        fragmentId: fragment.id,
        title: fragment.title,
        content: fragment.body,
        similarity: 1 - (index / fragments.length), // Simple relevance score
        themes: fragment.system_themes || [],
        emotions: fragment.system_emotions || [],
        metadata: {
          author: fragment.author,
          createdAt: fragment.created_at
        }
      }));

      return results;
    } catch (error) {
      console.error('Error in full-text search:', error);
      throw new Error('Failed to perform full-text search');
    }
  }

  /**
   * Generate and store embeddings for a fragment
   */
  async generateAndStoreEmbedding(fragmentId: string, content: string): Promise<void> {
    try {
      const supabase = createClient();
      
      // Generate embedding
      const embedding = await aiAnalysisService.generateEmbedding(content);
      
      // Convert to string for storage
      const embeddingString = JSON.stringify(embedding);
      
      // Store embedding in database
      const { error } = await supabase
        .from('fragment')
        .update({ embedding: embeddingString })
        .eq('id', fragmentId);

      if (error) {
        throw new Error(`Failed to store embedding: ${error.message}`);
      }
    } catch (error) {
      console.error('Error generating and storing embedding:', error);
      throw new Error('Failed to generate and store embedding');
    }
  }

  /**
   * Batch process embeddings for existing fragments
   */
  async batchProcessEmbeddings(batchSize: number = 10): Promise<{ processed: number; errors: number }> {
    try {
      const supabase = createClient();
      
      // Get fragments without embeddings
      const { data: fragments, error } = await supabase
        .from('fragment')
        .select('id, body, title')
        .is('embedding', null)
        .limit(batchSize);

      if (error) {
        throw new Error(`Failed to fetch fragments: ${error.message}`);
      }

      if (!fragments || fragments.length === 0) {
        return { processed: 0, errors: 0 };
      }

      let processed = 0;
      let errors = 0;

      // Process fragments in batches
      for (const fragment of fragments) {
        try {
          await this.generateAndStoreEmbedding(
            fragment.id,
            `${fragment.title}\n\n${fragment.body}`
          );
          processed++;
        } catch (error) {
          console.error(`Failed to process fragment ${fragment.id}:`, error);
          errors++;
        }
        
        // Add small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return { processed, errors };
    } catch (error) {
      console.error('Error in batch processing embeddings:', error);
      throw new Error('Failed to batch process embeddings');
    }
  }

  // Private helper methods

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private combineSearchResults(
    vectorResults: VectorSearchResult[],
    fulltextResults: VectorSearchResult[],
    weights: { vector: number; fulltext: number },
    limit: number
  ): VectorSearchResult[] {
    
    const resultMap = new Map<string, VectorSearchResult>();
    
    // Add vector results with weighted scores
    vectorResults.forEach(result => {
      resultMap.set(result.fragmentId, {
        ...result,
        similarity: result.similarity * weights.vector
      });
    });

    // Add or combine fulltext results
    fulltextResults.forEach(result => {
      const existing = resultMap.get(result.fragmentId);
      if (existing) {
        // Combine scores
        existing.similarity += result.similarity * weights.fulltext;
      } else {
        // Add new result
        resultMap.set(result.fragmentId, {
          ...result,
          similarity: result.similarity * weights.fulltext
        });
      }
    });

    // Sort by combined score and return top results
    return Array.from(resultMap.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }
}

// Export singleton instance
export const vectorSearchService = new VectorSearchService();
