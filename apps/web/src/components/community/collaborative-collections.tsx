'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Heart, 
  BookOpen, 
  Share2, 
  Plus,
  Lock,
  Globe,
  Edit,
  Trash2,
  Star,
  MessageSquare,
  Eye
} from 'lucide-react';

interface Collection {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  creatorName: string;
  privacy: 'public' | 'private' | 'community';
  fragmentCount: number;
  collaborators: string[];
  tags: string[];
  likes: number;
  views: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
  isCollaborator?: boolean;
  canEdit?: boolean;
}

interface CollaborationInvite {
  id: string;
  collectionId: string;
  collectionTitle: string;
  invitedBy: string;
  invitedByName: string;
  invitedUser: string;
  role: 'viewer' | 'contributor' | 'editor';
  status: 'pending' | 'accepted' | 'declined';
  sentAt: string;
}

export default function CollaborativeCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [invites, setInvites] = useState<CollaborationInvite[]>([]);
  const [activeTab, setActiveTab] = useState<'my-collections' | 'shared-with-me' | 'public' | 'invites'>('my-collections');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollections();
    fetchInvites();
  }, [activeTab]);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual API
      const mockCollections: Collection[] = [
        {
          id: '1',
          title: 'Recovery Stories',
          description: 'A curated collection of inspiring recovery journeys from our community',
          createdBy: 'user_123',
          creatorName: 'Sarah Chen',
          privacy: 'public',
          fragmentCount: 24,
          collaborators: ['user_456', 'user_789'],
          tags: ['recovery', 'inspiration', 'health'],
          likes: 127,
          views: 1240,
          comments: 45,
          createdAt: '2025-08-10T14:30:00Z',
          updatedAt: '2025-08-16T09:15:00Z',
          canEdit: true
        },
        {
          id: '2',
          title: 'Cultural Heritage Stories',
          description: 'Stories preserving family traditions and cultural memories',
          createdBy: 'user_456',
          creatorName: 'Maria Rodriguez',
          privacy: 'community',
          fragmentCount: 18,
          collaborators: ['user_123', 'user_101', 'user_202'],
          tags: ['culture', 'family', 'tradition'],
          likes: 89,
          views: 620,
          comments: 32,
          createdAt: '2025-08-08T11:20:00Z',
          updatedAt: '2025-08-15T16:45:00Z',
          isCollaborator: true,
          canEdit: false
        },
        {
          id: '3',
          title: 'Life Lessons Learned',
          description: 'Wisdom and insights gained through life experiences',
          createdBy: 'user_current',
          creatorName: 'You',
          privacy: 'private',
          fragmentCount: 12,
          collaborators: [],
          tags: ['wisdom', 'lessons', 'personal'],
          likes: 34,
          views: 156,
          comments: 8,
          createdAt: '2025-08-12T08:00:00Z',
          updatedAt: '2025-08-17T07:30:00Z',
          canEdit: true
        }
      ];

      // Filter based on active tab
      let filteredCollections = mockCollections;
      if (activeTab === 'my-collections') {
        filteredCollections = mockCollections.filter(c => c.createdBy === 'user_current');
      } else if (activeTab === 'shared-with-me') {
        filteredCollections = mockCollections.filter(c => c.isCollaborator);
      } else if (activeTab === 'public') {
        filteredCollections = mockCollections.filter(c => c.privacy === 'public');
      }

      setCollections(filteredCollections);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async () => {
    try {
      const mockInvites: CollaborationInvite[] = [
        {
          id: '1',
          collectionId: '4',
          collectionTitle: 'Mental Health Awareness',
          invitedBy: 'user_789',
          invitedByName: 'Dr. Alex Thompson',
          invitedUser: 'user_current',
          role: 'contributor',
          status: 'pending',
          sentAt: '2025-08-16T14:30:00Z'
        },
        {
          id: '2',
          collectionId: '5',
          collectionTitle: 'Entrepreneurship Journey',
          invitedBy: 'user_555',
          invitedByName: 'Lisa Park',
          invitedUser: 'user_current',
          role: 'editor',
          status: 'pending',
          sentAt: '2025-08-15T10:15:00Z'
        }
      ];

      setInvites(mockInvites);
    } catch (error) {
      console.error('Failed to fetch invites:', error);
    }
  };

  const handleInviteResponse = async (inviteId: string, response: 'accept' | 'decline') => {
    try {
      setInvites(prev => prev.map(invite => 
        invite.id === inviteId 
          ? { ...invite, status: response === 'accept' ? 'accepted' : 'declined' }
          : invite
      ));
    } catch (error) {
      console.error('Failed to respond to invite:', error);
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    if (confirm('Are you sure you want to delete this collection?')) {
      try {
        setCollections(prev => prev.filter(c => c.id !== collectionId));
      } catch (error) {
        console.error('Failed to delete collection:', error);
      }
    }
  };

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'public': return <Globe className="h-4 w-4 text-green-500" />;
      case 'community': return <Users className="h-4 w-4 text-blue-500" />;
      case 'private': return <Lock className="h-4 w-4 text-gray-500" />;
      default: return <Lock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPrivacyBadge = (privacy: string) => {
    const configs = {
      public: { label: 'Public', color: 'bg-green-100 text-green-800' },
      community: { label: 'Community', color: 'bg-blue-100 text-blue-800' },
      private: { label: 'Private', color: 'bg-gray-100 text-gray-800' }
    };
    const config = configs[privacy as keyof typeof configs] || configs.private;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Collaborative Collections</h1>
        </div>
        
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Collection
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'my-collections' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('my-collections')}
          size="sm"
        >
          My Collections
        </Button>
        <Button
          variant={activeTab === 'shared-with-me' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('shared-with-me')}
          size="sm"
        >
          Shared with Me
        </Button>
        <Button
          variant={activeTab === 'public' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('public')}
          size="sm"
        >
          Public Collections
        </Button>
        <Button
          variant={activeTab === 'invites' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('invites')}
          size="sm"
          className="relative"
        >
          Invites
          {invites.filter(i => i.status === 'pending').length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
              {invites.filter(i => i.status === 'pending').length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'invites' ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Collaboration Invites</h2>
          {invites.filter(i => i.status === 'pending').length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending invites</h3>
                <p className="text-gray-600">You're all caught up with collaboration invitations.</p>
              </CardContent>
            </Card>
          ) : (
            invites
              .filter(invite => invite.status === 'pending')
              .map((invite) => (
                <Card key={invite.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{invite.collectionTitle}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>{invite.invitedByName}</strong> invited you to collaborate as a{' '}
                          <Badge variant="outline">{invite.role}</Badge>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(invite.sentAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInviteResponse(invite.id, 'decline')}
                        >
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleInviteResponse(invite.id, 'accept')}
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {collections.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No collections found</h3>
                <p className="text-gray-600">
                  {activeTab === 'my-collections' 
                    ? 'Create your first collection to organize related stories.'
                    : activeTab === 'shared-with-me'
                    ? 'No collections have been shared with you yet.'
                    : 'No public collections are available.'
                  }
                </p>
                {activeTab === 'my-collections' && (
                  <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Collection
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <Card key={collection.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getPrivacyIcon(collection.privacy)}
                        <CardTitle className="text-lg line-clamp-1">{collection.title}</CardTitle>
                      </div>
                      
                      {collection.canEdit && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteCollection(collection.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{collection.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPrivacyBadge(collection.privacy)}
                        <span className="text-sm text-gray-500">
                          by {collection.creatorName}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {collection.fragmentCount} stories
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {collection.collaborators.length + 1} members
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {collection.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {collection.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {collection.comments}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {collection.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                      {collection.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{collection.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-gray-500">
                        Updated {new Date(collection.updatedAt).toLocaleDateString()}
                      </span>
                      <Button size="sm" variant="outline">
                        View Collection
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Collection Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Collection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input 
                  type="text" 
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Enter collection title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  className="w-full border rounded-md px-3 py-2 h-24"
                  placeholder="Describe your collection"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Privacy</label>
                <select className="w-full border rounded-md px-3 py-2">
                  <option value="private">Private - Only you can see it</option>
                  <option value="community">Community - Verified members can see it</option>
                  <option value="public">Public - Everyone can see it</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => setShowCreateModal(false)} className="flex-1">
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
