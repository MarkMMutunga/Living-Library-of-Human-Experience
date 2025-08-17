/**
 * Living Library of Human Experience - Insights Dashboard Page
 * 
 * Copyright (c) 2025 Mark Mikile Mutunga
 * Author: Mark Mikile Mutunga <markmiki03@gmail.com>
 * Phone: +254 707 678 643
 * 
 * This file is part of the Living Library of Human Experience platform.
 * Licensed under proprietary license - see LICENSE file for details.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import InsightsVisualization from '@/components/insights/InsightsVisualization';

interface InsightsPageProps {}

export default function InsightsPage({}: InsightsPageProps) {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<string>('full');
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const analysisTypes = [
    { value: 'full', label: 'Complete Analysis', description: 'All insights including patterns, growth, and relationships' },
    { value: 'patterns', label: 'Pattern Analysis', description: 'Focus on recurring themes and behaviors' },
    { value: 'growth', label: 'Growth Insights', description: 'Personal development and progression over time' },
    { value: 'relationships', label: 'Relationship Mapping', description: 'Important people, places, and concepts in your life' }
  ];

  useEffect(() => {
    // Load insights on component mount
    generateInsights();
  }, []);

  const generateInsights = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        type: analysisType,
        ...(forceRefresh && { refresh: 'true' })
      });

      const response = await fetch(`/api/insights?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate insights');
      }

      const data = await response.json();
      
      if (data.success) {
        setInsights(data.data);
        setLastGenerated(new Date(data.generatedAt));
      } else {
        throw new Error('Invalid response format');
      }

    } catch (err) {
      console.error('Failed to generate insights:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysisTypeChange = (newType: string) => {
    setAnalysisType(newType);
    // Automatically regenerate insights when type changes
    setTimeout(() => generateInsights(), 100);
  };

  const handleRefresh = () => {
    generateInsights(true);
  };

  const handleFilterChange = (filters: any) => {
    // This could be enhanced to apply filters to the current insights
    // For now, we'll just log the filters
    console.log('Filters applied:', filters);
  };

  const getInsightsSummary = () => {
    if (!insights) return null;

    const stats = {
      fragments: insights.metadata?.analyzedFragments || 0,
      patterns: insights.patterns?.length || 0,
      themes: insights.summary?.dominantThemes?.length || 0,
      confidence: Math.round((insights.metadata?.confidence || 0) * 100)
    };

    return stats;
  };

  if (loading && !insights) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Analyzing Your Life Story
          </h2>
          <p className="text-gray-600">
            This may take a moment as we process your experiences...
          </p>
        </div>
      </div>
    );
  }

  if (error && !insights) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Analysis Failed
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => generateInsights(true)}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const summary = getInsightsSummary();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Personal Insights
              </h1>
              <p className="mt-2 text-gray-600">
                Discover patterns, growth, and meaning in your life story
              </p>
              {lastGenerated && (
                <p className="mt-1 text-sm text-gray-500">
                  Last updated: {lastGenerated.toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  'Refresh Analysis'
                )}
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          {summary && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{summary.fragments}</div>
                <div className="text-sm text-blue-800">Fragments Analyzed</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{summary.patterns}</div>
                <div className="text-sm text-green-800">Patterns Found</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{summary.themes}</div>
                <div className="text-sm text-purple-800">Main Themes</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{summary.confidence}%</div>
                <div className="text-sm text-orange-800">Confidence</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Type Selector */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Analysis Focus</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analysisTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => handleAnalysisTypeChange(type.value)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  analysisType === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h4 className="font-medium text-gray-900 mb-2">{type.label}</h4>
                <p className="text-sm text-gray-600">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="text-red-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Analysis Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Visualization */}
        {insights && (
          <InsightsVisualization 
            insights={insights} 
            onFilterChange={handleFilterChange}
          />
        )}

        {/* Recommendations */}
        {insights?.recommendations && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Personalized Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-green-800 mb-2">🌱 Growth Opportunities</h4>
                <ul className="space-y-2">
                  {insights.recommendations.growthOpportunities?.slice(0, 3).map((rec: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700 pl-4 border-l-2 border-green-200">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">✍️ Writing Prompts</h4>
                <ul className="space-y-2">
                  {insights.recommendations.writingPrompts?.slice(0, 3).map((prompt: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700 pl-4 border-l-2 border-blue-200">
                      {prompt}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading && insights?.metadata?.analyzedFragments === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Content to Analyze
            </h3>
            <p className="text-gray-600 mb-4">
              Start writing your life experiences to see personalized insights and patterns.
            </p>
            <Button onClick={() => window.location.href = '/create'}>
              Write Your First Story
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
