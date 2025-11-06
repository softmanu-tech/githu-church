"use client"
import { useState, useEffect, Suspense } from "react"
import { Users, ArrowLeft, Edit, UserCheck, LogOut, MessageSquare, Send, Plus, Eye, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { EditLeaderModal } from "@/components/EditLeaderModal"
import { useAlerts } from "@/components/ui/alert-system"
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

interface Group {
    _id: string
    name: string
}

interface Leader {
    _id: string
    name: string
    email: string
    password?: string
    group?: {
        _id: string
        name: string
    }
}

interface Communication {
    _id: string;
    subject: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: 'announcement' | 'meeting' | 'event' | 'prayer' | 'general';
    readBy: { userId: string; readAt: string }[];
    sentAt?: string;
    scheduledFor?: string;
    createdAt: string;
}

function LeaderManagementContent() {
    const alerts = useAlerts()
    const searchParams = useSearchParams()
    const targetGroupId = searchParams.get('groupId')
    
    const [leaders, setLeaders] = useState<Leader[]>([])
    const [groups, setGroups] = useState<Group[]>([])
    const [communications, setCommunications] = useState<Communication[]>([])
    const [form, setForm] = useState({ name: "", email: "", password: "", groupId: targetGroupId || "" })
    const [isLoading, setIsLoading] = useState(false)
    const [editingLeader, setEditingLeader] = useState<Leader | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [showCompose, setShowCompose] = useState(false)
    const [sending, setSending] = useState(false)
    const [activeTab, setActiveTab] = useState<'leaders' | 'communications'>('leaders')
    
    // Communication form state
    const [commForm, setCommForm] = useState({
        subject: '',
        message: '',
        priority: 'medium' as const,
        category: 'general' as const,
        scheduledFor: ''
    })

    const fetchLeaders = async () => {
        const res = await fetch("/api/bishop/leaders")
        const data = await res.json()
        setLeaders(data.leaders)
    }

    const fetchCommunications = async () => {
        try {
            const response = await fetch('/api/bishop/communications?recipients=all_leaders');
            const result = await response.json();
            if (result.success) {
                setCommunications(result.data.communications);
            }
        } catch (error) {
            console.error('Error fetching communications:', error);
        }
    }

    const fetchGroups = async () => {
        try {
            const res = await fetch("/api/bishop/groups")
            const data = await res.json()
            setGroups(data.groups)
        } catch (err) {
            console.error("Error fetching groups:", err)
        }
    }

    const createLeader = async () => {
        if (!form.name || !form.email || !form.password || !form.groupId) {
            return alerts.warning(
                "Missing Information",
                "Please fill in all required fields before creating a leader.",
                [
                    {
                        label: "OK",
                        action: () => {},
                        variant: "primary"
                    }
                ]
            )
        }

        setIsLoading(true)
        try {
            const res = await fetch("/api/bishop/leaders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })

            if (res.ok) {
                const leaderName = form.name;
                setForm({ name: "", email: "", password: "", groupId: targetGroupId || "" })
                await fetchLeaders()
                
                alerts.success(
                    "Leader Created Successfully!",
                    `${leaderName} has been added as a leader and assigned to the selected group.`,
                    [
                        {
                            label: "View Leaders",
                            action: () => window.location.reload(),
                            variant: "primary"
                        },
                        {
                            label: "Create Another",
                            action: () => {},
                            variant: "secondary"
                        }
                    ]
                )
            } else {
                const error = await res.json()
                alerts.error(
                    "Failed to Create Leader",
                    error.message || "An error occurred while creating the leader.",
                    [
                        {
                            label: "Try Again",
                            action: () => createLeader(),
                            variant: "primary"
                        }
                    ]
                )
            }
        } catch (err) {
            console.error("Error creating leader:", err)
            alerts.error(
                "Network Error",
                "Failed to create leader. Please check your connection and try again.",
                [
                    {
                        label: "Retry",
                        action: () => createLeader(),
                        variant: "primary"
                    }
                ]
            )
        } finally {
            setIsLoading(false)
        }
    }

    const handleEditLeader = (leader: Leader) => {
        setEditingLeader(leader)
        setIsEditModalOpen(true)
    }

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false)
        setEditingLeader(null)
    }

    const handleLeaderUpdated = async () => {
        await fetchLeaders()
    }

    const handleLogout = async () => {
        try {
            await fetch("/api/logout", { method: "POST" })
            window.location.href = "/"
        } catch (error) {
            console.error("Logout error:", error)
        }
    }

    const handleSendMessage = async () => {
        if (!commForm.subject || !commForm.message) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setSending(true);
            
            const response = await fetch('/api/bishop/communications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...commForm,
                    recipients: { type: 'all_leaders' },
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
        low: 'bg-gray-100 text-gray-800',
        medium: 'bg-blue-100 text-blue-800',
        high: 'bg-orange-100 text-orange-800',
        urgent: 'bg-red-100 text-red-800'
    };

    useEffect(() => {
        Promise.all([fetchLeaders(), fetchGroups(), fetchCommunications()]).catch((err) => console.error("Error initializing data:", err))
    }, [])

    return (
        <div className="min-h-screen bg-blue-300">
            <ProfessionalHeader
                title="Leader Management"
                subtitle={targetGroupId ? "Assign or edit leaders for the selected group" : "Create and manage church leaders"}
                backHref="/bishop"
                actions={[
                    {
                        label: "View Groups",
                        href: "/bishop/groups",
                        variant: "outline",
                        icon: <UserCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                    },
                    {
                        label: "Logout",
                        onClick: handleLogout,
                        variant: "outline",
                        className: "border-red-300 text-red-100 bg-red-600/20 hover:bg-red-600/30",
                        icon: <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                    }
                ]}
            />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-2 sm:py-4 md:py-6 space-y-4 sm:space-y-6">
                {/* Tabs */}
                <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-3 sm:p-4">
                    <div className="flex space-x-1">
                        <button
                            onClick={() => setActiveTab('leaders')}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === 'leaders'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-blue-700 hover:bg-blue-100'
                            }`}
                        >
                            <Users className="h-4 w-4 inline mr-2" />
                            Leaders
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
                            Communications
                        </button>
                    </div>
                </div>

                {activeTab === 'leaders' && (
                    <>
                {/* Create Leader Form */}
                <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-3 sm:p-4 md:p-6">
                    <h2 className="text-sm sm:text-lg font-medium text-blue-800 mb-2 sm:mb-4">Create New Leader</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                            <input
                                placeholder="Leader Name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full px-2 sm:px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 text-blue-800 placeholder-blue-600 bg-white/90 text-sm sm:text-base"
                            />
                            <input
                                placeholder="Email (for login)"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full px-2 sm:px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 text-blue-800 placeholder-blue-600 bg-white/90 text-sm sm:text-base"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                            <input
                                type="password"
                                placeholder="Password (for login)"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full px-2 sm:px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 text-blue-800 placeholder-blue-600 bg-white/90 text-sm sm:text-base"
                            />
                            <select
                                value={form.groupId}
                                onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                                className="px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 text-blue-800 bg-white/90"
                            >
                                <option value="">Select a Group</option>
                                {groups.map((group) => (
                                    <option key={group._id} value={group._id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={createLeader}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? "Creating..." : "Create Leader & Assign Group"}
                        </button>
                    </div>
                </div>

                {/* Leaders List */}
                <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300">
                    <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 border-b border-blue-300">
                        <h2 className="text-sm sm:text-lg font-medium text-blue-800">All Leaders</h2>
                    </div>
                    
                    {leaders.length > 0 ? (
                        <div className="divide-y divide-blue-300">
                            {leaders.map((leader: Leader) => (
                                <div key={leader._id} className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/10">
                                    <div>
                                        <h3 className="text-sm font-medium text-blue-800">{leader.name}</h3>
                                        <p className="text-sm text-blue-700">{leader.email}</p>
                                        <p className="text-xs text-blue-600">Group: {leader.group?.name || "Not assigned"}</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => handleEditLeader(leader)}
                                            className="w-full sm:w-auto inline-flex items-center justify-center px-2 sm:px-3 py-1 sm:py-2 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <Edit className="h-3 w-3 mr-1" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (confirm(`Are you sure you want to delete ${leader.name}?`)) {
                                                    await fetch(`/api/bishop/leaders/${leader._id}`, { method: "DELETE" })
                                                    await fetchLeaders()
                                                }
                                            }}
                                            className="w-full sm:w-auto inline-flex items-center justify-center px-2 sm:px-3 py-1 sm:py-2 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 sm:py-12 px-4">
                            <Users className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-blue-500" />
                            <h3 className="mt-2 text-sm font-medium text-blue-800">No leaders yet</h3>
                            <p className="mt-1 text-xs sm:text-sm text-blue-600">Create your first leader to get started.</p>
                        </div>
                    )}
                </div>
                    </>
                )}

                {activeTab === 'communications' && (
                    <div className="space-y-4 sm:space-y-6">
                        {/* Compose Message */}
                        <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-3 sm:p-4 md:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm sm:text-lg font-medium text-blue-800">Send Message to All Leaders</h2>
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
                                                Send a message to all leaders
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
                        </div>

                        {/* Communications List */}
                        <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-3 sm:p-4 md:p-6">
                            <h2 className="text-sm sm:text-lg font-medium text-blue-800 mb-4">Sent Messages</h2>
                            {communications.length === 0 ? (
                                <div className="text-center py-8">
                                    <MessageSquare className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-blue-800 mb-2">No messages sent</h3>
                                    <p className="text-blue-600">Start by composing your first message to leaders</p>
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
                                                        <span>To: All Leaders</span>
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
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Leader Modal */}
            {editingLeader && (
                <EditLeaderModal
                    leader={editingLeader}
                    groups={groups}
                    isOpen={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    onLeaderUpdated={handleLeaderUpdated}
                />
            )}
        </div>
    )
}

export default function LeaderManagement() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LeaderManagementContent />
        </Suspense>
    )
}
