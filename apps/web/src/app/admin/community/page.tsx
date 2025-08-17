'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ContentModeration from '@/components/community/content-moderation';
import UserVerification from '@/components/community/user-verification';
import CollaborativeCollections from '@/components/community/collaborative-collections';
import { 
  Shield, 
  Users, 
  BookOpen, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CommunityDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Community Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage community features, moderation, and user verification
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Moderation
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Verification
          </TabsTrigger>
          <TabsTrigger value="collections" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Collections
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Community Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">248</div>
                <p className="text-xs text-muted-foreground">
                  19.9% verification rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  -3 from yesterday
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Community Health</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94%</div>
                <p className="text-xs text-muted-foreground">
                  Excellent community health
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Moderation Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Fragment approved</p>
                    <p className="text-sm text-muted-foreground">Recovery story by Sarah Chen</p>
                  </div>
                  <span className="text-xs text-muted-foreground">2h ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Comment removed</p>
                    <p className="text-sm text-muted-foreground">Inappropriate language detected</p>
                  </div>
                  <span className="text-xs text-muted-foreground">4h ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">User verified</p>
                    <p className="text-sm text-muted-foreground">Dr. Alex Thompson - Medical expertise</p>
                  </div>
                  <span className="text-xs text-muted-foreground">6h ago</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Community Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Trust Score</span>
                    <span className="font-medium">0.84</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '84%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">AI Moderation Accuracy</span>
                    <span className="font-medium">94%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Community Engagement</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Moderation Tab */}
        <TabsContent value="moderation">
          <ContentModeration />
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verification">
          <UserVerification />
        </TabsContent>

        {/* Collections Tab */}
        <TabsContent value="collections">
          <CollaborativeCollections />
        </TabsContent>
      </Tabs>
    </div>
  );
}
