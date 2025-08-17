'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Shield, 
  Flag, 
  CheckCircle, 
  XCircle, 
  Eye,
  MessageSquare,
  TrendingUp
} from 'lucide-react';

interface ModerationItem {
  id: string;
  type: 'fragment' | 'comment' | 'user';
  title: string;
  content: string;
  reportedBy: string;
  reportReason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  createdAt: string;
  aiConfidence: number;
  reportCount: number;
}

export default function ContentModeration() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'high-priority'>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModerationItems();
  }, [filter]);

  const fetchModerationItems = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual API
      const mockItems: ModerationItem[] = [
        {
          id: '1',
          type: 'fragment',
          title: 'Personal Story About Recovery',
          content: 'This story contains potentially sensitive content about addiction recovery...',
          reportedBy: 'user123',
          reportReason: 'Potentially triggering content',
          severity: 'medium',
          status: 'pending',
          createdAt: '2025-08-17T10:30:00Z',
          aiConfidence: 0.75,
          reportCount: 2
        },
        {
          id: '2',
          type: 'comment',
          title: 'Comment on "Life Lessons"',
          content: 'This comment may contain inappropriate language...',
          reportedBy: 'user456',
          reportReason: 'Inappropriate language',
          severity: 'high',
          status: 'pending',
          createdAt: '2025-08-17T09:15:00Z',
          aiConfidence: 0.92,
          reportCount: 5
        }
      ];
      
      setItems(mockItems.filter(item => 
        filter === 'all' || 
        (filter === 'pending' && item.status === 'pending') ||
        (filter === 'high-priority' && (item.severity === 'high' || item.severity === 'critical'))
      ));
    } catch (error) {
      console.error('Failed to fetch moderation items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerateItem = async (id: string, action: 'approve' | 'reject') => {
    try {
      // Simulate API call
      setItems(prev => prev.map(item => 
        item.id === id 
          ? { ...item, status: action === 'approve' ? 'approved' : 'rejected' }
          : item
      ));
    } catch (error) {
      console.error('Failed to moderate item:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fragment': return <MessageSquare className="h-4 w-4" />;
      case 'comment': return <MessageSquare className="h-4 w-4" />;
      case 'user': return <Shield className="h-4 w-4" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Content Moderation</h1>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All Items
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
            size="sm"
          >
            Pending Review
          </Button>
          <Button
            variant={filter === 'high-priority' ? 'default' : 'outline'}
            onClick={() => setFilter('high-priority')}
            size="sm"
          >
            High Priority
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <p className="text-2xl font-bold">12</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Approved</span>
            </div>
            <p className="text-2xl font-bold">48</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Rejected</span>
            </div>
            <p className="text-2xl font-bold">8</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">AI Accuracy</span>
            </div>
            <p className="text-2xl font-bold">94%</p>
          </CardContent>
        </Card>
      </div>

      {/* Moderation Items */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-600">No items require moderation at this time.</p>
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(item.type)}
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={getSeverityColor(item.severity)}>
                          {item.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {item.reportCount} report{item.reportCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-gray-500">AI Confidence:</span>
                      <Progress value={item.aiConfidence * 100} className="w-16 h-2" />
                      <span className="text-xs font-medium">{Math.round(item.aiConfidence * 100)}%</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">Content Preview:</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                    {item.content}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-1">Report Reason:</h4>
                  <p className="text-sm text-gray-600">{item.reportReason}</p>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Reported by: {item.reportedBy}</span>
                  </div>
                  
                  {item.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleModerateItem(item.id, 'reject')}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleModerateItem(item.id, 'approve')}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  )}
                  
                  {item.status !== 'pending' && (
                    <Badge 
                      variant={item.status === 'approved' ? 'default' : 'destructive'}
                      className={item.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
