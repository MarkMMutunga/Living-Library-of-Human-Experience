import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface StoryAnalysis {
  themes: string[];
  emotions: string[];
  timeContext: {
    period: string;
    significance: number;
    seasonality?: string;
  };
  relationships: string[];
  insights: string[];
  patterns: string[];
  narrativeArc: string;
  emotionalJourney: {
    start: string;
    peak: string;
    resolution: string;
  };
  universalElements: string[];
  personalGrowth: string[];
  summary: string;
  keyMoments: string[];
}

export interface ContentEmbedding {
  fragmentId: string;
  embedding: number[];
  metadata: {
    themes: string[];
    emotions: string[];
    timeContext: any;
    quality: number;
  };
}

export class AIAnalysisService {
  
  /**
   * Analyze story content using OpenAI GPT-4
   */
  async analyzeStoryContent(content: string, title?: string): Promise<StoryAnalysis> {
    try {
      const prompt = this.buildAnalysisPrompt(content, title);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert literary analyst specializing in personal narratives and human experiences. Analyze the provided story with deep psychological insight and emotional intelligence."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(response) as StoryAnalysis;
    } catch (error) {
      console.error('Error analyzing story content:', error);
      throw new Error('Failed to analyze story content');
    }
  }

  /**
   * Generate embeddings for semantic search
   */
  async generateEmbedding(content: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-large",
        input: content,
        dimensions: 1536, // Standard dimension for high-quality embeddings
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Find similar content using vector similarity
   */
  async findSimilarContent(
    queryEmbedding: number[],
    candidateEmbeddings: ContentEmbedding[],
    limit: number = 10
  ): Promise<{ fragmentId: string; similarity: number; metadata: any }[]> {
    
    const similarities = candidateEmbeddings.map(candidate => ({
      fragmentId: candidate.fragmentId,
      similarity: this.cosineSimilarity(queryEmbedding, candidate.embedding),
      metadata: candidate.metadata
    }));

    // Sort by similarity and return top results
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Generate personalized recommendations
   */
  async generateRecommendations(
    userProfile: any,
    userHistory: any[],
    availableContent: any[],
    type: 'similar' | 'discover' | 'trending' = 'similar'
  ): Promise<any[]> {
    
    try {
      const prompt = this.buildRecommendationPrompt(userProfile, userHistory, availableContent, type);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are a sophisticated recommendation engine that understands human psychology and storytelling. Provide personalized content recommendations based on user behavior and preferences."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(response);
      return result.recommendations || [];
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  /**
   * Analyze temporal patterns in user's story collection
   */
  async analyzeTemporalPatterns(stories: any[]): Promise<any> {
    try {
      const prompt = this.buildTemporalAnalysisPrompt(stories);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are a narrative pattern analyst who specializes in understanding life journeys and temporal storytelling patterns. Analyze the chronological and thematic patterns in a person's story collection."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1800,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(response);
    } catch (error) {
      console.error('Error analyzing temporal patterns:', error);
      throw new Error('Failed to analyze temporal patterns');
    }
  }

  /**
   * Generate insights for community analytics
   */
  async generateCommunityInsights(communityData: any): Promise<any> {
    try {
      const prompt = this.buildCommunityInsightsPrompt(communityData);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are a community analytics expert who understands human behavior in storytelling communities. Analyze community patterns and provide actionable insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating community insights:', error);
      throw new Error('Failed to generate community insights');
    }
  }

  // Private helper methods

  private buildAnalysisPrompt(content: string, title?: string): string {
    return `
Analyze this personal story and provide a comprehensive psychological and literary analysis in JSON format:

${title ? `Title: ${title}` : ''}
Content: ${content}

Please provide analysis in the following JSON structure:
{
  "themes": ["array of 3-7 main themes"],
  "emotions": ["array of 4-8 emotions present"],
  "timeContext": {
    "period": "life period (childhood/youth/adulthood/recent)",
    "significance": "significance score 1-10",
    "seasonality": "seasonal context if applicable"
  },
  "relationships": ["key relationships mentioned"],
  "insights": ["3-5 psychological insights"],
  "patterns": ["narrative patterns identified"],
  "narrativeArc": "description of story arc",
  "emotionalJourney": {
    "start": "initial emotional state",
    "peak": "emotional climax",
    "resolution": "final emotional state"
  },
  "universalElements": ["universal human experiences"],
  "personalGrowth": ["growth/learning elements"],
  "summary": "2-3 sentence story summary",
  "keyMoments": ["pivotal moments in the narrative"]
}

Focus on psychological depth, emotional nuance, and universal human experiences.
    `;
  }

  private buildRecommendationPrompt(
    userProfile: any,
    userHistory: any[],
    availableContent: any[],
    type: string
  ): string {
    return `
Generate personalized story recommendations for a user based on their profile and reading history.

User Profile: ${JSON.stringify(userProfile)}
Reading History: ${JSON.stringify(userHistory.slice(0, 10))} // Last 10 items
Recommendation Type: ${type}

Available Content Sample: ${JSON.stringify(availableContent.slice(0, 20))} // First 20 items

Provide recommendations in this JSON format:
{
  "recommendations": [
    {
      "fragmentId": "content ID",
      "title": "story title",
      "relevanceScore": "0.0-1.0",
      "reason": "why this is recommended",
      "themes": ["relevant themes"],
      "estimatedEngagement": "predicted engagement level"
    }
  ],
  "explanations": {
    "strategy": "recommendation strategy used",
    "userInsights": "insights about user preferences"
  }
}

Consider user's emotional journey, theme preferences, and reading patterns.
    `;
  }

  private buildTemporalAnalysisPrompt(stories: any[]): string {
    return `
Analyze the temporal and thematic patterns in this collection of personal stories:

Stories: ${JSON.stringify(stories)}

Provide analysis in this JSON format:
{
  "timelineInsights": {
    "majorLifePhases": ["identified life phases"],
    "narrativeArcs": ["overarching story arcs"],
    "growthPatterns": ["personal development patterns"]
  },
  "thematicEvolution": {
    "emergingThemes": ["themes that appear over time"],
    "consistentElements": ["persistent themes"],
    "transformations": ["how themes evolved"]
  },
  "emotionalPatterns": {
    "cyclicalEmotions": ["recurring emotional patterns"],
    "emotionalGrowth": ["emotional development over time"],
    "significantShifts": ["major emotional transitions"]
  },
  "lifeStoryMeta": {
    "overallNarrative": "person's life story theme",
    "characterDevelopment": "how the person has evolved",
    "futureProjections": ["potential future themes/growth"]
  }
}
    `;
  }

  private buildCommunityInsightsPrompt(communityData: any): string {
    return `
Analyze this community storytelling data and provide insights:

Community Data: ${JSON.stringify(communityData)}

Provide insights in this JSON format:
{
  "contentTrends": {
    "emergingThemes": ["trending story themes"],
    "popularFormats": ["successful content formats"],
    "engagementPatterns": ["what drives engagement"]
  },
  "userBehavior": {
    "readingPatterns": ["how users consume content"],
    "creationPatterns": ["how users create content"],
    "communityInteractions": ["interaction patterns"]
  },
  "healthMetrics": {
    "diversityAssessment": "community diversity analysis",
    "inclusivityScore": "how welcoming the community is",
    "contentQuality": "overall content quality trends"
  },
  "recommendations": [
    {
      "category": "feature/content/community",
      "priority": "high/medium/low",
      "recommendation": "specific actionable recommendation",
      "expectedImpact": "predicted impact"
    }
  ]
}
    `;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
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
}

// Export singleton instance
export const aiAnalysisService = new AIAnalysisService();
