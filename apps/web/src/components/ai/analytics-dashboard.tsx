'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  LineChart, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Heart, 
  MessageCircle,
  Share,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalFragments: number;
    totalUsers: number;
    totalEngagement: number;
    growthRate: number;
  };
  engagement: {
    dailyActive: { date: string; count: number }[];
    readingPatterns: {
      averageReadTime: number;
      completionRate: number;
      returnVisitorRate: number;
      peakHours: string[];
    };
    interactionMetrics: {
      likes: number;
      shares: number;
      comments: number;
      bookmarks: number;
    };
    contentPopularity: {
      title: string;
      views: number;
      engagement: number;
      themes: string[];
    }[];
  };
  content: {
    themeDistribution: { theme: string; count: number; percentage: number }[];
    emotionalMapping: { emotion: string; intensity: number; frequency: number }[];
    contentQuality: {
      averageLength: number;
      readabilityScore: number;
      diversityIndex: number;
      originalityScore: number;
    };
  };
  userBehavior: {
    demographicBreakdown: {
      ageGroups: { group: string; percentage: number }[];
      userJourneyStages: { stage: string; count: number }[];
    };
    retentionMetrics: {
      dailyRetention: number[];
      weeklyRetention: number[];
      monthlyRetention: number[];
    };
  };
  trends: {
    emergingThemes: { theme: string; growth: number; momentum: number }[];
    communityPulse: {
      mood: string;
      energy: number;
      engagement: number;
      collaboration: number;
    };
    predictiveInsights: {
      nextWeekTrends: string[];
      contentGaps: string[];
      opportunityAreas: string[];
    };
  };
  insights: {
    userJourneyAnalysis: {
      onboardingSuccess: number;
      featureAdoption: { feature: string; adoption: number }[];
      dropoffPoints: { point: string; rate: number }[];
    };
    contentEffectiveness: {
      highPerformingFormats: string[];
      optimalLength: { min: number; max: number };
      bestPublishingTimes: string[];
    };
    communityHealth: {
      diversityScore: number;
      inclusivityIndex: number;
      toxicityLevel: number;
      moderationEfficiency: number;
    };
    recommendations: {
      type: string;
      priority: string;
      title: string;
      description: string;
      impact: string;
    }[];
  };
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeRange: { 
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString() 
          },
          metrics: ['engagement', 'content', 'user_behavior', 'trends', 'insights']
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
    setLoading(false);
  };

  const StatCard = ({ title, value, change, icon: Icon, format = 'number' }: {
    title: string;
    value: number;
    change?: number;
    icon: any;
    format?: 'number' | 'percentage' | 'time';
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'percentage':
          return `${Math.round(val * 100)}%`;
        case 'time':
          return `${val}min`;
        default:
          return val.toLocaleString();
      }
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{formatValue(value)}</p>
              {change !== undefined && (
                <p className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center gap-1`}>
                  <TrendingUp className="h-3 w-3" />
                  {change >= 0 ? '+' : ''}{Math.round(change * 100)}% vs last period
                </p>
              )}
            </div>
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  };

  const ThemeDistributionChart = ({ themes }: { themes: any[] }) => (
    <div className="space-y-3">
      {themes.slice(0, 8).map((theme, index) => (
        <div key={theme.theme} className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm font-medium min-w-0 flex-1">{theme.theme}</span>
            <span className="text-xs text-muted-foreground">{theme.count}</span>
          </div>
          <div className="w-24">
            <Progress value={theme.percentage} className="h-2" />
          </div>
          <span className="text-xs text-muted-foreground ml-2 w-10 text-right">
            {theme.percentage.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );

  const EmotionalMappingChart = ({ emotions }: { emotions: any[] }) => (
    <div className="grid grid-cols-2 gap-4">
      {emotions.slice(0, 8).map((emotion, index) => (
        <div key={emotion.emotion} className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{emotion.emotion}</span>
            <span className="text-xs text-muted-foreground">
              {emotion.intensity.toFixed(1)}/10
            </span>
          </div>
          <Progress value={emotion.intensity * 10} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {emotion.frequency} mentions
          </div>
        </div>
      ))}
    </div>
  );

  if (loading || !analytics) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading analytics dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Community insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d', '1y'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Stories"
              value={analytics.overview.totalFragments}
              change={analytics.overview.growthRate}
              icon={BookOpen}
            />
            <StatCard
              title="Active Users"
              value={analytics.overview.totalUsers}
              change={0.15}
              icon={Users}
            />
            <StatCard
              title="Total Engagement"
              value={analytics.overview.totalEngagement}
              change={0.23}
              icon={Heart}
            />
            <StatCard
              title="Growth Rate"
              value={analytics.overview.growthRate}
              icon={TrendingUp}
              format="percentage"
            />
          </div>

          {/* Community Pulse */}
          <Card>
            <CardHeader>
              <CardTitle>Community Pulse</CardTitle>
              <CardDescription>Real-time community health indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analytics.trends.communityPulse.energy}/10
                  </div>
                  <div className="text-sm text-muted-foreground">Energy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analytics.trends.communityPulse.engagement}/10
                  </div>
                  <div className="text-sm text-muted-foreground">Engagement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {analytics.trends.communityPulse.collaboration}/10
                  </div>
                  <div className="text-sm text-muted-foreground">Collaboration</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-600">
                    {analytics.trends.communityPulse.mood}
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Mood</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trending Content */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.engagement.contentPopularity.map((content, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{content.title}</h4>
                      <div className="flex gap-2 mt-1">
                        {content.themes.slice(0, 3).map((theme, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{content.views} views</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(content.engagement * 100)}% engagement
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          {/* Engagement Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Avg. Read Time"
              value={analytics.engagement.readingPatterns.averageReadTime}
              icon={Calendar}
              format="time"
            />
            <StatCard
              title="Completion Rate"
              value={analytics.engagement.readingPatterns.completionRate}
              icon={CheckCircle}
              format="percentage"
            />
            <StatCard
              title="Return Rate"
              value={analytics.engagement.readingPatterns.returnVisitorRate}
              icon={Users}
              format="percentage"
            />
            <StatCard
              title="Total Likes"
              value={analytics.engagement.interactionMetrics.likes}
              icon={Heart}
            />
          </div>

          {/* Interaction Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Interaction Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <Heart className="h-8 w-8 mx-auto text-red-500 mb-2" />
                  <div className="text-xl font-bold">{analytics.engagement.interactionMetrics.likes}</div>
                  <div className="text-sm text-muted-foreground">Likes</div>
                </div>
                <div className="text-center">
                  <Share className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                  <div className="text-xl font-bold">{analytics.engagement.interactionMetrics.shares}</div>
                  <div className="text-sm text-muted-foreground">Shares</div>
                </div>
                <div className="text-center">
                  <MessageCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <div className="text-xl font-bold">{analytics.engagement.interactionMetrics.comments}</div>
                  <div className="text-sm text-muted-foreground">Comments</div>
                </div>
                <div className="text-center">
                  <BookOpen className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                  <div className="text-xl font-bold">{analytics.engagement.interactionMetrics.bookmarks}</div>
                  <div className="text-sm text-muted-foreground">Bookmarks</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Peak Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Peak Activity Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analytics.engagement.readingPatterns.peakHours.map((hour, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {hour}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          {/* Content Quality Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Avg. Length"
              value={analytics.content.contentQuality.averageLength}
              icon={BookOpen}
            />
            <StatCard
              title="Readability"
              value={analytics.content.contentQuality.readabilityScore}
              icon={CheckCircle}
            />
            <StatCard
              title="Diversity Index"
              value={analytics.content.contentQuality.diversityIndex}
              icon={Target}
              format="percentage"
            />
            <StatCard
              title="Originality"
              value={analytics.content.contentQuality.originalityScore}
              icon={TrendingUp}
              format="percentage"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Theme Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Theme Distribution</CardTitle>
                <CardDescription>Most popular story themes</CardDescription>
              </CardHeader>
              <CardContent>
                <ThemeDistributionChart themes={analytics.content.themeDistribution} />
              </CardContent>
            </Card>

            {/* Emotional Mapping */}
            <Card>
              <CardHeader>
                <CardTitle>Emotional Landscape</CardTitle>
                <CardDescription>Emotional intensity across stories</CardDescription>
              </CardHeader>
              <CardContent>
                <EmotionalMappingChart emotions={analytics.content.emotionalMapping} />
              </CardContent>
            </Card>
          </div>

          {/* Emerging Themes */}
          <Card>
            <CardHeader>
              <CardTitle>Emerging Themes</CardTitle>
              <CardDescription>Trending topics with growing momentum</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {analytics.trends.emergingThemes.map((theme, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{theme.theme}</h4>
                      <div className="text-sm text-muted-foreground">
                        Momentum: {Math.round(theme.momentum * 100)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        +{Math.round(theme.growth * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">growth</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* User Demographics */}
          <Card>
            <CardHeader>
              <CardTitle>Age Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.userBehavior.demographicBreakdown.ageGroups.map((group, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{group.group}</span>
                    <div className="flex items-center gap-3">
                      <Progress value={group.percentage} className="w-32 h-2" />
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {group.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User Journey Stages */}
          <Card>
            <CardHeader>
              <CardTitle>User Journey Stages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.userBehavior.demographicBreakdown.userJourneyStages.map((stage, index) => (
                  <div key={index} className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{stage.count}</div>
                    <div className="text-sm text-muted-foreground">{stage.stage}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Retention Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Retention Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Daily Retention</h4>
                  <div className="space-y-2">
                    {analytics.userBehavior.retentionMetrics.dailyRetention.map((rate, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">Day {index + 1}</span>
                        <span className="text-sm font-medium">{Math.round(rate * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Weekly Retention</h4>
                  <div className="space-y-2">
                    {analytics.userBehavior.retentionMetrics.weeklyRetention.map((rate, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">Week {index + 1}</span>
                        <span className="text-sm font-medium">{Math.round(rate * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Monthly Retention</h4>
                  <div className="space-y-2">
                    {analytics.userBehavior.retentionMetrics.monthlyRetention.map((rate, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">Month {index + 1}</span>
                        <span className="text-sm font-medium">{Math.round(rate * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Feature Adoption */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Adoption</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.insights.userJourneyAnalysis.featureAdoption.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{feature.feature}</span>
                    <div className="flex items-center gap-3">
                      <Progress value={feature.adoption * 100} className="w-32 h-2" />
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {Math.round(feature.adoption * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Community Health */}
          <Card>
            <CardHeader>
              <CardTitle>Community Health Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(analytics.insights.communityHealth.diversityScore * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Diversity</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(analytics.insights.communityHealth.inclusivityIndex * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Inclusivity</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {Math.round(analytics.insights.communityHealth.toxicityLevel * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Toxicity</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(analytics.insights.communityHealth.moderationEfficiency * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Moderation</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Strategic Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.insights.recommendations.map((rec, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{rec.title}</h4>
                      <div className="flex gap-2">
                        <Badge 
                          variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                        >
                          {rec.priority}
                        </Badge>
                        <Badge variant="outline">{rec.type}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                    <div className="text-xs text-green-600 font-medium">
                      Expected Impact: {rec.impact}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Predictive Insights */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Next Week Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analytics.trends.predictiveInsights.nextWeekTrends.map((trend, index) => (
                    <li key={index} className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      {trend}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Gaps</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analytics.trends.predictiveInsights.contentGaps.map((gap, index) => (
                    <li key={index} className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 text-orange-500" />
                      {gap}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analytics.trends.predictiveInsights.opportunityAreas.map((opportunity, index) => (
                    <li key={index} className="text-sm flex items-center gap-2">
                      <Target className="h-3 w-3 text-blue-500" />
                      {opportunity}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
