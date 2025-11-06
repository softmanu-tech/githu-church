"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';
import { useAlerts } from "@/components/ui/alert-system"
import { ProfessionalHeader } from "@/components/ProfessionalHeader"
import Link from "next/link"
import { format } from "date-fns"
import {
  UserPlus,
  Eye,
  MessageSquare,
  BarChart3,
  Users,
  CheckCircle,
  Clock,
  Target,
  ArrowLeft,
  Settings,
  LogOut,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Star,
  TrendingUp,
  AlertTriangle,
  FileText,
  Send,
  X,
  XCircle,
  Save,
  Plus,
  Minus,
  Award,
  Heart,
  Home,
  Briefcase
} from "lucide-react"

interface Visitor {
  _id: string
  name: string
  email: string
  phone?: string
  address?: string
  age?: number
  occupation?: string
  maritalStatus?: string
  type: string
  status: string
  monitoringStatus: string
  attendanceRate: number
  monitoringProgress: number
  daysRemaining: number
  createdAt: string
  integrationChecklist?: {
    welcomePackage: boolean
    homeVisit: boolean
    smallGroupIntro: boolean
    ministryOpportunities: boolean
    mentorAssigned: boolean
    regularCheckIns: boolean
  }
  integrationProgress?: number
  visitHistory: Array<{
    date: string
    eventType: string
    notes?: string
    attendanceStatus: string
  }>
  suggestions: Array<{
    date: string
    message: string
    category: string
  }>
  experiences: Array<{
    date: string
    rating: number
    message: string
    eventType?: string
  }>
  milestones: Array<{
    week: number
    completed: boolean
    notes?: string
    protocolMemberNotes?: string
    completedDate?: string
  }>
}

interface ResponsibilityData {
  protocolMember: {
    name: string
    email: string
    team: { name: string }
  }
  visitors: Visitor[]
  statistics: {
    totalVisitors: number
    joiningVisitors: number
    activeMonitoring: number
    needsAttention: number
    recentFeedback: number
    pendingReports: number
  }
  recentActivities: Array<{
    type: string
    description: string
    date: string
    visitorName: string
  }>
}

export default function ProtocolResponsibilitiesPage() {
  const alerts = useAlerts()
  const [data, setData] = useState<ResponsibilityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'register' | 'monitor' | 'feedback' | 'report' | 'assist' | 'attendance'>('register')

  // Registration states
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [newVisitor, setNewVisitor] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    age: '',
    occupation: '',
    maritalStatus: 'single',
    type: 'first-time',
    status: 'visiting',
    referredBy: '',
    howDidYouHear: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: ''
  })

  // Monitoring states
  const [selectedVisitor, setSelectedVisitor] = useState<string | null>(null)
  const [milestoneUpdate, setMilestoneUpdate] = useState({ week: 1, notes: '', completed: false })
  const [updatingMilestone, setUpdatingMilestone] = useState(false)

  // Report states
  const [reportData, setReportData] = useState<any>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [reportPeriod, setReportPeriod] = useState('monthly')

  // Integration tracking states
  const [selectedVisitorForIntegration, setSelectedVisitorForIntegration] = useState<Visitor | null>(null)
  const [updatingIntegration, setUpdatingIntegration] = useState(false)

  // Attendance tracking states
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [attendanceData, setAttendanceData] = useState<{[key: string]: 'present' | 'absent'}>({})
  const [markingAttendance, setMarkingAttendance] = useState(false)

  const fetchResponsibilityData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/protocol/responsibilities', {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch responsibility data")
      }

      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || "Failed to fetch responsibility data")
      }
    } catch (err) {
      console.error("Error fetching responsibility data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch responsibility data")
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterVisitor = async () => {
    if (!newVisitor.name || !newVisitor.email) {
      alerts.error("Validation Error", "Name and email are required")
      return
    }

    try {
      setRegistering(true)
      const response = await fetch('/api/protocol/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({
          ...newVisitor,
          age: newVisitor.age ? Number(newVisitor.age) : undefined,
          emergencyContact: newVisitor.emergencyContactName ? {
            name: newVisitor.emergencyContactName,
            phone: newVisitor.emergencyContactPhone,
            relationship: newVisitor.emergencyContactRelationship
          } : undefined
        })
      })

      const result = await response.json()
      if (result.success) {
        // Refresh data
        await fetchResponsibilityData()
        
        // Reset form
        setNewVisitor({
          name: '', email: '', phone: '', address: '', age: '', occupation: '', maritalStatus: 'single',
          type: 'first-time', status: 'visiting', referredBy: '', howDidYouHear: '',
          emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelationship: ''
        })
        setShowRegisterForm(false)
        alerts.success("Registration Success", `Visitor ${result.data.visitor.name} registered successfully!`)
      } else {
        alerts.error("Registration Error", result.error || "Failed to register visitor")
      }
    } catch (err) {
      alerts.error("Registration Error", "Failed to register visitor")
    } finally {
      setRegistering(false)
    }
  }

  const handleUpdateMilestone = async (visitorId: string, week: number, completed: boolean, notes: string) => {
    try {
      setUpdatingMilestone(true)
      const response = await fetch(`/api/protocol/visitors/${visitorId}/milestones`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ week, completed, notes })
      })

      const result = await response.json()
      if (result.success) {
        // Update visitor data
        setData(prev => prev ? {
          ...prev,
          visitors: prev.visitors.map(v => 
            v._id === visitorId ? { ...v, milestones: result.data.milestones, monitoringProgress: result.data.monitoringProgress } : v
          )
        } : null)
        setSelectedVisitor(null)
        alerts.success("Milestone Updated", "Milestone updated successfully")
      } else {
        alerts.error("Update Error", result.error || "Failed to update milestone")
      }
    } catch (err) {
      alerts.error("Update Error", "Failed to update milestone")
    } finally {
      setUpdatingMilestone(false)
    }
  }

  const generateBishopReport = async () => {
    try {
      setGeneratingReport(true)
      const response = await fetch(`/api/protocol/bishop-report?period=${reportPeriod}`, {
        method: 'POST',
        credentials: "include",
      })

      const result = await response.json()
      if (result.success) {
        setReportData(result.data)
        alerts.success("Report Generated", "Bishop report generated and sent successfully")
      } else {
        alerts.error("Report Error", result.error || "Failed to generate report")
      }
    } catch (err) {
      alerts.error("Report Error", "Failed to generate report")
    } finally {
      setGeneratingReport(false)
    }
  }

  const updateIntegrationChecklist = async (visitorId: string, checklistItem: string, completed: boolean) => {
    try {
      setUpdatingIntegration(true)
      
      const response = await fetch(`/api/protocol/visitors/${visitorId}/integration`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          checklistItem,
          completed
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update integration checklist')
      }
      
      const result = await response.json()
      
      if (result.success) {
        // Update the visitor in the data
        setData(prevData => {
          if (!prevData) return prevData
          
          return {
            ...prevData,
            visitors: prevData.visitors.map(visitor => 
              visitor._id === visitorId 
                ? {
                    ...visitor,
                    integrationChecklist: result.data.integrationChecklist,
                    integrationProgress: result.data.integrationProgress
                  }
                : visitor
            )
          }
        })
        
        alerts.success("Integration Updated", result.message)
      } else {
        throw new Error(result.error || 'Failed to update integration checklist')
      }
    } catch (err) {
      console.error('Update integration error:', err)
      alerts.error("Integration Error", err instanceof Error ? err.message : 'Failed to update integration checklist')
    } finally {
      setUpdatingIntegration(false)
    }
  }

  const markVisitorAttendance = async () => {
    if (!data || Object.keys(attendanceData).length === 0) {
      alerts.error('Validation Error', 'Please mark attendance for at least one visitor')
      return
    }

    try {
      setMarkingAttendance(true)
      
      const attendanceRecords = Object.entries(attendanceData).map(([visitorId, status]) => ({
        visitorId,
        date: selectedDate,
        eventType: 'Sunday Service',
        attendanceStatus: status,
        notes: `Marked by ${data.protocolMember.name}`
      }))

      const response = await fetch('/api/protocol/visitors/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          attendanceRecords
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to mark attendance')
      }
      
      const result = await response.json()
      
      if (result.success) {
        alerts.success("Attendance Marked", `Attendance marked for ${Object.keys(attendanceData).length} visitors`)
        setAttendanceData({})
        fetchResponsibilityData() // Refresh data
      } else {
        throw new Error(result.error || 'Failed to mark attendance')
      }
    } catch (err) {
      console.error('Mark attendance error:', err)
      alerts.error("Attendance Error", err instanceof Error ? err.message : 'Failed to mark attendance')
    } finally {
      setMarkingAttendance(false)
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
    setSelectedDate(new Date().toISOString().split('T')[0])
    fetchResponsibilityData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-300">
        <ProfessionalHeader
          title="Protocol Responsibilities"
          subtitle="Loading protocol responsibilities..."
        />
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <UltraFastCardSkeleton key={i} />
            ))}
          </div>

          {/* Responsibilities Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <UltraFastCardSkeleton />
            <UltraFastCardSkeleton />
          </div>

          {/* Responsibilities Table Skeleton */}
          <UltraFastTableSkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-300 flex items-center justify-center px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md text-center">
          <strong>Error:</strong> {error}
          <button 
            onClick={fetchResponsibilityData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-blue-300 flex items-center justify-center px-4">
        <div className="bg-blue-200/90 backdrop-blur-md rounded-lg p-6 border border-blue-300 text-center">
          <p className="text-blue-800">No responsibility data available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-300">
      <ProfessionalHeader
        title="Protocol Team Responsibilities"
        subtitle={`${data.protocolMember.team.name} • ${data.protocolMember.name}`}
        backHref="/protocol"
        actions={[
          {
            label: "Strategies",
            href: "/protocol/strategies",
            variant: "outline",
            className: "border-green-300 text-green-100 bg-green-600/20 hover:bg-green-600/30",
            icon: <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-6">
        
        {/* Statistics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-blue-800">{data.statistics.totalVisitors}</div>
              <div className="text-xs sm:text-sm text-blue-600">Total Visitors</div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-100 border border-green-300">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-green-800">{data.statistics.joiningVisitors}</div>
              <div className="text-xs sm:text-sm text-green-600">Joining</div>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-100 border border-purple-300">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-purple-800">{data.statistics.activeMonitoring}</div>
              <div className="text-xs sm:text-sm text-purple-600">Active Monitoring</div>
            </CardContent>
          </Card>
          
          <Card className="bg-orange-100 border border-orange-300">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-orange-800">{data.statistics.needsAttention}</div>
              <div className="text-xs sm:text-sm text-orange-600">Need Attention</div>
            </CardContent>
          </Card>
          
          <Card className="bg-teal-100 border border-teal-300">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-teal-800">{data.statistics.recentFeedback}</div>
              <div className="text-xs sm:text-sm text-teal-600">Recent Feedback</div>
            </CardContent>
          </Card>
          
          <Card className="bg-indigo-100 border border-indigo-300">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-indigo-800">{data.statistics.pendingReports}</div>
              <div className="text-xs sm:text-sm text-indigo-600">Pending Reports</div>
            </CardContent>
          </Card>
        </div>

        {/* Responsibility Tabs */}
        <div className="bg-blue-200/90 backdrop-blur-md rounded-lg p-2 border border-blue-300">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <Button
              onClick={() => setActiveTab('register')}
              className={`flex-shrink-0 min-w-20 sm:flex-1 text-xs sm:text-sm px-2 sm:px-3 py-2 ${
                activeTab === 'register' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-transparent text-blue-800 hover:bg-blue-100'
              }`}
            >
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:block truncate">Register Visitors</span>
            </Button>
            <Button
              onClick={() => setActiveTab('monitor')}
              className={`flex-shrink-0 min-w-20 sm:flex-1 text-xs sm:text-sm px-2 sm:px-3 py-2 ${
                activeTab === 'monitor' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-transparent text-blue-800 hover:bg-blue-100'
              }`}
            >
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:block truncate">Monitor Progress</span>
            </Button>
            <Button
              onClick={() => setActiveTab('feedback')}
              className={`flex-shrink-0 min-w-20 sm:flex-1 text-xs sm:text-sm px-2 sm:px-3 py-2 ${
                activeTab === 'feedback' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-transparent text-blue-800 hover:bg-blue-100'
              }`}
            >
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:block truncate">Collect Feedback</span>
            </Button>
            <Button
              onClick={() => setActiveTab('report')}
              className={`flex-shrink-0 min-w-20 sm:flex-1 text-xs sm:text-sm px-2 sm:px-3 py-2 ${
                activeTab === 'report' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-transparent text-blue-800 hover:bg-blue-100'
              }`}
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:block truncate">Report to Bishop</span>
            </Button>
            <Button
              onClick={() => setActiveTab('assist')}
              className={`flex-shrink-0 min-w-20 sm:flex-1 text-xs sm:text-sm px-2 sm:px-3 py-2 ${
                activeTab === 'assist' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-transparent text-blue-800 hover:bg-blue-100'
              }`}
            >
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:block truncate">Assist Integration</span>
            </Button>
            <Button
              onClick={() => setActiveTab('attendance')}
              className={`flex-shrink-0 min-w-20 sm:flex-1 text-xs sm:text-sm px-2 sm:px-3 py-2 ${
                activeTab === 'attendance' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-transparent text-blue-800 hover:bg-blue-100'
              }`}
            >
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:block truncate">Attendance</span>
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
        
        {/* 1. WELCOME AND REGISTER VISITORS */}
        {activeTab === 'register' && (
          <div className="animate-fade-in space-y-6">
            {/* Registration Form */}
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Welcome & Register New Visitors
                  </span>
                  <Button
                    onClick={() => setShowRegisterForm(!showRegisterForm)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {showRegisterForm ? 'Cancel' : 'Register New Visitor'}
                  </Button>
                </CardTitle>
              </CardHeader>
              {showRegisterForm && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={newVisitor.name}
                        onChange={(e) => setNewVisitor(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 bg-white/90"
                        placeholder="Enter visitor's full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-1">Email Address *</label>
                      <input
                        type="email"
                        value={newVisitor.email}
                        onChange={(e) => setNewVisitor(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 bg-white/90"
                        placeholder="visitor@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={newVisitor.phone}
                        onChange={(e) => setNewVisitor(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 bg-white/90"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-1">Age</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={newVisitor.age}
                        onChange={(e) => setNewVisitor(prev => ({ ...prev, age: e.target.value }))}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 bg-white/90"
                        placeholder="Age"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-1">Visitor Type</label>
                      <select
                        value={newVisitor.type}
                        onChange={(e) => setNewVisitor(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 bg-white/90"
                      >
                        <option value="first-time">First-time Visitor</option>
                        <option value="from-other-altar">From Other Church</option>
                        <option value="returning">Returning Visitor</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-1">Visitor Status</label>
                      <select
                        value={newVisitor.status}
                        onChange={(e) => setNewVisitor(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 bg-white/90"
                      >
                        <option value="visiting">Just Visiting</option>
                        <option value="joining">Interested in Joining</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-1">Occupation</label>
                      <input
                        type="text"
                        value={newVisitor.occupation}
                        onChange={(e) => setNewVisitor(prev => ({ ...prev, occupation: e.target.value }))}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 bg-white/90"
                        placeholder="Occupation"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-1">Marital Status</label>
                      <select
                        value={newVisitor.maritalStatus}
                        onChange={(e) => setNewVisitor(prev => ({ ...prev, maritalStatus: e.target.value }))}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 bg-white/90"
                      >
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="divorced">Divorced</option>
                        <option value="widowed">Widowed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Address</label>
                    <textarea
                      value={newVisitor.address}
                      onChange={(e) => setNewVisitor(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 bg-white/90"
                      rows={2}
                      placeholder="Home address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">How Did You Hear About Us?</label>
                    <input
                      type="text"
                      value={newVisitor.howDidYouHear}
                      onChange={(e) => setNewVisitor(prev => ({ ...prev, howDidYouHear: e.target.value }))}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 bg-white/90"
                      placeholder="Friend, online, social media, etc."
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={handleRegisterVisitor}
                      disabled={registering || !newVisitor.name || !newVisitor.email}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {registering ? 'Registering...' : 'Register Visitor'}
                    </Button>
                    <Button
                      onClick={() => setShowRegisterForm(false)}
                      variant="outline"
                      className="border-blue-300 text-blue-800 hover:bg-blue-100"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Recent Registrations */}
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recent Visitor Registrations ({data.visitors.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-3 md:p-4">
                {data.visitors.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                    <p className="text-blue-600 mb-4">No visitors registered yet</p>
                    <Button
                      onClick={() => setShowRegisterForm(true)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Register First Visitor
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.visitors.slice(0, 6).map((visitor) => (
                      <div key={visitor._id} className="bg-white/80 p-4 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-blue-800 truncate">{visitor.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs flex-shrink-0 ml-2 ${
                            visitor.status === 'joining' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {visitor.status}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="text-blue-600 flex items-center gap-1">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="hidden sm:block truncate">{visitor.email}</span>
                          </div>
                          {visitor.phone && (
                            <div className="text-blue-600 flex items-center gap-1">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span className="hidden sm:block truncate">{visitor.phone}</span>
                            </div>
                          )}
                          {visitor.address && (
                            <div className="text-blue-600 flex items-center gap-1">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="hidden sm:block truncate">{visitor.address}</span>
                            </div>
                          )}
                          <div className="text-blue-500 text-xs">
                            Registered: {format(new Date(visitor.createdAt), "MMM dd, yyyy")}
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

        {/* 2. MONITOR JOINING VISITORS PROGRESS */}
        {activeTab === 'monitor' && (
          <div className="animate-fade-in space-y-6">
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Monitor Joining Visitors Progress ({data.visitors.filter(v => v.status === 'joining').length} active)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-3 md:p-4">
                {data.visitors.filter(v => v.status === 'joining').length === 0 ? (
                  <div className="text-center py-8">
                    <Eye className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                    <p className="text-blue-600">No joining visitors to monitor yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.visitors.filter(v => v.status === 'joining').map((visitor) => (
                      <div key={visitor._id} className="bg-white/80 p-4 rounded-lg border border-blue-200">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-blue-800 truncate">{visitor.name}</h4>
                            <p className="text-sm text-blue-600 truncate">{visitor.email}</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="text-xs text-blue-500">
                                {visitor.daysRemaining > 0 ? `${visitor.daysRemaining} days remaining` : 'Monitoring period ended'}
                              </span>
                              {visitor.phone && (
                                <span className="text-xs text-blue-500 flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {visitor.phone}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-lg font-bold text-blue-800">{visitor.monitoringProgress}%</div>
                            <div className="text-xs text-blue-600">Progress</div>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-blue-100 rounded-full h-2 mb-3">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${visitor.monitoringProgress}%` }}
                          />
                        </div>

                        {/* Milestones - Responsive Grid */}
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1 sm:gap-2 mb-3">
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => {
                            const milestone = visitor.milestones.find(m => m.week === week);
                            return (
                              <div
                                key={week}
                                className={`p-1 sm:p-2 rounded text-center text-xs border cursor-pointer hover:shadow-sm transition-all ${
                                  milestone?.completed 
                                    ? 'bg-green-100 text-green-800 border-green-300' 
                                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-blue-50'
                                }`}
                                onClick={() => {
                                  setSelectedVisitor(visitor._id)
                                  setMilestoneUpdate({ week, notes: milestone?.protocolMemberNotes || '', completed: milestone?.completed || false })
                                }}
                              >
                                <div className="font-medium">W{week}</div>
                                {milestone?.completed && <CheckCircle className="h-3 w-3 mx-auto mt-1" />}
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-300 text-blue-800 hover:bg-blue-100"
                            onClick={() => {
                              setSelectedVisitor(visitor._id)
                              setMilestoneUpdate({ week: 1, notes: '', completed: false })
                            }}
                          >
                            Update Progress
                          </Button>
                          <Link href={`/protocol/visitors/${visitor._id}`}>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                            >
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 3. COLLECT VISITOR FEEDBACK AND EXPERIENCES */}
        {activeTab === 'feedback' && (
          <div className="animate-fade-in space-y-6">
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Visitor Feedback & Experiences Collection
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-3 md:p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Feedback */}
                  <div>
                    <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Recent Suggestions
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {data.visitors.flatMap(v => 
                        v.suggestions.map(s => ({
                          ...s,
                          visitorName: v.name,
                          visitorId: v._id
                        }))
                      ).slice(0, 10).length === 0 ? (
                        <div className="text-center py-6 bg-white/50 rounded-lg border border-blue-200">
                          <MessageSquare className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                          <p className="text-blue-600 text-sm">No suggestions yet</p>
                          <p className="text-blue-500 text-xs">Visitors can submit suggestions through their dashboard</p>
                        </div>
                      ) : (
                        data.visitors.flatMap(v => 
                          v.suggestions.map(s => ({
                            ...s,
                            visitorName: v.name,
                            visitorId: v._id
                          }))
                        ).slice(0, 10).map((suggestion, index) => (
                          <div key={index} className="bg-white p-3 rounded border border-blue-200 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between mb-1">
                              <span className="font-medium text-blue-800 truncate">{suggestion.visitorName}</span>
                              <span className="text-xs text-blue-600 flex-shrink-0 ml-2">{format(new Date(suggestion.date), "MMM dd")}</span>
                            </div>
                            <p className="text-sm text-blue-700 mb-1">{suggestion.message}</p>
                            <span className="text-xs text-blue-500 capitalize px-2 py-1 bg-blue-50 rounded">{suggestion.category}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Recent Experiences */}
                  <div>
                    <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Recent Experiences
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {data.visitors.flatMap(v => 
                        v.experiences.map(e => ({
                          ...e,
                          visitorName: v.name,
                          visitorId: v._id
                        }))
                      ).slice(0, 10).length === 0 ? (
                        <div className="text-center py-6 bg-white/50 rounded-lg border border-blue-200">
                          <Star className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                          <p className="text-blue-600 text-sm">No experiences shared yet</p>
                          <p className="text-blue-500 text-xs">Visitors can share experiences through their dashboard</p>
                        </div>
                      ) : (
                        data.visitors.flatMap(v => 
                          v.experiences.map(e => ({
                            ...e,
                            visitorName: v.name,
                            visitorId: v._id
                          }))
                        ).slice(0, 10).map((experience, index) => (
                          <div key={index} className="bg-white p-3 rounded border border-blue-200 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between mb-1">
                              <span className="font-medium text-blue-800 truncate">{experience.visitorName}</span>
                              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${i < experience.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-blue-700 mb-1">{experience.message}</p>
                            <span className="text-xs text-blue-500">{format(new Date(experience.date), "MMM dd")}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Feedback Summary */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white/80 p-3 rounded border border-blue-200 text-center">
                    <div className="text-lg font-bold text-blue-800">{data.statistics.recentFeedback}</div>
                    <div className="text-xs text-blue-600">Recent Feedback</div>
                  </div>
                  <div className="bg-white/80 p-3 rounded border border-blue-200 text-center">
                    <div className="text-lg font-bold text-blue-800">
                      {data.visitors.flatMap(v => v.experiences).length}
                    </div>
                    <div className="text-xs text-blue-600">Total Experiences</div>
                  </div>
                  <div className="bg-white/80 p-3 rounded border border-blue-200 text-center">
                    <div className="text-lg font-bold text-blue-800">
                      {data.visitors.flatMap(v => v.suggestions).length}
                    </div>
                    <div className="text-xs text-blue-600">Total Suggestions</div>
                  </div>
                  <div className="bg-white/80 p-3 rounded border border-blue-200 text-center">
                    <div className="text-lg font-bold text-blue-800">
                      {data.visitors.flatMap(v => v.experiences).length > 0 ? 
                        (data.visitors.flatMap(v => v.experiences).reduce((sum, e) => sum + e.rating, 0) / 
                         data.visitors.flatMap(v => v.experiences).length).toFixed(1) : '0'}
                    </div>
                    <div className="text-xs text-blue-600">Avg Rating</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 4. REPORT TO BISHOP ON VISITOR ENGAGEMENT */}
        {activeTab === 'report' && (
          <div className="animate-fade-in space-y-6">
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader>
                <CardTitle className="text-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Bishop Engagement Reports
                  </span>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <select
                      value={reportPeriod}
                      onChange={(e) => setReportPeriod(e.target.value)}
                      className="px-3 py-2 border border-blue-300 rounded text-blue-800 text-sm bg-white/90"
                    >
                      <option value="weekly">Weekly Report</option>
                      <option value="monthly">Monthly Report</option>
                      <option value="quarterly">Quarterly Report</option>
                    </select>
                    <Button
                      onClick={generateBishopReport}
                      disabled={generatingReport}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      {generatingReport ? 'Generating...' : 'Generate Report'}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-3 md:p-4">
                {reportData ? (
                  <div className="space-y-4">
                    <div className="bg-white/80 p-4 rounded border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {reportData.period.charAt(0).toUpperCase() + reportData.period.slice(1)} Engagement Summary
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-800">{reportData.metrics.totalVisitors}</div>
                          <div className="text-xs text-blue-600">Total Visitors</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-800">{reportData.metrics.newJoining}</div>
                          <div className="text-xs text-green-600">New Joining</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-800">{reportData.metrics.conversions}</div>
                          <div className="text-xs text-purple-600">Conversions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-800">{reportData.metrics.averageRating}</div>
                          <div className="text-xs text-orange-600">Avg Rating</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded border border-green-200">
                      <h5 className="font-medium text-green-800 mb-2">Report Sent to Bishop</h5>
                      <p className="text-sm text-green-700">
                        {reportData.period.charAt(0).toUpperCase() + reportData.period.slice(1)} report for {reportData.dateRange} has been sent to the bishop.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                    <p className="text-blue-600 mb-2">Generate a report to send to the bishop</p>
                    <p className="text-blue-500 text-sm">Select the report period and click "Generate Report"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 5. ASSIST VISITORS WITH CHURCH INTEGRATION */}
        {activeTab === 'assist' && (
          <div className="animate-fade-in space-y-6">
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Church Integration Assistance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-3 md:p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Integration Checklist */}
                  <div>
                    <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Integration Checklist
                    </h4>
                    
                    {/* Visitor Selection */}
                    <div className="mb-4">
                      <select
                        value={selectedVisitorForIntegration?._id || ''}
                        onChange={(e) => {
                          const visitor = data.visitors.find(v => v._id === e.target.value)
                          setSelectedVisitorForIntegration(visitor || null)
                        }}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md text-blue-800 bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a visitor to manage integration...</option>
                        {data.visitors.filter(v => v.status === 'joining').map(visitor => (
                          <option key={visitor._id} value={visitor._id}>
                            {visitor.name} - {visitor.integrationProgress || 0}% complete
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Integration Checklist Items */}
                    {selectedVisitorForIntegration ? (
                      <div className="space-y-2">
                        {([
                          { key: 'welcomePackage' as const, task: 'Welcome package provided', icon: '📦' },
                          { key: 'homeVisit' as const, task: 'Visitor\'s home visit', icon: '🏠' },
                          { key: 'smallGroupIntro' as const, task: 'Small group introduction', icon: '👥' },
                          { key: 'ministryOpportunities' as const, task: 'Ministry opportunities shared', icon: '🤝' },
                          { key: 'mentorAssigned' as const, task: 'Mentor assigned', icon: '👨‍🏫' },
                          { key: 'regularCheckIns' as const, task: 'Regular check-ins scheduled', icon: '📅' }
                        ] as const).map((item) => {
                          const isCompleted = selectedVisitorForIntegration.integrationChecklist?.[item.key] || false
                          return (
                            <div 
                              key={item.key} 
                              className={`flex items-center gap-3 p-3 rounded border transition-all cursor-pointer hover:shadow-sm ${
                                isCompleted 
                                  ? 'bg-green-50 border-green-300' 
                                  : 'bg-white/80 border-blue-200 hover:bg-blue-50'
                              }`}
                              onClick={() => updateIntegrationChecklist(
                                selectedVisitorForIntegration._id, 
                                item.key, 
                                !isCompleted
                              )}
                            >
                              {isCompleted ? (
                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                              ) : (
                                <div className="h-4 w-4 border-2 border-blue-400 rounded-full flex-shrink-0" />
                              )}
                              <span className={`text-sm flex-1 ${
                                isCompleted ? 'text-green-700 line-through' : 'text-blue-700'
                              }`}>
                                {item.icon} {item.task}
                              </span>
                              {updatingIntegration && (
                                <div className="animate-spin h-3 w-3 border border-blue-400 border-t-transparent rounded-full" />
                              )}
                            </div>
                          )
                        })}
                        
                        {/* Progress Bar */}
                        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-800">Integration Progress</span>
                            <span className="text-sm text-blue-600">
                              {selectedVisitorForIntegration.integrationProgress || 0}%
                            </span>
                          </div>
                          <div className="w-full bg-blue-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${selectedVisitorForIntegration.integrationProgress || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-blue-600">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Select a joining visitor to manage their integration checklist</p>
                      </div>
                    )}
                  </div>

                  {/* Visitors Needing Assistance */}
                  <div>
                    <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Visitors Needing Assistance
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {data.visitors.filter(v => v.monitoringStatus === 'active').length === 0 ? (
                        <div className="text-center py-6 bg-white/50 rounded-lg border border-blue-200">
                          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                          <p className="text-green-700 text-sm font-medium">All visitors are on track!</p>
                          <p className="text-green-600 text-xs">No immediate assistance needed</p>
                        </div>
                      ) : (
                        data.visitors.filter(v => v.monitoringStatus === 'active').map((visitor) => (
                          <div key={visitor._id} className="bg-white p-3 rounded border border-blue-200 hover:shadow-sm transition-shadow">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                              <span className="font-medium text-blue-800 truncate">{visitor.name}</span>
                              <span className={`px-2 py-1 rounded-full text-xs flex-shrink-0 ${
                                visitor.daysRemaining < 30 ? 'bg-red-100 text-red-800' :
                                visitor.daysRemaining < 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {visitor.daysRemaining} days left
                              </span>
                            </div>
                            <div className="text-sm text-blue-600 mb-2">
                              Progress: {visitor.monitoringProgress}% • Attendance: {visitor.attendanceRate}%
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <Button size="sm" variant="outline" className="text-xs border-blue-300 text-blue-800 hover:bg-blue-100">
                                <Calendar className="h-3 w-3 mr-1" />
                                Schedule Meeting
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs border-blue-300 text-blue-800 hover:bg-blue-100">
                                <Heart className="h-3 w-3 mr-1" />
                                Assign Mentor
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Integration Statistics */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white/80 p-3 rounded border border-blue-200 text-center">
                    <div className="text-lg font-bold text-blue-800">{data.visitors.filter(v => v.status === 'joining').length}</div>
                    <div className="text-xs text-blue-600">Integration Candidates</div>
                  </div>
                  <div className="bg-white/80 p-3 rounded border border-blue-200 text-center">
                    <div className="text-lg font-bold text-green-800">
                      {data.visitors.filter(v => v.monitoringProgress >= 75).length}
                    </div>
                    <div className="text-xs text-green-600">Nearly Complete</div>
                  </div>
                  <div className="bg-white/80 p-3 rounded border border-blue-200 text-center">
                    <div className="text-lg font-bold text-orange-800">
                      {data.visitors.filter(v => v.daysRemaining < 30 && v.monitoringStatus === 'active').length}
                    </div>
                    <div className="text-xs text-orange-600">Urgent Follow-up</div>
                  </div>
                  <div className="bg-white/80 p-3 rounded border border-blue-200 text-center">
                    <div className="text-lg font-bold text-purple-800">
                      {data.visitors.filter(v => v.attendanceRate >= 80).length}
                    </div>
                    <div className="text-xs text-purple-600">High Engagement</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 6. MARK VISITOR ATTENDANCE FOR SUNDAY SERVICES */}
        {activeTab === 'attendance' && (
          <div className="animate-fade-in space-y-6">
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Sunday Service Visitor Attendance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Date Selection */}
                <div className="bg-blue-50 p-3 sm:p-4 rounded border border-blue-200">
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="text-center sm:text-left">
                      <h4 className="font-medium text-blue-800 mb-1">Select Service Date</h4>
                      <p className="text-sm text-blue-600">Mark attendance for Sunday service</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:justify-center">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full sm:w-auto px-2 sm:px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 text-sm sm:text-base"
                      />
                      <Button
                        onClick={markVisitorAttendance}
                        disabled={markingAttendance || Object.keys(attendanceData).length === 0}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm sm:text-base"
                      >
                        {markingAttendance ? (
                          <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        <span className="truncate">Mark Attendance</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Visitor Attendance List */}
                <div>
                  <h4 className="font-medium text-blue-800 mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Visitor Attendance ({data.visitors.length} visitors)
                  </h4>
                  
                  {data.visitors.length === 0 ? (
                    <div className="text-center py-8 bg-blue-50 rounded-lg border border-blue-200">
                      <Users className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                      <p className="text-blue-600">No visitors assigned yet</p>
                      <p className="text-blue-500 text-sm">Register visitors first to mark their attendance</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.visitors.map((visitor) => (
                        <div key={visitor._id} className="bg-white/80 rounded-lg border border-blue-200 p-3 sm:p-4">
                          <div className="flex flex-col gap-3">
                            
                            {/* Visitor Info */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-blue-800 text-sm sm:text-base truncate">{visitor.name}</h5>
                                    <p className="text-xs sm:text-sm text-blue-600 truncate">{visitor.email}</p>
                                    {visitor.phone && (
                                      <p className="text-xs text-blue-500 truncate">{visitor.phone}</p>
                                    )}
                                  </div>
                                  <span className={`px-2 py-1 rounded-full text-xs flex-shrink-0 text-center ${
                                    visitor.status === 'joining' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {visitor.status}
                                  </span>
                                </div>
                                
                                {/* Recent Attendance */}
                                <div className="text-xs text-blue-600 flex flex-col sm:flex-row gap-1 sm:gap-2">
                                  <span>Attendance: {visitor.attendanceRate}%</span>
                                  <span className="hidden sm:inline">•</span>
                                  <span>Last Visit: {visitor.visitHistory.length > 0 
                                    ? format(new Date(visitor.visitHistory[visitor.visitHistory.length - 1].date), "MMM dd")
                                    : 'Never'
                                  }</span>
                                </div>
                              </div>
                            </div>

                            {/* Attendance Buttons */}
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button
                                onClick={() => setAttendanceData(prev => ({ ...prev, [visitor._id]: 'present' }))}
                                variant={attendanceData[visitor._id] === 'present' ? 'default' : 'outline'}
                                size="sm"
                                className={`flex-1 sm:flex-initial text-xs sm:text-sm ${attendanceData[visitor._id] === 'present' 
                                  ? 'bg-green-600 text-white hover:bg-green-700' 
                                  : 'border-green-300 text-green-700 hover:bg-green-50'
                                }`}
                              >
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                Present
                              </Button>
                              <Button
                                onClick={() => setAttendanceData(prev => ({ ...prev, [visitor._id]: 'absent' }))}
                                variant={attendanceData[visitor._id] === 'absent' ? 'default' : 'outline'}
                                size="sm"
                                className={`flex-1 sm:flex-initial text-xs sm:text-sm ${attendanceData[visitor._id] === 'absent' 
                                  ? 'bg-red-600 text-white hover:bg-red-700' 
                                  : 'border-red-300 text-red-700 hover:bg-red-50'
                                }`}
                              >
                                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                Absent
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Attendance Summary */}
                {Object.keys(attendanceData).length > 0 && (
                  <div className="bg-blue-50 p-3 sm:p-4 rounded border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-3 text-sm sm:text-base text-center sm:text-left">Attendance Summary</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                      <div className="text-center bg-white/50 rounded p-2 sm:p-3">
                        <div className="text-sm sm:text-lg font-bold text-blue-800">{Object.keys(attendanceData).length}</div>
                        <div className="text-xs text-blue-600">Total Marked</div>
                      </div>
                      <div className="text-center bg-white/50 rounded p-2 sm:p-3">
                        <div className="text-sm sm:text-lg font-bold text-green-800">
                          {Object.values(attendanceData).filter(status => status === 'present').length}
                        </div>
                        <div className="text-xs text-green-600">Present</div>
                      </div>
                      <div className="text-center bg-white/50 rounded p-2 sm:p-3">
                        <div className="text-sm sm:text-lg font-bold text-red-800">
                          {Object.values(attendanceData).filter(status => status === 'absent').length}
                        </div>
                        <div className="text-xs text-red-600">Absent</div>
                      </div>
                      <div className="text-center bg-white/50 rounded p-2 sm:p-3">
                        <div className="text-sm sm:text-lg font-bold text-purple-800">
                          {data.visitors.length - Object.keys(attendanceData).length}
                        </div>
                        <div className="text-xs text-purple-600">Pending</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Milestone Update Modal */}
      {selectedVisitor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-800">Update Milestone</h3>
                <Button
                  onClick={() => setSelectedVisitor(null)}
                  variant="ghost"
                  size="sm"
                  className="text-blue-800 hover:bg-blue-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-1">Week</label>
                  <select
                    value={milestoneUpdate.week}
                    onChange={(e) => setMilestoneUpdate(prev => ({ ...prev, week: Number(e.target.value) }))}
                        className="w-full px-2 sm:px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 text-sm sm:text-base"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(week => (
                      <option key={week} value={week}>Week {week}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-2">
                    <input
                      type="checkbox"
                      checked={milestoneUpdate.completed}
                      onChange={(e) => setMilestoneUpdate(prev => ({ ...prev, completed: e.target.checked }))}
                      className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                    />
                    Mark as Completed
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-1">Notes</label>
                  <textarea
                    value={milestoneUpdate.notes}
                    onChange={(e) => setMilestoneUpdate(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-2 sm:px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 text-sm sm:text-base"
                    rows={3}
                    placeholder="Add notes about this milestone..."
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleUpdateMilestone(selectedVisitor, milestoneUpdate.week, milestoneUpdate.completed, milestoneUpdate.notes)}
                    disabled={updatingMilestone}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {updatingMilestone ? 'Updating...' : 'Update Milestone'}
                  </Button>
                  <Button
                    onClick={() => setSelectedVisitor(null)}
                    variant="outline"
                    className="border-blue-300 text-blue-800 hover:bg-blue-100"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}