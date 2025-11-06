"use client"
import { useState, useEffect } from "react"
import { MessageSquare, Send, Plus, Eye, Clock, AlertCircle } from "lucide-react"
import { ProfessionalHeader } from "@/components/ProfessionalHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

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

export default function LeaderCommunicationsPage() {
    const [communications, setCommunications] = useState<Communication[]>([])
    const [showCompose, setShowCompose] = useState(false)
    const [sending, setSending] = useState(false)
    const [groupName, setGroupName] = useState<string | null>(null);

    const [commForm, setCommForm] = useState({
        subject: '',
        message: '',
        priority: 'medium' as const,
        category: 'general' as const,
        scheduledFor: ''
    })

    const fetchCommunications = async () => {
        try {
            const response = await fetch('/api/leader/communications');
            const result = await response.json();
            if (result.success) {
                setCommunications(result.data.communications);
                if (result.data.communications.length > 0 && result.data.communications[0].recipients.groupId?.name) {
                    setGroupName(result.data.communications[0].recipients.groupId.name);
                } else {
                    // Attempt to fetch group name if no communications yet
                    const userRes = await fetch('/api/member'); // Assuming this endpoint provides user's group
                    const userData = await userRes.json();
                    if (userData.success && userData.data.member.group?.name) {
                        setGroupName(userData.data.member.group.name);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching communications:', error);
        }
    }

    const handleSendMessage = async () => {
        if (!commForm.subject || !commForm.message) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setSending(true);
            
            const response = await fetch('/api/leader/communications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...commForm,
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
        low: 'bg-blue-100 text-blue-800',
        medium: 'bg-blue-200 text-blue-800',
        high: 'bg-blue-300 text-blue-900',
        urgent: 'bg-blue-400 text-white'
    };

    useEffect(() => {
        fetchCommunications();
    }, []);

    return (
        <div className="min-h-screen bg-blue-300">
            <ProfessionalHeader
                title="Group Communications"
                subtitle={groupName ? `Send messages to members of ${groupName}` : "Send messages to your group members"}
                backHref="/leader"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Compose Message */}
                <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-blue-800">Compose Message to Group Members</CardTitle>
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
                                            Send a message to your group members
                                        </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="space-y-4 bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-blue-200">
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
                        <CardTitle className="text-blue-800">Sent Messages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {communications.length === 0 ? (
                            <div className="text-center py-8">
                                <MessageSquare className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-blue-800 mb-2">No messages sent</h3>
                                <p className="text-blue-600">Start by composing your first message to your group members</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {communications.map((comm) => (
                                    <div key={comm._id} className="bg-white/90 rounded-lg p-4 border border-blue-200">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-blue-800">{comm.subject}</h3>
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
                                                
                                                <p className="text-blue-700 mb-3 line-clamp-2">{comm.message}</p>
                                                
                                                <div className="flex items-center gap-4 text-sm text-blue-600">
                                                    <span>To: {comm.recipients.groupId?.name || 'Your Group'}</span>
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
        </div>
    )
}
