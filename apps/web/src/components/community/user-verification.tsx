'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  CheckCircle, 
  Star, 
  Award, 
  Users, 
  TrendingUp,
  Eye,
  Calendar,
  MessageSquare
} from 'lucide-react';

interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  verificationType: 'identity' | 'expertise' | 'experience';
  submittedDocuments: string[];
  personalStatement: string;
  endorsements: number;
  communityVotes: { positive: number; negative: number };
  aiCredibilityScore: number;
  status: 'pending' | 'under-review' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewerNotes?: string;
}

interface UserTrustMetrics {
  userId: string;
  userName: string;
  trustScore: number;
  verificationLevel: 'unverified' | 'basic' | 'verified' | 'expert';
  contributionCount: number;
  positiveRatings: number;
  communityReports: number;
  accountAge: number; // days
  lastActivity: string;
}

export default function UserVerification() {
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [trustMetrics, setTrustMetrics] = useState<UserTrustMetrics[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'metrics'>('requests');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVerificationData();
  }, []);

  const fetchVerificationData = async () => {
    setLoading(true);
    try {
      // Simulate API calls - replace with actual API
      const mockRequests: VerificationRequest[] = [
        {
          id: '1',
          userId: 'user_123',
          userName: 'Dr. Sarah Chen',
          userEmail: 'sarah.chen@email.com',
          verificationType: 'expertise',
          submittedDocuments: ['medical_license.pdf', 'cv.pdf'],
          personalStatement: 'I am a practicing psychiatrist with 15 years of experience specializing in trauma recovery...',
          endorsements: 8,
          communityVotes: { positive: 24, negative: 2 },
          aiCredibilityScore: 0.94,
          status: 'pending',
          submittedAt: '2025-08-15T14:30:00Z'
        },
        {
          id: '2',
          userId: 'user_456',
          userName: 'Mark Thompson',
          userEmail: 'mark.t@email.com',
          verificationType: 'experience',
          submittedDocuments: ['testimonial.pdf'],
          personalStatement: 'I have lived experience with addiction recovery and have been sober for 8 years...',
          endorsements: 12,
          communityVotes: { positive: 45, negative: 1 },
          aiCredibilityScore: 0.87,
          status: 'under-review',
          submittedAt: '2025-08-14T09:15:00Z'
        }
      ];

      const mockMetrics: UserTrustMetrics[] = [
        {
          userId: 'user_789',
          userName: 'Alex Rivera',
          trustScore: 0.92,
          verificationLevel: 'verified',
          contributionCount: 34,
          positiveRatings: 128,
          communityReports: 0,
          accountAge: 245,
          lastActivity: '2025-08-17T08:30:00Z'
        },
        {
          userId: 'user_101',
          userName: 'Jamie Wilson',
          trustScore: 0.67,
          verificationLevel: 'basic',
          contributionCount: 8,
          positiveRatings: 23,
          communityReports: 1,
          accountAge: 45,
          lastActivity: '2025-08-16T15:45:00Z'
        }
      ];

      setVerificationRequests(mockRequests);
      setTrustMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to fetch verification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationAction = async (requestId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      setVerificationRequests(prev => prev.map(request => 
        request.id === requestId 
          ? { 
              ...request, 
              status: action === 'approve' ? 'approved' : 'rejected',
              reviewedAt: new Date().toISOString(),
              reviewerNotes: notes
            }
          : request
      ));
    } catch (error) {
      console.error('Failed to process verification:', error);
    }
  };

  const getVerificationTypeIcon = (type: string) => {
    switch (type) {
      case 'identity': return <Shield className="h-4 w-4" />;
      case 'expertise': return <Award className="h-4 w-4" />;
      case 'experience': return <Star className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getVerificationTypeBadge = (type: string) => {
    const configs = {
      identity: { label: 'Identity', color: 'bg-blue-100 text-blue-800' },
      expertise: { label: 'Professional', color: 'bg-purple-100 text-purple-800' },
      experience: { label: 'Lived Experience', color: 'bg-green-100 text-green-800' }
    };
    const config = configs[type as keyof typeof configs] || { label: type, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTrustLevelBadge = (level: string) => {
    const configs = {
      unverified: { label: 'Unverified', color: 'bg-gray-100 text-gray-800' },
      basic: { label: 'Basic', color: 'bg-yellow-100 text-yellow-800' },
      verified: { label: 'Verified', color: 'bg-green-100 text-green-800' },
      expert: { label: 'Expert', color: 'bg-purple-100 text-purple-800' }
    };
    const config = configs[level as keyof typeof configs] || configs.unverified;
    return <Badge className={config.color}>{config.label}</Badge>;
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
          <h1 className="text-2xl font-bold">User Verification & Trust</h1>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'requests' ? 'default' : 'outline'}
            onClick={() => setActiveTab('requests')}
            size="sm"
          >
            Verification Requests
          </Button>
          <Button
            variant={activeTab === 'metrics' ? 'default' : 'outline'}
            onClick={() => setActiveTab('metrics')}
            size="sm"
          >
            Trust Metrics
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Pending Reviews</span>
            </div>
            <p className="text-2xl font-bold">5</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Verified Users</span>
            </div>
            <p className="text-2xl font-bold">248</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Expert Members</span>
            </div>
            <p className="text-2xl font-bold">42</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Avg Trust Score</span>
            </div>
            <p className="text-2xl font-bold">0.84</p>
          </CardContent>
        </Card>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'requests' ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Verification Requests</h2>
          {verificationRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                <p className="text-gray-600">No verification requests require review.</p>
              </CardContent>
            </Card>
          ) : (
            verificationRequests.map((request) => (
              <Card key={request.id} className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getVerificationTypeIcon(request.verificationType)}
                      <div>
                        <CardTitle className="text-lg">{request.userName}</CardTitle>
                        <p className="text-sm text-gray-600">{request.userEmail}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getVerificationTypeBadge(request.verificationType)}
                          <Badge variant="outline">
                            {request.endorsements} endorsements
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(request.submittedAt).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-gray-500">AI Score:</span>
                        <Progress value={request.aiCredibilityScore * 100} className="w-16 h-2" />
                        <span className="text-xs font-medium">{Math.round(request.aiCredibilityScore * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Personal Statement:</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                      {request.personalStatement}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-1">Documents:</h4>
                      <div className="space-y-1">
                        {request.submittedDocuments.map((doc, index) => (
                          <div key={index} className="text-sm text-blue-600 hover:underline cursor-pointer">
                            📄 {doc}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-1">Community Votes:</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-600">👍 {request.communityVotes.positive}</span>
                        <span className="text-sm text-red-600">👎 {request.communityVotes.negative}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-1">Endorsements:</h4>
                      <p className="text-sm text-gray-600">{request.endorsements} community members</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Badge 
                      variant={request.status === 'approved' ? 'default' : 
                               request.status === 'rejected' ? 'destructive' : 'secondary'}
                    >
                      {request.status.replace('-', ' ').toUpperCase()}
                    </Badge>
                    
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerificationAction(request.id, 'reject', 'Insufficient documentation')}
                          className="text-red-600 hover:text-red-700"
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleVerificationAction(request.id, 'approve')}
                          className="text-green-600 hover:text-green-700"
                        >
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">User Trust Metrics</h2>
          <div className="grid gap-4">
            {trustMetrics.map((user) => (
              <Card key={user.userId}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.userName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="font-semibold">{user.userName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getTrustLevelBadge(user.verificationLevel)}
                          <span className="text-sm text-gray-500">
                            Trust Score: {Math.round(user.trustScore * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="flex items-center justify-center gap-1">
                          <MessageSquare className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">{user.contributionCount}</span>
                        </div>
                        <p className="text-xs text-gray-500">Contributions</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm font-medium">{user.positiveRatings}</span>
                        </div>
                        <p className="text-xs text-gray-500">Positive Ratings</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="h-4 w-4 text-red-400" />
                          <span className="text-sm font-medium">{user.communityReports}</span>
                        </div>
                        <p className="text-xs text-gray-500">Reports</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="h-4 w-4 text-blue-400" />
                          <span className="text-sm font-medium">{user.accountAge}d</span>
                        </div>
                        <p className="text-xs text-gray-500">Account Age</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Trust Score</span>
                      <span>{Math.round(user.trustScore * 100)}%</span>
                    </div>
                    <Progress value={user.trustScore * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
