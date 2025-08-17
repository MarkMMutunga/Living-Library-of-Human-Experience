'use client';

import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Scatter,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface InsightsVisualizationProps {
  insights: any;
  onFilterChange?: (filters: any) => void;
}

type VisualizationType = 
  | 'timeline' 
  | 'themes' 
  | 'emotions' 
  | 'growth' 
  | 'relationships' 
  | 'patterns';

export default function InsightsVisualization({ 
  insights, 
  onFilterChange 
}: InsightsVisualizationProps) {
  const [activeTab, setActiveTab] = useState<VisualizationType>('timeline');
  const [timeRange, setTimeRange] = useState('all');
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);

  // Color palettes for different visualizations
  const themeColors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe',
    '#00c49f', '#ffbb28', '#ff8042', '#8dd1e1', '#d084d0'
  ];

  const emotionColors = {
    'joy': '#ffd700',
    'love': '#ff69b4',
    'excitement': '#ff4500',
    'gratitude': '#32cd32',
    'sadness': '#87ceeb',
    'anxiety': '#dda0dd',
    'anger': '#dc143c',
    'fear': '#2f4f4f',
    'disappointment': '#696969',
    'hope': '#98fb98'
  };

  const renderTimeline = () => {
    if (!insights?.temporalTrends) return null;

    const timelineData = insights.temporalTrends.map((trend: any) => ({
      period: trend.period,
      fragments: trend.writingFrequency,
      avgLength: Math.round(trend.averageLength / 10) / 100, // Scale for visibility
      dominantTheme: Object.keys(trend.themes)[0] || 'none',
      dominantEmotion: Object.keys(trend.emotions)[0] || 'neutral'
    }));

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Writing Activity Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="fragments" 
                stackId="1"
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6}
                name="Fragments Written"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Content Length Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="avgLength" 
                stroke="#82ca9d" 
                strokeWidth={3}
                name="Average Length (hundreds of chars)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderThemeAnalysis = () => {
    if (!insights?.summary?.dominantThemes) return null;

    const themeData = insights.summary.dominantThemes.map((theme: string, index: number) => ({
      theme,
      frequency: insights.summary.emotionalProfile[theme] || Math.random() * 0.5 + 0.1,
      color: themeColors[index % themeColors.length]
    }));

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Theme Distribution</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={themeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ theme, percent }: any) => `${theme} (${((percent || 0) * 100).toFixed(0)}%)`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="frequency"
              >
                {themeData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Theme Frequency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={themeData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="theme" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="frequency" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderEmotionalJourney = () => {
    if (!insights?.summary?.emotionalProfile) return null;

    const emotionData = Object.entries(insights.summary.emotionalProfile)
      .map(([emotion, frequency]) => ({
        emotion,
        frequency: Number(frequency),
        color: emotionColors[emotion as keyof typeof emotionColors] || '#888888'
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 8);

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Emotional Landscape</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={emotionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="emotion" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="frequency">
                {emotionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {emotionData.slice(0, 4).map((emotion, index) => (
            <div key={emotion.emotion} className="bg-white p-4 rounded-lg shadow text-center">
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: emotion.color }}
              >
                {Math.round(emotion.frequency * 100)}%
              </div>
              <p className="text-sm font-medium capitalize">{emotion.emotion}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGrowthAnalysis = () => {
    if (!insights?.growthInsights) return null;

    const growthData = insights.growthInsights.map((insight: any) => ({
      area: insight.area,
      strength: insight.strength * 100,
      direction: insight.direction,
      color: insight.direction === 'growing' ? '#32cd32' : 
             insight.direction === 'declining' ? '#dc143c' : '#888888'
    }));

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Personal Growth Areas</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={growthData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="area" type="category" width={120} />
              <Tooltip formatter={(value: any) => [`${value}%`, 'Growth Strength']} />
              <Bar dataKey="strength">
                {growthData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid gap-4">
          {insights.growthInsights.slice(0, 3).map((insight: any, index: number) => (
            <div key={insight.area} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-lg">{insight.area}</h4>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  insight.direction === 'growing' ? 'bg-green-100 text-green-800' :
                  insight.direction === 'declining' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {insight.direction}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className={`h-2 rounded-full ${
                    insight.direction === 'growing' ? 'bg-green-500' :
                    insight.direction === 'declining' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`}
                  style={{ width: `${insight.strength * 100}%` }}
                />
              </div>
              <div className="text-sm text-gray-600">
                <p>Strength: {Math.round(insight.strength * 100)}%</p>
                {insight.recommendations?.length > 0 && (
                  <p className="mt-2">
                    <strong>Recommendation:</strong> {insight.recommendations[0]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRelationshipNetwork = () => {
    if (!insights?.relationshipMappings) return null;

    const networkData = insights.relationshipMappings.map((rel: any) => ({
      name: rel.entity,
      strength: rel.strength * 100,
      sentiment: rel.sentiment * 50 + 50, // Normalize to 0-100
      frequency: rel.frequency,
      type: rel.type
    }));

    const typeColors = {
      'person': '#ff6b6b',
      'place': '#4ecdc4',
      'concept': '#45b7d1',
      'activity': '#96ceb4'
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Relationship Strength vs Sentiment</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={networkData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="strength" 
                name="Relationship Strength" 
                domain={[0, 100]}
              />
              <YAxis 
                dataKey="sentiment" 
                name="Sentiment" 
                domain={[0, 100]}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value, name) => [
                  name === 'strength' ? `${value}%` : `${value}%`,
                  name === 'strength' ? 'Strength' : 'Sentiment'
                ]}
                labelFormatter={(label) => `Entity: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="strength" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Strength"
              />
              <Line 
                type="monotone" 
                dataKey="sentiment" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Sentiment"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(typeColors).map(([type, color]) => {
            const typeData = networkData.filter((d: any) => d.type === type).slice(0, 5);
            if (typeData.length === 0) return null;

            return (
              <div key={type} className="bg-white p-6 rounded-lg shadow">
                <h4 className="font-semibold mb-4 capitalize">{type}s</h4>
                <div className="space-y-3">
                  {typeData.map((item: any, index: number) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className="font-medium">{item.name}</span>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm text-gray-600">
                          {Math.round(item.strength)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPatternAnalysis = () => {
    if (!insights?.patterns) return null;

    const patternsByType = insights.patterns.reduce((acc: any, pattern: any) => {
      if (!acc[pattern.type]) acc[pattern.type] = [];
      acc[pattern.type].push(pattern);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        {Object.entries(patternsByType).map(([type, patterns]: [string, any]) => (
          <div key={type} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 capitalize">{type} Patterns</h3>
            <div className="space-y-4">
              {patterns.slice(0, 3).map((pattern: any, index: number) => (
                <div key={pattern.id} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-lg">{pattern.title}</h4>
                  <p className="text-gray-600 mb-2">{pattern.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Confidence: {Math.round(pattern.confidence * 100)}%</span>
                    <span>Frequency: {pattern.frequency}</span>
                    <span>Significance: {Math.round(pattern.significance * 100)}%</span>
                  </div>
                  {pattern.insights?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Key Insight:</p>
                      <p className="text-sm text-gray-600">{pattern.insights[0]}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const tabs = [
    { id: 'timeline', label: 'Timeline', icon: '📈' },
    { id: 'themes', label: 'Themes', icon: '🎯' },
    { id: 'emotions', label: 'Emotions', icon: '💝' },
    { id: 'growth', label: 'Growth', icon: '🌱' },
    { id: 'relationships', label: 'Relationships', icon: '🤝' },
    { id: 'patterns', label: 'Patterns', icon: '🔍' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'timeline': return renderTimeline();
      case 'themes': return renderThemeAnalysis();
      case 'emotions': return renderEmotionalJourney();
      case 'growth': return renderGrowthAnalysis();
      case 'relationships': return renderRelationshipNetwork();
      case 'patterns': return renderPatternAnalysis();
      default: return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Personal Insights Dashboard
        </h1>
        <p className="text-gray-600">
          Explore patterns, growth, and insights from your life story
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as VisualizationType)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">All Time</option>
          <option value="year">Past Year</option>
          <option value="6months">Past 6 Months</option>
          <option value="3months">Past 3 Months</option>
        </select>

        <button
          onClick={() => onFilterChange?.({ timeRange, selectedThemes })}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Apply Filters
        </button>
      </div>

      {/* Content */}
      <div className="min-h-96">
        {renderContent()}
      </div>

      {/* Summary Stats */}
      {insights?.metadata && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Analysis Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {insights.metadata.analyzedFragments}
              </div>
              <div className="text-sm text-gray-600">Fragments Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {insights.patterns?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Patterns Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((insights.metadata.confidence || 0) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(
                  (new Date().getTime() - new Date(insights.metadata.timeSpan?.start || 0).getTime()) 
                  / (1000 * 60 * 60 * 24 * 30)
                )}
              </div>
              <div className="text-sm text-gray-600">Months of Data</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
