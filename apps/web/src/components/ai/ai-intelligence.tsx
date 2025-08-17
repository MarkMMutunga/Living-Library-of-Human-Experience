'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, Clock, Users, Sparkles, Map, Compass } from 'lucide-react';

interface StoryMapping {
  fragmentId: string;
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
}

interface Recommendation {
  fragmentId: string;
  title: string;
  content: string;
  author: string;
  themes: string[];
  similarity: number;
  reason: string;
  engagementScore: number;
}

interface TemporalFragment {
  id: string;
  title: string;
  timeContext: {
    originalDate?: string;
    lifePeriod: string;
    significance: number;
  };
  themes: string[];
  emotions: string[];
}

interface AIIntelligenceProps {
  fragmentId?: string;
  userId?: string;
}

export default function AIIntelligence({ fragmentId, userId }: AIIntelligenceProps) {
  const [activeTab, setActiveTab] = useState('mapping');
  const [storyMapping, setStoryMapping] = useState<StoryMapping | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [temporalFragments, setTemporalFragments] = useState<TemporalFragment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'childhood' | 'youth' | 'adulthood' | 'recent'>('recent');

  useEffect(() => {
    if (activeTab === 'mapping' && fragmentId && !storyMapping) {
      loadStoryMapping();
    }
  }, [activeTab, fragmentId]);

  const loadStoryMapping = async () => {
    if (!fragmentId) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/ai/story-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fragmentId })
      });
      
      if (response.ok) {
        const data = await response.json();
        setStoryMapping(data.mapping);
      }
    } catch (error) {
      console.error('Error loading story mapping:', error);
    }
    setLoading(false);
  };

  const loadRecommendations = async (type: 'similar' | 'discover' | 'trending') => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type, 
          fragmentId: type === 'similar' ? fragmentId : undefined,
          count: 5 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
    setLoading(false);
  };

  const loadTemporalView = async (era: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ai/temporal-search?era=${era}`);
      
      if (response.ok) {
        const data = await response.json();
        setTemporalFragments(data.timeline?.fragments || []);
      }
    } catch (error) {
      console.error('Error loading temporal view:', error);
    }
    setLoading(false);
  };

  const EmotionalJourneyVisualization = ({ journey }: { journey: any }) => (
    <div className="space-y-4">
      <h4 className="font-semibold flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        Emotional Journey
      </h4>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Beginning</div>
          <Badge variant="outline" className="mt-1">{journey.start}</Badge>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Peak</div>
          <Badge variant="default" className="mt-1">{journey.peak}</Badge>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Resolution</div>
          <Badge variant="outline" className="mt-1">{journey.resolution}</Badge>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Brain className="h-6 w-6" />
          AI Intelligence Hub
        </h2>
        <p className="text-muted-foreground">
          Discover patterns, connections, and insights in your stories
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mapping" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Story Mapping
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Compass className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="temporal" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Temporal Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mapping" className="space-y-6">
          {!fragmentId ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  Select a story fragment to view its AI-generated mapping and insights
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {loading ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Analyzing story patterns...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : storyMapping ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Themes & Emotions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Themes & Emotions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Core Themes</h4>
                        <div className="flex flex-wrap gap-2">
                          {storyMapping.themes.map((theme, index) => (
                            <Badge key={index} variant="secondary">{theme}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Emotional Landscape</h4>
                        <div className="flex flex-wrap gap-2">
                          {storyMapping.emotions.map((emotion, index) => (
                            <Badge key={index} variant="outline">{emotion}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Time Context */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Time Context</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Life Period</span>
                        <Badge>{storyMapping.timeContext.period}</Badge>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Significance</span>
                          <span className="text-sm font-medium">
                            {storyMapping.timeContext.significance}/10
                          </span>
                        </div>
                        <Progress value={storyMapping.timeContext.significance * 10} />
                      </div>
                      {storyMapping.timeContext.seasonality && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Season</span>
                          <Badge variant="outline">{storyMapping.timeContext.seasonality}</Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Emotional Journey */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Story Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <EmotionalJourneyVisualization journey={storyMapping.emotionalJourney} />
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">Key Insights</h4>
                          <ul className="space-y-2">
                            {storyMapping.insights.map((insight, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                <Sparkles className="h-3 w-3 mt-1 flex-shrink-0" />
                                {insight}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-3">Personal Growth</h4>
                          <ul className="space-y-2">
                            {storyMapping.personalGrowth.map((growth, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                <TrendingUp className="h-3 w-3 mt-1 flex-shrink-0" />
                                {growth}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <p className="text-muted-foreground">No mapping available for this story</p>
                      <Button onClick={loadStoryMapping}>Generate Mapping</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={() => loadRecommendations('similar')}
              variant={recommendations.length > 0 ? "outline" : "default"}
            >
              Similar Stories
            </Button>
            <Button 
              onClick={() => loadRecommendations('discover')}
              variant="outline"
            >
              Discover New
            </Button>
            <Button 
              onClick={() => loadRecommendations('trending')}
              variant="outline"
            >
              Trending
            </Button>
          </div>

          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Finding recommendations...</p>
                </div>
              </CardContent>
            </Card>
          ) : recommendations.length > 0 ? (
            <div className="grid gap-4">
              {recommendations.map((rec) => (
                <Card key={rec.fragmentId} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{rec.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{Math.round(rec.similarity * 100)}% match</Badge>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span className="text-xs text-muted-foreground">{rec.engagementScore}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {rec.content.substring(0, 120)}...
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex flex-wrap gap-1">
                        {rec.themes.slice(0, 3).map((theme, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        by {rec.author}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {rec.reason}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  Click a button above to get personalized recommendations
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="temporal" className="space-y-6">
          <div className="flex gap-2 justify-center">
            {(['childhood', 'youth', 'adulthood', 'recent'] as const).map((era) => (
              <Button
                key={era}
                onClick={() => {
                  setSelectedTimeframe(era);
                  loadTemporalView(era);
                }}
                variant={selectedTimeframe === era ? "default" : "outline"}
                className="capitalize"
              >
                {era}
              </Button>
            ))}
          </div>

          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Exploring your timeline...</p>
                </div>
              </CardContent>
            </Card>
          ) : temporalFragments.length > 0 ? (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold capitalize">{selectedTimeframe} Stories</h3>
                <p className="text-sm text-muted-foreground">
                  {temporalFragments.length} memories from your {selectedTimeframe} period
                </p>
              </div>
              
              <div className="grid gap-4">
                {temporalFragments.map((fragment) => (
                  <Card key={fragment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{fragment.title}</h3>
                        <div className="flex items-center gap-2">
                          {fragment.timeContext.originalDate && (
                            <Badge variant="outline" className="text-xs">
                              {new Date(fragment.timeContext.originalDate).getFullYear()}
                            </Badge>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs text-muted-foreground">
                              {fragment.timeContext.significance}/10
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex flex-wrap gap-1">
                          {fragment.themes.slice(0, 3).map((theme, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {theme}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {fragment.emotions.slice(0, 2).map((emotion, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {emotion}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    No stories found for your {selectedTimeframe} period
                  </p>
                  <Button variant="outline">Create Your First Story</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
