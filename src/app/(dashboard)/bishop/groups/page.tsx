'use client';
import { useEffect, useState } from 'react';
import { Users, ArrowLeft, UserCheck, Plus, MessageSquare, Send, Eye, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAlerts } from '@/components/ui/alert-system';
import { ProfessionalHeader } from '@/components/ProfessionalHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Group {
    _id: string;
    name: string;
    members: [];
    leader?: {
        _id: string;
        name: string;
        email: string;
    };
}

interface Communication {
    _id: string;
    subject: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: 'announcement' | 'meeting' | 'event' | 'prayer' | 'general';
    recipients: {
        type: 'group_members';
        groupId: { _id: string; name: string };
    };
    readBy: { userId: string; readAt: string }[];
    sentAt?: string;
    scheduledFor?: string;
    createdAt: string;
}

export default function GroupManagement() {
    const alerts = useAlerts();
    const [groups, setGroups] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [communications, setCommunications] = useState<Communication[]>([]);
    const [showCompose, setShowCompose] = useState(false);
    const [sending, setSending] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [activeTab, setActiveTab] = useState<'groups' | 'communications'>('groups');
    
    // Communication form state
    const [commForm, setCommForm] = useState({
        subject: '',
        message: '',
        priority: 'medium' as const,
        category: 'general' as const,
        scheduledFor: ''
    })

    const fetchGroups = async () => {
        const res = await fetch('/api/bishop/groups');
        const data = await res.json();
        setGroups(data.groups);
    };

    const fetchCommunications = async () => {
        try {
            const response = await fetch('/api/bishop/communications?recipients=group_members');
            const result = await response.json();
            if (result.success) {
                setCommunications(result.data.communications);
            }
        } catch (error) {
            console.error('Error fetching communications:', error);
        }
    }

    const handleSendMessage = async () => {
        if (!commForm.subject || !commForm.message || !selectedGroup) {
            toast.error('Please fill in all required fields and select a group');
            return;
        }

        try {
            setSending(true);
            
            const response = await fetch('/api/bishop/communications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...commForm,
                    recipients: { 
                        type: 'group_members',
                        groupId: selectedGroup._id
                    },
                    scheduledFor: commForm.scheduledFor || undefined
                })
            });

            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                setShowCompose(false);
                setCommForm({
                    subject: '',
                    message: '',
                    priority: 'medium',
                    category: 'general',
                    scheduledFor: ''
                });
                setSelectedGroup(null);
                fetchCommunications();
            } else {
                toast.error(result.error || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const priorityColors = {
        low: 'bg-gray-100 text-gray-800',
        medium: 'bg-blue-100 text-blue-800',
        high: 'bg-orange-100 text-orange-800',
        urgent: 'bg-red-100 text-red-800'
    };

    const createGroup = async () => {
        try {
            const res = await fetch('/api/bishop/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: groupName }),
            });
            
            if (res.ok) {
                setGroupName('');
                await fetchGroups();
                
                // Show beautiful success alert
                const groupNameToShow = groupName;
                
                // Trigger refresh on main dashboard (if it's open in another tab)
                if (window.opener) {
                    window.opener.postMessage('refresh-dashboard', '*');
                }
                
                alerts.success(
                    "Group Created Successfully!",
                    `"${groupNameToShow}" has been added to your church groups.`,
                    [
                        {
                            label: "Assign Leader",
                            action: () => window.location.href = "/bishop/leaders",
                            variant: "primary"
                        },
                        {
                            label: "View Dashboard",
                            action: () => window.location.href = "/bishop",
                            variant: "secondary"
                        }
                    ]
                );
            } else {
                const error = await res.json();
                alerts.error(
                    "Failed to Create Group",
                    error.message || 'An error occurred while creating the group.',
                    [
                        {
                            label: "Try Again",
                            action: () => createGroup(),
                            variant: "primary"
                        }
                    ]
                );
            }
        } catch (err) {
            console.error('Error creating group:', err);
            alerts.error(
                "Network Error",
                "Failed to create group. Please check your connection and try again.",
                [
                    {
                        label: "Retry",
                        action: () => createGroup(),
                        variant: "primary"
                    }
                ]
            );
        }
    };

    const deleteGroup = async (id: string) => {
        await fetch(`/api/bishop/groups/${id}`, { method: 'DELETE' });
        await fetchGroups();
    };

    useEffect(() => {
        fetchGroups();
        fetchCommunications();
    }, []);

    return (
        <div className="min-h-screen bg-blue-300">
            <ProfessionalHeader
                title="Group Management"
                subtitle="Create and manage church groups"
                backHref="/bishop"
                actions={[
                    {
                        label: "View Leaders",
                        href: "/bishop/leaders",
                        variant: "outline",
                        icon: <UserCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                    }
                ]}
            />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tabs */}
                <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-3 sm:p-4 mb-6">
                    <div className="flex space-x-1">
                        <button
                            onClick={() => setActiveTab('groups')}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === 'groups'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-blue-700 hover:bg-blue-100'
                            }`}
                        >
                            <Users className="h-4 w-4 inline mr-2" />
                            Groups
                        </button>
                        <button
                            onClick={() => setActiveTab('communications')}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === 'communications'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-blue-700 hover:bg-blue-100'
                            }`}
                        >
                            <MessageSquare className="h-4 w-4 inline mr-2" />
                            Group Communications
                        </button>
                    </div>
                </div>

                {activeTab === 'groups' && (
                    <>
                {/* Create Group Form */}
                <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-6 mb-6">
                    <h2 className="text-lg font-medium text-blue-800 mb-4">Create New Group</h2>
                    <div className="flex gap-4">
                        <input 
                            placeholder="Enter group name" 
                            value={groupName} 
                            onChange={(e) => setGroupName(e.target.value)} 
                            className="flex-1 px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 text-blue-800 placeholder-blue-600 bg-white/90"
                        />
                        <button 
                            onClick={createGroup} 
                            disabled={!groupName.trim()}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Add Group
                        </button>
                    </div>
                </div>

                {/* Groups List */}
                <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300">
                    <div className="px-6 py-4 border-b border-blue-300">
                        <h2 className="text-lg font-medium text-blue-800">All Groups</h2>
                    </div>
                    
                    {groups.length > 0 ? (
                        <div className="divide-y divide-blue-300">
                            {groups.map((group: Group) => (
                                <div key={group._id} className="px-6 py-4 flex items-center justify-between hover:bg-white/10">
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium text-blue-800">{group.name}</h3>
                                        <p className="text-sm text-blue-700">{group.members.length} members</p>
                                        <p className="text-xs text-blue-600">
                                            Leader: {group.leader?.name || "No leader assigned"}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Link
                                            href={`/bishop/leaders?groupId=${group._id}`}
                                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                        >
                                            <UserCheck className="h-3 w-3 mr-1" />
                                            {group.leader ? "Change Leader" : "Assign Leader"}
                                        </Link>
                                        <button 
                                            onClick={() => deleteGroup(group._id)} 
                                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Users className="mx-auto h-12 w-12 text-blue-500" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No groups yet</h3>
                            <p className="mt-1 text-sm text-blue-600">Create your first group to get started.</p>
                        </div>
                    )}
                </div>
                    </>
                )}

                {activeTab === 'communications' && (
                    <div className="space-y-6">
                        {/* Compose Message */}
                        <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-blue-800">Send Message to Group</CardTitle>
                                    <Dialog open={showCompose} onOpenChange={setShowCompose}>
                                        <DialogTrigger asChild>
                                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Compose
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl bg-blue-200/90 backdrop-blur-md border border-blue-300 max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle className="text-blue-800 text-lg sm:text-xl">Compose Message</DialogTitle>
                                                <DialogDescription className="text-blue-600 text-sm sm:text-base">
                                                    Send a message to a specific group
                                                </DialogDescription>
                                            </DialogHeader>
                                            
                                            <div className="space-y-4 bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-blue-200">
                                                <div>
                                                    <Label htmlFor="group" className="text-blue-800 font-medium text-sm sm:text-base">Select Group *</Label>
                                                    <Select value={selectedGroup?._id || ''} onValueChange={(value) => {
                                                        const group = groups.find((g: Group) => g._id === value);
                                                        setSelectedGroup(group || null);
                                                    }}>
                                                        <SelectTrigger className="bg-white/90 border-blue-300 text-blue-800 focus:border-blue-600 focus:ring-blue-600 text-sm sm:text-base">
                                                            <SelectValue placeholder="Select a group" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white/95 backdrop-blur-sm border-blue-300">
                                                            {groups.map((group: Group) => (
                                                                <SelectItem key={group._id} value={group._id} className="text-blue-800 hover:bg-blue-100 text-sm sm:text-base">
                                                                    {group.name} ({group.members.length} members)
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <Label htmlFor="subject" className="text-blue-800 font-medium text-sm sm:text-base">Subject *</Label>
                                                    <Input
                                                        id="subject"
                                                        value={commForm.subject}
                                                        onChange={(e) => setCommForm({...commForm, subject: e.target.value})}
                                                        placeholder="Enter message subject"
                                                        className="bg-white/90 border-blue-300 text-blue-800 placeholder-blue-500 focus:border-blue-600 focus:ring-blue-600 text-sm sm:text-base"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                    <div>
                                                        <Label htmlFor="priority" className="text-blue-800 font-medium text-sm sm:text-base">Priority</Label>
                                                        <Select value={commForm.priority} onValueChange={(value: any) => setCommForm({...commForm, priority: value})}>
                                                            <SelectTrigger className="bg-white/90 border-blue-300 text-blue-800 focus:border-blue-600 focus:ring-blue-600 text-sm sm:text-base">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-white/95 backdrop-blur-sm border-blue-300">
                                                                <SelectItem value="low" className="text-blue-800 hover:bg-blue-100 text-sm sm:text-base">Low</SelectItem>
                                                                <SelectItem value="medium" className="text-blue-800 hover:bg-blue-100 text-sm sm:text-base">Medium</SelectItem>
                                                                <SelectItem value="high" className="text-blue-800 hover:bg-blue-100 text-sm sm:text-base">High</SelectItem>
                                                                <SelectItem value="urgent" className="text-blue-800 hover:bg-blue-100 text-sm sm:text-base">Urgent</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="category" className="text-blue-800 font-medium text-sm sm:text-base">Category</Label>
                                                        <Select value={commForm.category} onValueChange={(value: any) => setCommForm({...commForm, category: value})}>
                                                            <SelectTrigger className="bg-white/90 border-blue-300 text-blue-800 focus:border-blue-600 focus:ring-blue-600 text-sm sm:text-base">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-white/95 backdrop-blur-sm border-blue-300">
                                                                <SelectItem value="announcement" className="text-blue-800 hover:bg-blue-100 text-sm sm:text-base">Announcement</SelectItem>
                                                                <SelectItem value="meeting" className="text-blue-800 hover:bg-blue-100 text-sm sm:text-base">Meeting</SelectItem>
                                                                <SelectItem value="event" className="text-blue-800 hover:bg-blue-100 text-sm sm:text-base">Event</SelectItem>
                                                                <SelectItem value="prayer" className="text-blue-800 hover:bg-blue-100 text-sm sm:text-base">Prayer</SelectItem>
                                                                <SelectItem value="general" className="text-blue-800 hover:bg-blue-100 text-sm sm:text-base">General</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label htmlFor="scheduledFor" className="text-blue-800 font-medium text-sm sm:text-base">Schedule (Optional)</Label>
                                                    <Input
                                                        id="scheduledFor"
                                                        type="datetime-local"
                                                        value={commForm.scheduledFor}
                                                        onChange={(e) => setCommForm({...commForm, scheduledFor: e.target.value})}
                                                        className="bg-white/90 border-blue-300 text-blue-800 focus:border-blue-600 focus:ring-blue-600 text-sm sm:text-base"
                                                    />
                                                </div>

                                                <div>
                                                    <Label htmlFor="message" className="text-blue-800 font-medium text-sm sm:text-base">Message *</Label>
                                                    <Textarea
                                                        id="message"
                                                        value={commForm.message}
                                                        onChange={(e) => setCommForm({...commForm, message: e.target.value})}
                                                        placeholder="Enter your message"
                                                        rows={4}
                                                        className="bg-white/90 border-blue-300 text-blue-800 placeholder-blue-500 focus:border-blue-600 focus:ring-blue-600 resize-none text-sm sm:text-base"
                                                    />
                                                </div>

                                                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2 sm:pt-4">
                                                    <Button 
                                                        variant="outline" 
                                                        onClick={() => setShowCompose(false)}
                                                        className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-white/90 text-sm sm:text-base"
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button 
                                                        onClick={handleSendMessage} 
                                                        disabled={sending}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base"
                                                    >
                                                        {sending ? 'Sending...' : 'Send Message'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Communications List */}
                        <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
                            <CardHeader>
                                <CardTitle className="text-blue-800">Sent Group Messages</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {communications.length === 0 ? (
                                    <div className="text-center py-8">
                                        <MessageSquare className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-blue-800 mb-2">No group messages sent</h3>
                                        <p className="text-blue-600">Start by composing your first message to a group</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {communications.map((comm) => (
                                            <div key={comm._id} className="bg-white/90 rounded-lg p-4 border border-blue-200">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-lg font-semibold text-gray-900">{comm.subject}</h3>
                                                            <Badge className={priorityColors[comm.priority]}>
                                                                {comm.priority}
                                                            </Badge>
                                                            {comm.scheduledFor && !comm.sentAt && (
                                                                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                    Scheduled
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        
                                                        <p className="text-gray-600 mb-3 line-clamp-2">{comm.message}</p>
                                                        
                                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                                            <span>To: {comm.recipients.groupId?.name || 'Unknown Group'}</span>
                                                            <span>•</span>
                                                            <span>
                                                                {comm.sentAt 
                                                                    ? `Sent: ${new Date(comm.sentAt).toLocaleDateString()}`
                                                                    : `Scheduled: ${new Date(comm.scheduledFor!).toLocaleDateString()}`
                                                                }
                                                            </span>
                                                            <span>•</span>
                                                            <span>{comm.readBy.length} read</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2 ml-4">
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
