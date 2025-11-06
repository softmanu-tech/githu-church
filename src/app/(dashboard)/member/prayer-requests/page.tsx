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
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Send,
  LogOut,
  ArrowLeft,
  Calendar,
  Tag,
  Eye,
  EyeOff,
  Gift
} from "lucide-react"

interface PrayerRequest {
  _id: string
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
}

interface ThanksgivingMessage {
  _id: string
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
}

interface MemberData {
  name: string
  email: string
  phone?: string
}

export default function MemberPrayerRequestsPage() {
  const alerts = useAlerts()
  const [memberData, setMemberData] = useState<MemberData | null>(null)
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([])
  const [thanksgivingMessages, setThanksgivingMessages] = useState<ThanksgivingMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showThanksgivingForm, setShowThanksgivingForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'prayers' | 'thanksgiving'>('prayers')
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    category: 'spiritual',
    priority: 'medium',
    isPrivate: false,
    tags: [] as string[]
  })
  const [newThanksgiving, setNewThanksgiving] = useState({
    title: '',
    description: '',
    category: 'blessing',
    priority: 'medium',
    isPrivate: false,
    tags: [] as string[]
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch prayer requests
      const prayerResponse = await fetch('/api/member/prayer-requests', {
        credentials: "include",
      })

      if (!prayerResponse.ok) {
        throw new Error("Failed to fetch prayer requests")
      }

      const prayerResult = await prayerResponse.json()
      if (prayerResult.success) {
        setMemberData(prayerResult.data?.memberData || null)
        setPrayerRequests(prayerResult.data?.prayerRequests || [])
      } else {
        throw new Error(prayerResult.error || "Failed to fetch prayer requests")
      }

      // Fetch thanksgiving messages
      const thanksgivingResponse = await fetch('/api/member/thanksgiving', {
        credentials: "include",
      })

      if (thanksgivingResponse.ok) {
        const thanksgivingResult = await thanksgivingResponse.json()
        if (thanksgivingResult.success) {
          setThanksgivingMessages(thanksgivingResult.data?.thanksgivingMessages || [])
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      alerts.error("Error", err instanceof Error ? err.message : "Failed to fetch data")
      // Set default values to prevent undefined errors
      setMemberData(null)
      setPrayerRequests([])
      setThanksgivingMessages([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitRequest = async () => {
    if (!newRequest.title.trim() || !newRequest.description.trim()) {
      alerts.error("Validation Error", "Please fill in all required fields")
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/member/prayer-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify(newRequest)
      })

      const result = await response.json()
      if (result.success) {
        alerts.success("Prayer Request Submitted", "Your prayer request has been sent to the Bishop")
        setNewRequest({
          title: '',
          description: '',
          category: 'spiritual',
          priority: 'medium',
          isPrivate: false,
          tags: []
        })
        setShowForm(false)
        fetchData() // Refresh the list
      } else {
        alerts.error("Submission Failed", result.error || "Failed to submit prayer request")
      }
    } catch (err) {
      alerts.error("Submission Failed", "Failed to submit prayer request")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitThanksgiving = async () => {
    if (!newThanksgiving.title.trim() || !newThanksgiving.description.trim()) {
      alerts.error("Validation Error", "Please fill in all required fields")
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/member/thanksgiving', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify(newThanksgiving)
      })

      const result = await response.json()
      if (result.success) {
        alerts.success("Thanksgiving Submitted", "Your thanksgiving message has been sent to the Bishop")
        setNewThanksgiving({
          title: '',
          description: '',
          category: 'blessing',
          priority: 'medium',
          isPrivate: false,
          tags: []
        })
        setShowThanksgivingForm(false)
        fetchData() // Refresh the list
      } else {
        alerts.error("Submission Failed", result.error || "Failed to submit thanksgiving message")
      }
    } catch (err) {
      alerts.error("Submission Failed", "Failed to submit thanksgiving message")
    } finally {
      setSubmitting(false)
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
          title="Prayer Requests & Thanksgiving"
          subtitle="Submit and track your prayer requests"
          backHref="/member"
        />
        
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <UltraFastCardSkeleton key={i} />
            ))}
          </div>

          {/* Content Skeleton */}
          <UltraFastTableSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-300 overflow-x-hidden">
      <ProfessionalHeader
        title="Prayer Requests & Thanksgiving"
        subtitle={`${memberData?.name} • Submit and track your prayer requests and thanksgiving messages`}
        backHref="/member"
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

      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6">
        
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
            Thanksgiving
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-blue-800">
                {activeTab === 'prayers' ? (prayerRequests?.length || 0) : (thanksgivingMessages?.length || 0)}
              </div>
              <div className="text-xs sm:text-sm text-blue-600">
                {activeTab === 'prayers' ? 'Total Requests' : 'Total Messages'}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-yellow-100 border border-yellow-300">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-yellow-800">
                {activeTab === 'prayers' 
                  ? (prayerRequests?.filter(r => r.status === 'pending').length || 0)
                  : (thanksgivingMessages?.filter(t => t.status === 'pending').length || 0)
                }
              </div>
              <div className="text-xs sm:text-sm text-yellow-600">Pending</div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-100 border border-green-300">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-green-800">
                {activeTab === 'prayers'
                  ? (prayerRequests?.filter(r => r.status === 'answered').length || 0)
                  : (thanksgivingMessages?.filter(t => t.status === 'acknowledged').length || 0)
                }
              </div>
              <div className="text-xs sm:text-sm text-green-600">
                {activeTab === 'prayers' ? 'Answered' : 'Acknowledged'}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-100 border border-purple-300">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-purple-800">
                {activeTab === 'prayers'
                  ? (prayerRequests?.filter(r => r.priority === 'urgent').length || 0)
                  : (thanksgivingMessages?.filter(t => t.priority === 'urgent').length || 0)
                }
              </div>
              <div className="text-xs sm:text-sm text-purple-600">Urgent</div>
            </CardContent>
          </Card>
        </div>

        {/* Submit New Button */}
        <div className="text-center">
          <Button
            onClick={() => {
              if (activeTab === 'prayers') {
                setShowForm(!showForm)
                setShowThanksgivingForm(false)
              } else {
                setShowThanksgivingForm(!showThanksgivingForm)
                setShowForm(false)
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
          >
            <Plus className="h-4 w-4 mr-2" />
            {activeTab === 'prayers' 
              ? (showForm ? 'Cancel' : 'Submit New Prayer Request')
              : (showThanksgivingForm ? 'Cancel' : 'Submit New Thanksgiving')
            }
          </Button>
        </div>

        {/* Prayer Request Form */}
        {showForm && (
          <div className="animate-fade-in">
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Submit Prayer Request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-1">
                    Request Title *
                  </label>
                  <input
                    type="text"
                    value={newRequest.title}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 bg-white/90"
                    placeholder="Brief title for your prayer request"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-1">
                    Prayer Request Details *
                  </label>
                  <textarea
                    value={newRequest.description}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 bg-white/90"
                    rows={4}
                    placeholder="Please share the details of your prayer request..."
                    maxLength={2000}
                  />
                  <div className="text-xs text-blue-600 mt-1">
                    {newRequest.description.length}/2000 characters
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">
                      Category
                    </label>
                    <select
                      value={newRequest.category}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 bg-white/90"
                    >
                      <option value="spiritual">Spiritual Growth</option>
                      <option value="health">Health & Healing</option>
                      <option value="family">Family</option>
                      <option value="financial">Financial</option>
                      <option value="work">Work/Career</option>
                      <option value="relationships">Relationships</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">
                      Priority
                    </label>
                    <select
                      value={newRequest.priority}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 bg-white/90"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={newRequest.isPrivate}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, isPrivate: e.target.checked }))}
                    className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isPrivate" className="text-sm text-blue-800">
                    Keep this request private (only visible to Bishop)
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleSubmitRequest}
                    disabled={submitting || !newRequest.title.trim() || !newRequest.description.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {submitting ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Request
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowForm(false)}
                    variant="outline"
                    className="border-blue-300 text-blue-800 hover:bg-blue-100"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Thanksgiving Form */}
        {showThanksgivingForm && (
          <div className="animate-fade-in">
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Submit Thanksgiving Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-1">
                    Thanksgiving Title *
                  </label>
                  <input
                    type="text"
                    value={newThanksgiving.title}
                    onChange={(e) => setNewThanksgiving(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 bg-white/90"
                    placeholder="Brief title for your thanksgiving message"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-1">
                    Thanksgiving Details *
                  </label>
                  <textarea
                    value={newThanksgiving.description}
                    onChange={(e) => setNewThanksgiving(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 bg-white/90"
                    rows={4}
                    placeholder="Please share your thanksgiving message..."
                    maxLength={2000}
                  />
                  <div className="text-xs text-blue-600 mt-1">
                    {newThanksgiving.description.length}/2000 characters
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">
                      Category
                    </label>
                    <select
                      value={newThanksgiving.category}
                      onChange={(e) => setNewThanksgiving(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 bg-white/90"
                    >
                      <option value="answered-prayer">Answered Prayer</option>
                      <option value="blessing">Blessing</option>
                      <option value="healing">Healing</option>
                      <option value="provision">Provision</option>
                      <option value="protection">Protection</option>
                      <option value="guidance">Guidance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">
                      Priority
                    </label>
                    <select
                      value={newThanksgiving.priority}
                      onChange={(e) => setNewThanksgiving(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 bg-white/90"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrivateThanksgiving"
                    checked={newThanksgiving.isPrivate}
                    onChange={(e) => setNewThanksgiving(prev => ({ ...prev, isPrivate: e.target.checked }))}
                    className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isPrivateThanksgiving" className="text-sm text-blue-800">
                    Keep this thanksgiving private (only visible to Bishop)
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleSubmitThanksgiving}
                    disabled={submitting || !newThanksgiving.title.trim() || !newThanksgiving.description.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {submitting ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Thanksgiving
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowThanksgivingForm(false)}
                    variant="outline"
                    className="border-blue-300 text-blue-800 hover:bg-blue-100"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content List */}
        <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              {activeTab === 'prayers' ? <FileText className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
              {activeTab === 'prayers' 
                ? `Your Prayer Requests (${prayerRequests?.length || 0})`
                : `Your Thanksgiving Messages (${thanksgivingMessages?.length || 0})`
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === 'prayers' ? (
              !prayerRequests || prayerRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <p className="text-blue-600">No prayer requests submitted yet</p>
                  <p className="text-sm text-blue-500 mt-2">
                    Click "Submit New Prayer Request" to send your first request to the Bishop
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {prayerRequests?.map((request) => (
                    <div 
                      key={request._id}
                      className="animate-fade-in bg-white/80 p-3 sm:p-4 rounded-lg border border-blue-200"
                    >
                      <div className="space-y-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{getCategoryIcon(request.category)}</span>
                            <h3 className="font-medium text-blue-800 break-words">{request.title}</h3>
                            {request.isPrivate && (
                              <EyeOff className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          
                          <p className="text-sm text-blue-700 mb-3 break-words" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
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
                          
                          <div className="flex items-center gap-2 text-xs text-blue-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(request.createdAt), "MMM dd, yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {request.bishopNotes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                          <p className="text-sm font-medium text-blue-800 mb-1">Bishop's Response:</p>
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
              !thanksgivingMessages || thanksgivingMessages.length === 0 ? (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <p className="text-blue-600">No thanksgiving messages submitted yet</p>
                  <p className="text-sm text-blue-500 mt-2">
                    Click "Submit New Thanksgiving" to send your first thanksgiving message to the Bishop
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {thanksgivingMessages?.map((message) => (
                    <div 
                      key={message._id}
                      className="animate-fade-in bg-white/80 p-3 sm:p-4 rounded-lg border border-blue-200"
                    >
                      <div className="space-y-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{getCategoryIcon(message.category)}</span>
                            <h3 className="font-medium text-blue-800 break-words">{message.title}</h3>
                            {message.isPrivate && (
                              <EyeOff className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          
                          <p className="text-sm text-blue-700 mb-3 break-words" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
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
                          
                          <div className="flex items-center gap-2 text-xs text-blue-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(message.createdAt), "MMM dd, yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {message.bishopNotes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                          <p className="text-sm font-medium text-blue-800 mb-1">Bishop's Response:</p>
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
    </div>
  )
}
    