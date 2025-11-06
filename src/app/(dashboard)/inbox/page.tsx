'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  MailOpen, 
  Clock, 
  AlertCircle,
  Eye,
  Calendar,
  Filter,
  Search,
  User,
  MessageSquare,
  CheckCircle,
  X
} from 'lucide-react';
import { ProfessionalHeader } from '@/components/ProfessionalHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Communication {
  _id: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'announcement' | 'meeting' | 'event' | 'prayer' | 'general';
  sender: {
    _id: string;
    name: string;
    email: string;
  };
  recipients: {
    type: 'all_members' | 'all_leaders' | 'all_protocol' | 'group_members' | 'specific_users';
    groupId?: { _id: string; name: string };
  };
  isRead: boolean;
  readAt?: string;
  sentAt?: string;
  scheduledFor?: string;
  createdAt: string;
}

interface InboxStats {
  totalMessages: number;
  unreadMessages: number;
  urgentMessages: number;
  todayMessages: number;
}

export default function Inbox() {
  const router = useRouter();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [stats, setStats] = useState<InboxStats>({
    totalMessages: 0,
    unreadMessages: 0,
    urgentMessages: 0,
    todayMessages: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Communication | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const categoryIcons = {
    announcement: MessageSquare,
    meeting: Calendar,
    event: Calendar,
    prayer: MessageSquare,
    general: Mail
  };

  useEffect(() => {
    fetchUserRole();
    fetchCommunications();
  }, [searchTerm, filterCategory, filterPriority, unreadOnly]);

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/users');
      const result = await response.json();
      if (result.success && result.data.user) {
        setUserRole(result.data.user.role);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const getBackHref = () => {
    switch (userRole) {
      case 'bishop':
        return '/bishop';
      case 'leader':
        return '/leader';
      case 'member':
        return '/member';
      case 'protocol':
        return '/protocol';
      default:
        return '/';
    }
  };

  const fetchCommunications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterCategory && filterCategory !== 'all') params.append('category', filterCategory);
      if (filterPriority && filterPriority !== 'all') params.append('priority', filterPriority);
      if (unreadOnly) params.append('unreadOnly', 'true');

      const response = await fetch(`/api/communications/inbox?${params}`);
      const result = await response.json();

      if (result.success) {
        setCommunications(result.data.communications);
        calculateStats(result.data.communications);
      } else {
        toast.error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching communications:', error);
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (comms: Communication[]) => {
    const totalMessages = comms.length;
    const unreadMessages = comms.filter(comm => !comm.isRead).length;
    const urgentMessages = comms.filter(comm => comm.priority === 'urgent').length;
    const todayMessages = comms.filter(comm => {
      const today = new Date().toDateString();
      const messageDate = new Date(comm.createdAt).toDateString();
      return today === messageDate;
    }).length;

    setStats({ totalMessages, unreadMessages, urgentMessages, todayMessages });
  };

  const handleViewMessage = async (comm: Communication) => {
    setSelectedMessage(comm);
    setShowMessage(true);

    // Mark as read if not already read
    if (!comm.isRead) {
      try {
        await fetch(`/api/communications/inbox/${comm._id}/read`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' }
        });
        
        // Update local state
        setCommunications(prev => 
          prev.map(c => 
            c._id === comm._id 
              ? { ...c, isRead: true, readAt: new Date().toISOString() }
              : c
          )
        );
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const getRecipientText = (recipients: Communication['recipients']) => {
    switch (recipients.type) {
      case 'all_members':
        return 'All Members';
      case 'all_leaders':
        return 'All Leaders';
      case 'all_protocol':
        return 'All Protocol Leaders';
      case 'group_members':
        return `Group: ${recipients.groupId?.name || 'Unknown'}`;
      case 'specific_users':
        return 'Specific Users';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-blue-300">
      <ProfessionalHeader 
        title="Inbox"
        subtitle="Your messages and communications"
        backHref={getBackHref()}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Inbox</h1>
          <p className="text-blue-600">Your messages and communications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-700">Total Messages</p>
                  <p className="text-2xl font-bold text-blue-800">{stats.totalMessages}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <MailOpen className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-700">Unread</p>
                  <p className="text-2xl font-bold text-blue-800">{stats.unreadMessages}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-700">Urgent</p>
                  <p className="text-2xl font-bold text-blue-800">{stats.urgentMessages}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-700">Today</p>
                  <p className="text-2xl font-bold text-blue-800">{stats.todayMessages}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-4 w-4" />
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/90 border-blue-300 text-blue-800 placeholder-blue-500 focus:border-blue-600 focus:ring-blue-600"
                />
              </div>
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-48 bg-white/90 border-blue-300 text-blue-800 focus:border-blue-600 focus:ring-blue-600">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm border-blue-300">
                <SelectItem value="all" className="text-blue-800 hover:bg-blue-100">All Categories</SelectItem>
                <SelectItem value="announcement" className="text-blue-800 hover:bg-blue-100">Announcement</SelectItem>
                <SelectItem value="meeting" className="text-blue-800 hover:bg-blue-100">Meeting</SelectItem>
                <SelectItem value="event" className="text-blue-800 hover:bg-blue-100">Event</SelectItem>
                <SelectItem value="prayer" className="text-blue-800 hover:bg-blue-100">Prayer</SelectItem>
                <SelectItem value="general" className="text-blue-800 hover:bg-blue-100">General</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full sm:w-48 bg-white/90 border-blue-300 text-blue-800 focus:border-blue-600 focus:ring-blue-600">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm border-blue-300">
                <SelectItem value="all" className="text-blue-800 hover:bg-blue-100">All Priorities</SelectItem>
                <SelectItem value="low" className="text-blue-800 hover:bg-blue-100">Low</SelectItem>
                <SelectItem value="medium" className="text-blue-800 hover:bg-blue-100">Medium</SelectItem>
                <SelectItem value="high" className="text-blue-800 hover:bg-blue-100">High</SelectItem>
                <SelectItem value="urgent" className="text-blue-800 hover:bg-blue-100">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={unreadOnly ? "default" : "outline"}
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={`w-full sm:w-auto ${unreadOnly ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-blue-300 text-blue-700 hover:bg-blue-50 bg-white/90'}`}
            >
              <MailOpen className="h-4 w-4 mr-2" />
              Unread Only
            </Button>
          </div>
        </Card>

        {/* Messages List */}
        <div className="space-y-4">
          {loading ? (
            <UltraFastTableSkeleton />
          ) : communications.length === 0 ? (
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardContent className="p-8 text-center">
                <Mail className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-blue-800 mb-2">No messages found</h3>
                <p className="text-blue-600">You don't have any messages yet</p>
              </CardContent>
            </Card>
          ) : (
            communications.map((comm) => {
              const CategoryIcon = categoryIcons[comm.category];
              
              return (
                <div 
                  key={comm._id}
                  className="animate-fade-in"
                >
                  <Card 
                    className={`bg-blue-200/90 backdrop-blur-md border border-blue-300 hover:shadow-md transition-shadow cursor-pointer ${
                      !comm.isRead ? 'border-l-4 border-l-blue-500 bg-blue-100/50' : ''
                    }`}
                    onClick={() => handleViewMessage(comm)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CategoryIcon className="h-5 w-5 text-blue-600" />
                            <h3 className={`text-lg font-semibold ${!comm.isRead ? 'text-blue-900' : 'text-blue-800'}`}>
                              {comm.subject}
                            </h3>
                            <Badge className={priorityColors[comm.priority]}>
                              {comm.priority}
                            </Badge>
                            {!comm.isRead && (
                              <Badge variant="outline" className="text-blue-600 border-blue-600">
                                New
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-blue-700 mb-3 line-clamp-2">{comm.message}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-blue-600">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              From: {comm.sender.name}
                            </span>
                            <span>•</span>
                            <span>To: {getRecipientText(comm.recipients)}</span>
                            <span>•</span>
                            <span>
                              {comm.sentAt 
                                ? `Sent: ${new Date(comm.sentAt).toLocaleDateString()}`
                                : `Scheduled: ${new Date(comm.scheduledFor!).toLocaleDateString()}`
                              }
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-100">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })
          )}
        </div>

        {/* Message Detail Modal */}
        <Dialog open={showMessage} onOpenChange={setShowMessage}>
          <DialogContent className="max-w-2xl bg-blue-200/90 backdrop-blur-md border border-blue-300 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl text-blue-800">{selectedMessage?.subject}</DialogTitle>
                  <DialogDescription className="mt-2 text-blue-600">
                    From: {selectedMessage?.sender.name} • {getRecipientText(selectedMessage?.recipients || { type: 'all_members' })}
                  </DialogDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowMessage(false)} className="text-blue-600 hover:bg-blue-100">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            
            {selectedMessage && (
              <div className="space-y-4 bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-blue-200">
                <div className="flex items-center gap-3">
                  <Badge className={priorityColors[selectedMessage.priority]}>
                    {selectedMessage.priority}
                  </Badge>
                  <Badge variant="outline" className="border-blue-300 text-blue-700">
                    {selectedMessage.category}
                  </Badge>
                  {selectedMessage.isRead && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Read
                    </Badge>
                  )}
                </div>
                
                <div className="bg-white/90 rounded-lg p-4 border border-blue-200">
                  <p className="text-blue-800 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
                
                <div className="text-sm text-blue-600 pt-4 border-t border-blue-200">
                  <p>
                    {selectedMessage.sentAt 
                      ? `Sent on ${new Date(selectedMessage.sentAt).toLocaleString()}`
                      : `Scheduled for ${new Date(selectedMessage.scheduledFor!).toLocaleString()}`
                    }
                  </p>
                  {selectedMessage.isRead && selectedMessage.readAt && (
                    <p>Read on {new Date(selectedMessage.readAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
