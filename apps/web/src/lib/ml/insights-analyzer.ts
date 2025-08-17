/**
 * Living Library of Human Experience - ML Insights Analyzer
 * 
 * Copyright (c) 2025 Mark Mikile Mutunga
 * Author: Mark Mikile Mutunga <markmiki03@gmail.com>
 * Phone: +254 707 678 643
 * 
 * This file is part of the Living Library of Human Experience platform.
 * Licensed under proprietary license - see LICENSE file for details.
 */

import { createClient } from '@/lib/supabase/server';
import { aiAnalysisService } from '../ai/openai-service';

export interface PersonalPattern {
  id: string;
  type: 'thematic' | 'emotional' | 'temporal' | 'behavioral' | 'growth';
  title: string;
  description: string;
  evidence: string[];
  confidence: number;
  frequency: number;
  significance: number;
  timespan: {
    start: Date;
    end: Date;
  };
  relatedFragments: string[];
  insights: string[];
}

export interface TemporalTrend {
  period: string;
  themes: Record<string, number>;
  emotions: Record<string, number>;
  writingFrequency: number;
  averageLength: number;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  significantEvents: Array<{
    date: Date;
    title: string;
    impact: number;
  }>;
}

export interface GrowthInsight {
  area: string;
  direction: 'growing' | 'declining' | 'stable' | 'cyclical';
  strength: number;
  timeline: Array<{
    period: string;
    value: number;
    evidence: string[];
  }>;
  milestones: Array<{
    date: Date;
    description: string;
    significance: number;
  }>;
  recommendations: string[];
}

export interface RelationshipMapping {
  entity: string;
  type: 'person' | 'place' | 'concept' | 'activity';
  strength: number;
  sentiment: number;
  frequency: number;
  evolution: Array<{
    period: string;
    strength: number;
    sentiment: number;
  }>;
  keyMoments: Array<{
    date: Date;
    fragment: string;
    significance: number;
  }>;
}

export interface InsightsAnalysis {
  patterns: PersonalPattern[];
  temporalTrends: TemporalTrend[];
  growthInsights: GrowthInsight[];
  relationshipMappings: RelationshipMapping[];
  summary: {
    dominantThemes: string[];
    emotionalProfile: Record<string, number>;
    writingStyle: string;
    growthTrajectory: string;
    keyRelationships: string[];
    significantPeriods: string[];
  };
  recommendations: {
    explorationSuggestions: string[];
    writingPrompts: string[];
    reflectionQuestions: string[];
    growthOpportunities: string[];
  };
  metadata: {
    analyzedFragments: number;
    timeSpan: { start: Date; end: Date };
    lastUpdated: Date;
    confidence: number;
  };
}

export class InsightsAnalyzer {
  
  /**
   * Generate comprehensive personal insights from user's content
   */
  async generatePersonalInsights(userId: string): Promise<InsightsAnalysis> {
    try {
      const supabase = createClient();
      
      // Fetch user's fragments
      const { data: fragments, error } = await supabase
        .from('fragment')
        .select(`
          id,
          title,
          body,
          system_themes,
          system_emotions,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error || !fragments || fragments.length === 0) {
        throw new Error('No fragments found for analysis');
      }

      // Parallel analysis of different aspects
      const [
        patterns,
        temporalTrends,
        growthInsights,
        relationshipMappings
      ] = await Promise.all([
        this.identifyPersonalPatterns(fragments),
        this.analyzeTemporalTrends(fragments),
        this.analyzePersonalGrowth(fragments),
        this.mapRelationships(fragments)
      ]);

      // Generate summary insights
      const summary = this.generateSummary(fragments, patterns, temporalTrends, growthInsights);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        fragments, 
        patterns, 
        growthInsights
      );

      // Calculate metadata
      const dates = fragments.map(f => new Date(f.created_at));
      const metadata = {
        analyzedFragments: fragments.length,
        timeSpan: {
          start: new Date(Math.min(...dates.map(d => d.getTime()))),
          end: new Date(Math.max(...dates.map(d => d.getTime())))
        },
        lastUpdated: new Date(),
        confidence: this.calculateOverallConfidence(fragments, patterns)
      };

      return {
        patterns,
        temporalTrends,
        growthInsights,
        relationshipMappings,
        summary,
        recommendations,
        metadata
      };

    } catch (error) {
      console.error('Insights analysis failed:', error);
      throw new Error('Failed to generate personal insights');
    }
  }

  /**
   * Identify recurring personal patterns
   */
  private async identifyPersonalPatterns(fragments: any[]): Promise<PersonalPattern[]> {
    const patterns: PersonalPattern[] = [];

    // Thematic patterns
    const thematicPatterns = this.identifyThematicPatterns(fragments);
    patterns.push(...thematicPatterns);

    // Emotional patterns
    const emotionalPatterns = this.identifyEmotionalPatterns(fragments);
    patterns.push(...emotionalPatterns);

    // Temporal patterns
    const temporalPatterns = this.identifyTemporalPatterns(fragments);
    patterns.push(...temporalPatterns);

    // Behavioral patterns
    const behavioralPatterns = this.identifyBehavioralPatterns(fragments);
    patterns.push(...behavioralPatterns);

    // Growth patterns
    const growthPatterns = this.identifyGrowthPatterns(fragments);
    patterns.push(...growthPatterns);

    return patterns.sort((a, b) => b.significance - a.significance).slice(0, 10);
  }

  /**
   * Analyze temporal trends in themes and emotions
   */
  private analyzeTemporalTrends(fragments: any[]): TemporalTrend[] {
    const trends: TemporalTrend[] = [];
    
    // Group fragments by time periods (yearly, monthly)
    const yearlyGroups = this.groupFragmentsByPeriod(fragments, 'year');
    const monthlyGroups = this.groupFragmentsByPeriod(fragments, 'month');

    // Analyze yearly trends
    for (const [year, yearFragments] of Object.entries(yearlyGroups)) {
      trends.push(this.analyzePeriodTrend(year, yearFragments as any[]));
    }

    // Analyze recent monthly trends
    const recentMonths = Object.entries(monthlyGroups)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 12);

    for (const [month, monthFragments] of recentMonths) {
      trends.push(this.analyzePeriodTrend(month, monthFragments as any[], 'month'));
    }

    return trends;
  }

  /**
   * Analyze personal growth over time
   */
  private async analyzePersonalGrowth(fragments: any[]): Promise<GrowthInsight[]> {
    const growthAreas = [
      'Self-Awareness',
      'Emotional Intelligence',
      'Relationships',
      'Career Development',
      'Life Skills',
      'Mindfulness',
      'Resilience',
      'Creativity'
    ];

    const insights: GrowthInsight[] = [];

    for (const area of growthAreas) {
      const insight = await this.analyzeGrowthInArea(area, fragments);
      if (insight.strength > 0.3) { // Only include significant growth areas
        insights.push(insight);
      }
    }

    return insights.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Map relationships mentioned in fragments
   */
  private mapRelationships(fragments: any[]): RelationshipMapping[] {
    const relationships: Map<string, RelationshipMapping> = new Map();

    fragments.forEach(fragment => {
      const entities = this.extractEntities(fragment.body);
      
      entities.forEach(entity => {
        if (!relationships.has(entity.name)) {
          relationships.set(entity.name, {
            entity: entity.name,
            type: entity.type as 'person' | 'place' | 'concept' | 'activity',
            strength: 0,
            sentiment: 0,
            frequency: 0,
            evolution: [],
            keyMoments: []
          });
        }

        const relationship = relationships.get(entity.name)!;
        relationship.frequency += 1;
        relationship.strength += entity.importance;
        relationship.sentiment += entity.sentiment;
        
        relationship.keyMoments.push({
          date: new Date(fragment.created_at),
          fragment: fragment.id,
          significance: entity.importance
        });
      });
    });

    // Calculate averages and finalize mappings
    const finalMappings = Array.from(relationships.values()).map(rel => ({
      ...rel,
      strength: rel.strength / rel.frequency,
      sentiment: rel.sentiment / rel.frequency,
      evolution: this.calculateRelationshipEvolution(rel, fragments)
    }));

    return finalMappings
      .filter(rel => rel.frequency >= 2) // Only include entities mentioned multiple times
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 15);
  }

  // Helper methods for pattern identification
  private identifyThematicPatterns(fragments: any[]): PersonalPattern[] {
    const patterns: PersonalPattern[] = [];
    const themeFrequency = this.calculateThemeFrequency(fragments);
    
    // Find dominant themes that appear consistently
    const dominantThemes = Object.entries(themeFrequency)
      .filter(([, count]) => count >= Math.max(3, fragments.length * 0.2))
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    dominantThemes.forEach(([theme, count]) => {
      const relevantFragments = fragments.filter(f => 
        f.system_themes?.includes(theme)
      );

      patterns.push({
        id: `thematic_${theme.toLowerCase().replace(/\s+/g, '_')}`,
        type: 'thematic',
        title: `Recurring Focus on ${theme}`,
        description: `This theme appears frequently in your writings, suggesting it's a central aspect of your life experience.`,
        evidence: relevantFragments.slice(0, 3).map(f => f.title),
        confidence: Math.min(0.95, count / fragments.length + 0.5),
        frequency: count,
        significance: count / fragments.length,
        timespan: this.calculatePatternTimespan(relevantFragments),
        relatedFragments: relevantFragments.map(f => f.id),
        insights: [
          `Appears in ${Math.round((count / fragments.length) * 100)}% of your writings`,
          `Consistent presence across ${this.calculateTimeSpanMonths(relevantFragments)} months`,
          `Often associated with ${this.findAssociatedThemes(theme, fragments).join(', ')}`
        ]
      });
    });

    return patterns;
  }

  private identifyEmotionalPatterns(fragments: any[]): PersonalPattern[] {
    const patterns: PersonalPattern[] = [];
    const emotionFrequency = this.calculateEmotionFrequency(fragments);
    
    // Find emotional cycles or dominant emotions
    const dominantEmotions = Object.entries(emotionFrequency)
      .filter(([, count]) => count >= Math.max(2, fragments.length * 0.15))
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    dominantEmotions.forEach(([emotion, count]) => {
      const relevantFragments = fragments.filter(f => 
        f.system_emotions?.includes(emotion)
      );

      patterns.push({
        id: `emotional_${emotion.toLowerCase().replace(/\s+/g, '_')}`,
        type: 'emotional',
        title: `Emotional Pattern: ${emotion}`,
        description: `You frequently experience and write about ${emotion.toLowerCase()}, indicating this emotion plays a significant role in your life narrative.`,
        evidence: relevantFragments.slice(0, 3).map(f => f.title),
        confidence: Math.min(0.9, count / fragments.length + 0.4),
        frequency: count,
        significance: count / fragments.length,
        timespan: this.calculatePatternTimespan(relevantFragments),
        relatedFragments: relevantFragments.map(f => f.id),
        insights: [
          `Present in ${Math.round((count / fragments.length) * 100)}% of your emotional experiences`,
          `Often triggered by ${this.findEmotionalTriggers(emotion, fragments).join(' and ')}`,
          `Associated with themes: ${this.findEmotionAssociatedThemes(emotion, fragments).join(', ')}`
        ]
      });
    });

    return patterns;
  }

  private identifyTemporalPatterns(fragments: any[]): PersonalPattern[] {
    const patterns: PersonalPattern[] = [];
    
    // Analyze writing frequency patterns
    const writingFrequency = this.analyzeWritingFrequency(fragments);
    if (writingFrequency.pattern !== 'random') {
      patterns.push({
        id: 'temporal_writing_frequency',
        type: 'temporal',
        title: `${writingFrequency.pattern} Writing Pattern`,
        description: `You tend to write most frequently during ${writingFrequency.peakPeriod}, suggesting this is when you're most reflective.`,
        evidence: writingFrequency.evidence,
        confidence: writingFrequency.confidence,
        frequency: writingFrequency.frequency,
        significance: 0.6,
        timespan: {
          start: new Date(Math.min(...fragments.map(f => new Date(f.created_at).getTime()))),
          end: new Date(Math.max(...fragments.map(f => new Date(f.created_at).getTime())))
        },
        relatedFragments: fragments.map(f => f.id),
        insights: writingFrequency.insights
      });
    }

    return patterns;
  }

  private identifyBehavioralPatterns(fragments: any[]): PersonalPattern[] {
    const patterns: PersonalPattern[] = [];
    
    // Analyze content length patterns
    const lengthPattern = this.analyzeContentLengthPattern(fragments);
    if (lengthPattern.hasPattern) {
      patterns.push({
        id: 'behavioral_content_length',
        type: 'behavioral',
        title: lengthPattern.title,
        description: lengthPattern.description,
        evidence: lengthPattern.evidence,
        confidence: lengthPattern.confidence,
        frequency: lengthPattern.frequency,
        significance: 0.4,
        timespan: this.calculatePatternTimespan(fragments),
        relatedFragments: fragments.map(f => f.id),
        insights: lengthPattern.insights
      });
    }

    return patterns;
  }

  private identifyGrowthPatterns(fragments: any[]): PersonalPattern[] {
    const patterns: PersonalPattern[] = [];
    
    // Analyze evolution of themes over time
    const themeEvolution = this.analyzeThemeEvolution(fragments);
    
    // Look for emerging themes
    const emergingThemes = themeEvolution.filter(evolution => 
      evolution.trend === 'increasing' && evolution.significance > 0.3
    );

    emergingThemes.forEach(evolution => {
      patterns.push({
        id: `growth_${evolution.theme.toLowerCase().replace(/\s+/g, '_')}`,
        type: 'growth',
        title: `Growing Focus on ${evolution.theme}`,
        description: `Your interest in ${evolution.theme} has been increasing over time, suggesting personal growth in this area.`,
        evidence: evolution.evidence,
        confidence: evolution.confidence,
        frequency: evolution.frequency,
        significance: evolution.significance,
        timespan: evolution.timespan,
        relatedFragments: evolution.relatedFragments,
        insights: evolution.insights
      });
    });

    return patterns;
  }

  // Additional helper methods would be implemented here...
  // Due to length constraints, showing key structure and main methods

  private calculateThemeFrequency(fragments: any[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    fragments.forEach(fragment => {
      (fragment.system_themes || []).forEach((theme: string) => {
        frequency[theme] = (frequency[theme] || 0) + 1;
      });
    });
    return frequency;
  }

  private calculateEmotionFrequency(fragments: any[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    fragments.forEach(fragment => {
      (fragment.system_emotions || []).forEach((emotion: string) => {
        frequency[emotion] = (frequency[emotion] || 0) + 1;
      });
    });
    return frequency;
  }

  private calculatePatternTimespan(fragments: any[]): { start: Date; end: Date } {
    const dates = fragments.map(f => new Date(f.created_at));
    return {
      start: new Date(Math.min(...dates.map(d => d.getTime()))),
      end: new Date(Math.max(...dates.map(d => d.getTime())))
    };
  }

  private generateSummary(
    fragments: any[],
    patterns: PersonalPattern[],
    trends: TemporalTrend[],
    growth: GrowthInsight[]
  ) {
    const allThemes = fragments.flatMap(f => f.system_themes || []);
    const allEmotions = fragments.flatMap(f => f.system_emotions || []);
    
    const themeFreq = this.calculateThemeFrequency(fragments);
    const emotionFreq = this.calculateEmotionFrequency(fragments);

    return {
      dominantThemes: Object.entries(themeFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([theme]) => theme),
      emotionalProfile: Object.entries(emotionFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .reduce((acc, [emotion, count]) => {
          acc[emotion] = count / fragments.length;
          return acc;
        }, {} as Record<string, number>),
      writingStyle: this.determineWritingStyle(fragments),
      growthTrajectory: this.determineGrowthTrajectory(growth),
      keyRelationships: this.extractKeyRelationships(fragments),
      significantPeriods: this.identifySignificantPeriods(trends)
    };
  }

  private async generateRecommendations(
    fragments: any[],
    patterns: PersonalPattern[],
    growth: GrowthInsight[]
  ) {
    return {
      explorationSuggestions: [
        'Explore themes that appear less frequently in your writing',
        'Write about relationships that have shaped you',
        'Reflect on your earliest and latest memories for growth patterns'
      ],
      writingPrompts: [
        'What would you tell your younger self about the patterns you see now?',
        'How have your dominant themes evolved over time?',
        'What emotions do you want to explore more deeply?'
      ],
      reflectionQuestions: [
        'What do your writing patterns reveal about your values?',
        'How have challenging experiences contributed to your growth?',
        'What relationships have been most influential in your journey?'
      ],
      growthOpportunities: growth
        .filter(g => g.direction === 'growing')
        .map(g => `Continue developing in ${g.area}`)
        .slice(0, 3)
    };
  }

  private calculateOverallConfidence(fragments: any[], patterns: PersonalPattern[]): number {
    const baseConfidence = Math.min(0.9, fragments.length / 20); // More fragments = higher confidence
    const patternConfidence = patterns.length > 0 
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length 
      : 0.5;
    
    return (baseConfidence + patternConfidence) / 2;
  }

  // Placeholder implementations for complex helper methods
  private groupFragmentsByPeriod(fragments: any[], period: 'year' | 'month'): Record<string, any[]> {
    // Implementation would group fragments by time periods
    return {};
  }

  private analyzePeriodTrend(period: string, fragments: any[], type: string = 'year'): TemporalTrend {
    // Implementation would analyze trends for a specific period
    return {
      period,
      themes: {},
      emotions: {},
      writingFrequency: fragments.length,
      averageLength: fragments.reduce((sum, f) => sum + (f.body?.length || 0), 0) / fragments.length,
      sentiment: 'mixed',
      significantEvents: []
    };
  }

  private analyzeGrowthInArea(area: string, fragments: any[]): Promise<GrowthInsight> {
    // Implementation would analyze growth in specific areas
    return Promise.resolve({
      area,
      direction: 'stable',
      strength: 0.5,
      timeline: [],
      milestones: [],
      recommendations: []
    });
  }

  private extractEntities(content: string): Array<{name: string; type: string; importance: number; sentiment: number}> {
    // Implementation would extract people, places, concepts from content
    return [];
  }

  private calculateRelationshipEvolution(rel: RelationshipMapping, fragments: any[]): any[] {
    // Implementation would calculate how relationships change over time
    return [];
  }

  // Additional helper methods would be implemented...
  private findAssociatedThemes(theme: string, fragments: any[]): string[] { return []; }
  private calculateTimeSpanMonths(fragments: any[]): number { return 0; }
  private findEmotionalTriggers(emotion: string, fragments: any[]): string[] { return []; }
  private findEmotionAssociatedThemes(emotion: string, fragments: any[]): string[] { return []; }
  private analyzeWritingFrequency(fragments: any[]): any { return { pattern: 'random' }; }
  private analyzeContentLengthPattern(fragments: any[]): any { return { hasPattern: false }; }
  private analyzeThemeEvolution(fragments: any[]): any[] { return []; }
  private determineWritingStyle(fragments: any[]): string { return 'reflective'; }
  private determineGrowthTrajectory(growth: GrowthInsight[]): string { return 'positive'; }
  private extractKeyRelationships(fragments: any[]): string[] { return []; }
  private identifySignificantPeriods(trends: TemporalTrend[]): string[] { return []; }
}

export const insightsAnalyzer = new InsightsAnalyzer();
