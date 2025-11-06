"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';
import { useAlerts } from "@/components/ui/alert-system"
import { ProfessionalHeader } from "@/components/ProfessionalHeader"

import { format } from "date-fns"
import {
  Heart,
  Download,
  Eye,
  MessageSquare,
  Filter,
  Search,
  Calendar,
  User,
  Phone,
  Mail,
  Tag,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  LogOut,
  ArrowLeft,
  MoreVertical,
  Edit,
  Trash2,
  Gift
} from "lucide-react"

interface PrayerRequest {
  _id: string
  member: {
    _id: string
    name: string
    email: string
    phone?: string
  }
  title: string
  description: string
  category: string
  priority: string
  status: string
  isPrivate: boolean
  createdAt: string
  bishopNotes?: string
  answeredDate?: string
  tags: string[]
  daysSinceSubmission: number
}

interface ThanksgivingMessage {
  _id: string
  member: {
    _id: string
    name: string
    email: string
    phone?: string
  }
  title: string
  description: string
  category: string
  priority: string
  status: string
  isPrivate: boolean
  createdAt: string
  bishopNotes?: string
  acknowledgedDate?: string
  tags: string[]
  daysSinceSubmission: number
}

interface PrayerStats {
  total: number
  pending: number
  inProgress: number
  answered: number
  urgent: number
  byCategory: Record<string, number>
}

export default function BishopPrayerRequestsPage() {
  const alerts = useAlerts()
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([])
  const [thanksgivingMessages, setThanksgivingMessages] = useState<ThanksgivingMessage[]>([])
  const [filteredRequests, setFilteredRequests] = useState<PrayerRequest[]>([])
  const [filteredThanksgiving, setFilteredThanksgiving] = useState<ThanksgivingMessage[]>([])
  const [stats, setStats] = useState<PrayerStats | null>(null)
  const [thanksgivingStats, setThanksgivingStats] = useState<PrayerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState<PrayerRequest | null>(null)
  const [selectedThanksgiving, setSelectedThanksgiving] = useState<ThanksgivingMessage | null>(null)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [showThanksgivingNotesModal, setShowThanksgivingNotesModal] = useState(false)
  const [notes, setNotes] = useState('')
  const [activeTab, setActiveTab] = useState<'prayers' | 'thanksgiving'>('prayers')

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch prayer requests
      const prayerResponse = await fetch('/api/bishop/prayer-requests', {
        credentials: "include",
      })

      if (prayerResponse.ok) {
        const prayerResult = await prayerResponse.json()
        if (prayerResult.success) {
          const reqs = prayerResult.data?.prayerRequests || []
          const s = prayerResult.data?.stats || null
          setPrayerRequests(reqs)
          setFilteredRequests(reqs)
          setStats(s)
        }
      }

      // Fetch thanksgiving messages
      const thanksgivingResponse = await fetch('/api/bishop/thanksgiving', {
        credentials: "include",
      })

      if (thanksgivingResponse.ok) {
        const thanksgivingResult = await thanksgivingResponse.json()
        if (thanksgivingResult.success) {
          const msgs = thanksgivingResult.data?.thanksgivingMessages || []
          const s = thanksgivingResult.data?.stats || null
          setThanksgivingMessages(msgs)
          setFilteredThanksgiving(msgs)
          setThanksgivingStats(s)
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      alerts.error("Error", err instanceof Error ? err.message : "Failed to fetch data")
      // Ensure safe state to avoid undefined access during render
      setPrayerRequests([])
      setFilteredRequests([])
      setStats(null)
      setThanksgivingMessages([])
      setFilteredThanksgiving([])
      setThanksgivingStats(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async (requestId: string) => {
    try {
      setDownloading(requestId)
      const response = await fetch(`/api/bishop/prayer-requests/${requestId}/pdf`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to generate PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prayer-request-${requestId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alerts.success("PDF Downloaded", "Prayer request PDF has been downloaded successfully")
    } catch (err) {
      alerts.error("Download Failed", "Failed to download PDF")
    } finally {
      setDownloading(null)
    }
  }

  const handleDownloadThanksgivingPDF = async (thanksgivingId: string) => {
    try {
      setDownloading(thanksgivingId)
      const response = await fetch(`/api/bishop/thanksgiving/${thanksgivingId}/pdf`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to generate PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `thanksgiving-${thanksgivingId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alerts.success("PDF Downloaded", "Thanksgiving PDF has been downloaded successfully")
    } catch (err) {
      alerts.error("Download Failed", "Failed to download PDF")
    } finally {
      setDownloading(null)
    }
  }

  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/bishop/prayer-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ status: newStatus })
      })

      const result = await response.json()
      if (result.success) {
        alerts.success("Status Updated", "Prayer request status updated successfully")
        fetchData()
      } else {
        alerts.error("Update Failed", result.error || "Failed to update status")
      }
    } catch (err) {
      alerts.error("Update Failed", "Failed to update status")
    }
  }

  const handleUpdateThanksgivingStatus = async (thanksgivingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/bishop/thanksgiving/${thanksgivingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ status: newStatus })
      })

      const result = await response.json()
      if (result.success) {
        alerts.success("Status Updated", "Thanksgiving status updated successfully")
        fetchData()
      } else {
        alerts.error("Update Failed", result.error || "Failed to update status")
      }
    } catch (err) {
      alerts.error("Update Failed", "Failed to update status")
    }
  }

  const handleAddNotes = async () => {
    if (!selectedRequest) return

    try {
      const response = await fetch(`/api/bishop/prayer-requests/${selectedRequest._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ 
          bishopNotes: notes,
          status: selectedRequest.status === 'pending' ? 'in-progress' : selectedRequest.status
        })
      })

      const result = await response.json()
      if (result.success) {
        alerts.success("Notes Added", "Bishop's notes added successfully")
        setShowNotesModal(false)
        setNotes('')
        setSelectedRequest(null)
        fetchData()
      } else {
        alerts.error("Update Failed", result.error || "Failed to add notes")
      }
    } catch (err) {
      alerts.error("Update Failed", "Failed to add notes")
    }
  }

  const handleAddThanksgivingNotes = async () => {
    if (!selectedThanksgiving) return

    try {
      const response = await fetch(`/api/bishop/thanksgiving/${selectedThanksgiving._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ 
          bishopNotes: notes,
          status: selectedThanksgiving.status === 'pending' ? 'in-progress' : selectedThanksgiving.status
        })
      })

      const result = await response.json()
      if (result.success) {
        alerts.success("Notes Added", "Bishop's notes added successfully")
        setShowThanksgivingNotesModal(false)
        setNotes('')
        setSelectedThanksgiving(null)
        fetchData()
      } else {
        alerts.error("Update Failed", result.error || "Failed to add notes")
      }
    } catch (err) {
      alerts.error("Update Failed", "Failed to add notes")
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" })
      window.location.href = "/"
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    let filtered = activeTab === 'prayers' ? prayerRequests : thanksgivingMessages

    // Search filter
    if (searchTerm) {
      filtered = filtered?.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.member.email.toLowerCase().includes(searchTerm.toLowerCase())
      ) || []
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered?.filter(item => item.status === statusFilter) || []
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered?.filter(item => item.priority === priorityFilter) || []
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered?.filter(item => item.category === categoryFilter) || []
    }

    if (activeTab === 'prayers') {
      setFilteredRequests(filtered as PrayerRequest[])
    } else {
      setFilteredThanksgiving(filtered as ThanksgivingMessage[])
    }
  }, [prayerRequests, thanksgivingMessages, searchTerm, statusFilter, priorityFilter, categoryFilter, activeTab])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'in-progress': return 'text-blue-600 bg-blue-100'
      case 'answered': return 'text-green-600 bg-green-100'
      case 'closed': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-blue-600 bg-blue-100'
      case 'low': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'health': return '🏥'
      case 'family': return '👨‍👩‍👧‍👦'
      case 'financial': return '💰'
      case 'spiritual': return '🙏'
      case 'work': return '💼'
      case 'relationships': return '❤️'
      default: return '📝'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-300">
        <ProfessionalHeader
          title="Prayer Requests Management"
          subtitle="Loading prayer requests..."
        />
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <UltraFastCardSkeleton key={i} />
            ))}
          </div>

          {/* Prayer Requests Table Skeleton */}
          <UltraFastTableSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-300 overflow-x-hidden">
      <ProfessionalHeader
        title="Prayer Requests & Thanksgiving Management"
        subtitle="Review, respond to, and manage member prayer requests and thanksgiving messages"
        backHref="/bishop"
        actions={[
          {
            label: "Logout",
            onClick: handleLogout,
            variant: "outline",
            className: "border-red-300 text-red-100 bg-red-600/20 hover:bg-red-600/30",
            icon: <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
          }
        ]}
      />

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6">
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-blue-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('prayers')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'prayers'
                ? 'bg-blue-600 text-white'
                : 'text-blue-600 hover:bg-blue-200'
            }`}
          >
            <Heart className="h-4 w-4 inline mr-2" />
            Prayer Requests
          </button>
          <button
            onClick={() => setActiveTab('thanksgiving')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'thanksgiving'
                ? 'bg-blue-600 text-white'
                : 'text-blue-600 hover:bg-blue-200'
            }`}
          >
            <Gift className="h-4 w-4 inline mr-2" />
            Thanksgiving Messages
          </button>
        </div>

        {/* Statistics Overview */}
        {(activeTab === 'prayers' ? stats : thanksgivingStats) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-xl font-bold text-blue-800">
                  {(activeTab === 'prayers' ? stats : thanksgivingStats)?.total || 0}
                </div>
                <div className="text-xs sm:text-sm text-blue-600">
                  {activeTab === 'prayers' ? 'Total Requests' : 'Total Messages'}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-yellow-100 border border-yellow-300">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-xl font-bold text-yellow-800">
                  {(activeTab === 'prayers' ? stats : thanksgivingStats)?.pending || 0}
                </div>
                <div className="text-xs sm:text-sm text-yellow-600">Pending</div>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-100 border border-blue-300">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-xl font-bold text-blue-800">
                  {(activeTab === 'prayers' ? stats : thanksgivingStats)?.inProgress || 0}
                </div>
                <div className="text-xs sm:text-sm text-blue-600">In Progress</div>
              </CardContent>
            </Card>
            
            <Card className="bg-green-100 border border-green-300">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-xl font-bold text-green-800">
                  {(activeTab === 'prayers' ? stats : thanksgivingStats)?.answered || 0}
                </div>
                <div className="text-xs sm:text-sm text-green-600">
                  {activeTab === 'prayers' ? 'Answered' : 'Acknowledged'}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-red-100 border border-red-300">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-xl font-bold text-red-800">
                  {(activeTab === 'prayers' ? stats : thanksgivingStats)?.urgent || 0}
                </div>
                <div className="text-xs sm:text-sm text-red-600">Urgent</div>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-100 border border-purple-300">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-xl font-bold text-purple-800">
                  {Object.keys((activeTab === 'prayers' ? stats : thanksgivingStats)?.byCategory || {}).length}
                </div>
                <div className="text-xs sm:text-sm text-purple-600">Categories</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-600" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 bg-white/90"
                    placeholder="Search requests..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 bg-white/90"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="answered">Answered</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 bg-white/90"
                >
                  <option value="all">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 bg-white/90"
                >
                  <option value="all">All Categories</option>
                  <option value="spiritual">Spiritual</option>
                  <option value="health">Health</option>
                  <option value="family">Family</option>
                  <option value="financial">Financial</option>
                  <option value="work">Work</option>
                  <option value="relationships">Relationships</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content List */}
        <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              {activeTab === 'prayers' ? <Heart className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
              {activeTab === 'prayers' 
                ? `Prayer Requests (${filteredRequests?.length || 0})`
                : `Thanksgiving Messages (${filteredThanksgiving?.length || 0})`
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === 'prayers' ? (
              !filteredRequests || filteredRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <p className="text-blue-600">No prayer requests found</p>
                  <p className="text-sm text-blue-500 mt-2">
                    {!prayerRequests || prayerRequests.length === 0 
                      ? "No prayer requests have been submitted yet"
                      : "Try adjusting your filters to see more results"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests?.map((request) => (
                    <div 
                      key={request._id}
                      className="animate-fade-in bg-white/80 p-3 sm:p-4 rounded-lg border border-blue-200"
                    >
                      <div className="space-y-4">
                      <div className="flex-1">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getCategoryIcon(request.category)}</span>
                              <h3 className="font-medium text-blue-800 break-words">{request.title}</h3>
                              {request.isPrivate && (
                                <Eye className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request)
                                setNotes(request.bishopNotes || '')
                                setShowNotesModal(true)
                              }}
                              className="border-blue-300 text-blue-800 hover:bg-blue-100"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadPDF(request._id)}
                              disabled={downloading === request._id}
                              className="border-blue-300 text-blue-800 hover:bg-blue-100"
                            >
                              {downloading === request._id ? (
                                <Clock className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-blue-700 mb-3 break-words" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {request.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status.replace('-', ' ')}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                            {request.priority}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {request.category}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-blue-600 mb-3">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="truncate">{request.member.name}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{request.member.email}</span>
                          </span>
                          {request.member.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span className="truncate">{request.member.phone}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(request.createdAt), "MMM dd, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {request.daysSinceSubmission} days ago
                          </span>
                        </div>
                      </div>
                      
                        <div className="flex flex-col gap-2">
                          <select
                            value={request.status}
                            onChange={(e) => handleUpdateStatus(request._id, e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-blue-800 bg-white/90"
                          >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="answered">Answered</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>
                    
                    {request.bishopNotes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm font-medium text-blue-800 mb-1">Bishop's Notes:</p>
                        <p className="text-sm text-blue-700">{request.bishopNotes}</p>
                        {request.answeredDate && (
                          <p className="text-xs text-blue-600 mt-1">
                            Answered on {format(new Date(request.answeredDate), "MMM dd, yyyy")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
            ) : (
              !filteredThanksgiving || filteredThanksgiving.length === 0 ? (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <p className="text-blue-600">No thanksgiving messages found</p>
                  <p className="text-sm text-blue-500 mt-2">
                    {!thanksgivingMessages || thanksgivingMessages.length === 0 
                      ? "No thanksgiving messages have been submitted yet"
                      : "Try adjusting your filters to see more results"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredThanksgiving?.map((message) => (
                    <div 
                      key={message._id}
                      className="animate-fade-in bg-white/80 p-3 sm:p-4 rounded-lg border border-blue-200"
                    >
                      <div className="space-y-4">
                        <div className="flex-1">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getCategoryIcon(message.category)}</span>
                              <h3 className="font-medium text-blue-800 break-words">{message.title}</h3>
                              {message.isPrivate && (
                                <Eye className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedThanksgiving(message)
                                  setNotes(message.bishopNotes || '')
                                  setShowThanksgivingNotesModal(true)
                                }}
                                className="border-blue-300 text-blue-800 hover:bg-blue-100"
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Notes
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadThanksgivingPDF(message._id)}
                                disabled={downloading === message._id}
                                className="border-green-300 text-green-800 hover:bg-green-100"
                              >
                                {downloading === message._id ? (
                                  <Clock className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Download className="h-3 w-3 mr-1" />
                                )}
                                PDF
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-blue-700 mb-3 break-words" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {message.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                              {message.status.replace('-', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(message.priority)}`}>
                              {message.priority}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {message.category}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-blue-600">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span className="truncate">{message.member.name}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{message.member.email}</span>
                            </span>
                            {message.member.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span className="truncate">{message.member.phone}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(message.createdAt), "MMM dd, yyyy")}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <select
                            value={message.status}
                            onChange={(e) => handleUpdateThanksgivingStatus(message._id, e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-blue-800 bg-white/90"
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="acknowledged">Acknowledged</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </div>
                      
                      {message.bishopNotes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                          <p className="text-sm font-medium text-blue-800 mb-1">Bishop's Notes:</p>
                          <p className="text-sm text-blue-700">{message.bishopNotes}</p>
                          {message.acknowledgedDate && (
                            <p className="text-xs text-blue-600 mt-1">
                              Acknowledged on {format(new Date(message.acknowledgedDate), "MMM dd, yyyy")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes Modal */}
      {showNotesModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-blue-800 mb-4">
              Add Bishop's Notes
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-blue-800 mb-1">
                Notes for {selectedRequest.member.name}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800"
                rows={4}
                placeholder="Add your notes or response..."
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleAddNotes}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Notes
              </Button>
              <Button
                onClick={() => {
                  setShowNotesModal(false)
                  setNotes('')
                  setSelectedRequest(null)
                }}
                variant="outline"
                className="border-blue-300 text-blue-800 hover:bg-blue-100"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Thanksgiving Notes Modal */}
      {showThanksgivingNotesModal && selectedThanksgiving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              Add Notes for Thanksgiving Message
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-32 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800"
              placeholder="Add your notes here..."
            />
            <div className="flex gap-3 mt-4">
              <Button
                onClick={handleAddThanksgivingNotes}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Notes
              </Button>
              <Button
                onClick={() => {
                  setShowThanksgivingNotesModal(false)
                  setNotes('')
                  setSelectedThanksgiving(null)
                }}
                variant="outline"
                className="border-blue-300 text-blue-800 hover:bg-blue-100"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
