import { Suspense } from 'react';
import AIIntelligence from '@/components/ai/ai-intelligence';
import AnalyticsDashboard from '@/components/ai/analytics-dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, BarChart3, Sparkles } from 'lucide-react';

export default function AIPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <Brain className="h-10 w-10" />
          AI-Powered Insights
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Discover patterns, connections, and insights in your stories with advanced AI analysis. 
          Explore recommendations, timeline views, and community analytics.
        </p>
      </div>

      <Tabs defaultValue="intelligence" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="intelligence" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Intelligence
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="intelligence" className="mt-8">
          <Suspense fallback={
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading AI Intelligence...</p>
                </div>
              </CardContent>
            </Card>
          }>
            <AIIntelligence />
          </Suspense>
        </TabsContent>

        <TabsContent value="analytics" className="mt-8">
          <Suspense fallback={
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading Analytics Dashboard...</p>
                </div>
              </CardContent>
            </Card>
          }>
            <AnalyticsDashboard />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Feature Overview */}
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <Card className="border-dashed">
          <CardContent className="p-6 text-center space-y-4">
            <Brain className="h-12 w-12 mx-auto text-primary" />
            <h3 className="font-semibold">Story Mapping</h3>
            <p className="text-sm text-muted-foreground">
              AI analyzes your stories to identify themes, emotions, and narrative patterns
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="p-6 text-center space-y-4">
            <Sparkles className="h-12 w-12 mx-auto text-primary" />
            <h3 className="font-semibold">Smart Recommendations</h3>
            <p className="text-sm text-muted-foreground">
              Discover similar stories and new content based on your reading patterns
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="p-6 text-center space-y-4">
            <BarChart3 className="h-12 w-12 mx-auto text-primary" />
            <h3 className="font-semibold">Temporal Search</h3>
            <p className="text-sm text-muted-foreground">
              Explore your stories through time with chronological navigation and insights
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
