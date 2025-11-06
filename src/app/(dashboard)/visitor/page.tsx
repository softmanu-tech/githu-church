"use client"

import React, { useState, useEffect } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';
import { useAlerts } from "@/components/ui/alert-system"
import { ProfessionalHeader } from "@/components/ProfessionalHeader"
import { format } from "date-fns"
import Link from "next/link"
import {
  User,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  LogOut,
  MessageSquare,
  Star,
  Target,
  Award,
  MapPin,
  Phone,
  Mail,
  Heart,
  Users,
  BookOpen,
  Settings
} from "lucide-react"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts'

interface VisitorDashboardData {
  visitor: {
    _id: string
    name: string
    email: string
    phone?: string
    address?: string
    type: string
    status: string
    monitoringStartDate: string
    monitoringEndDate: string
    monitoringStatus: string
    attendanceRate: number
    monitoringProgress: number
    daysRemaining: number
    protocolTeam: {
      name: string
    }
    assignedProtocolMember: {
      name: string
      email: string
    }
  }
  visitHistory: {
    date: string
    eventType: string
    attendanceStatus: string
    notes?: string
  }[]
  milestones: {
    week: number
    completed: boolean
    notes?: string
    completedDate?: string
  }[]
  upcomingEvents: {
    _id: string
    title: string
    date: string
    location?: string
    description?: string
  }[]
  suggestions: {
    date: string
    message: string
    category: string
  }[]
  experiences: {
    date: string
    rating: number
    message: string
    eventType?: string
  }[]
  statistics: {
    totalVisits: number
    presentCount: number
    attendanceRate: number
    completedMilestones: number
    averageRating: number
    daysInProgram: number
  }
}

export default function VisitorDashboard() {
  const alerts = useAlerts()
  
  const [data, setData] = useState<VisitorDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSuggestionModal, setShowSuggestionModal] = useState(false)
  const [showExperienceModal, setShowExperienceModal] = useState(false)
  const [newSuggestion, setNewSuggestion] = useState({ message: '', category: 'service' })
  const [newExperience, setNewExperience] = useState({ rating: 5, message: '', eventType: '' })

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/visitor/dashboard', {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch visitor dashboard data")
      }

      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || "Failed to fetch dashboard data")
      }
    } catch (err) {
      console.error("Error fetching visitor data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch visitor data")
    } finally {
      setLoading(false)
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

  const submitSuggestion = async () => {
    try {
      const response = await fetch('/api/visitor/suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newSuggestion)
      })

      if (response.ok) {
        alerts.success("Suggestion Submitted", "Thank you for your feedback!")
        setShowSuggestionModal(false)
        setNewSuggestion({ message: '', category: 'service' })
        fetchData()
      }
    } catch (error) {
      alerts.error("Failed to Submit", "Please try again later.")
    }
  }

  const submitExperience = async () => {
    try {
      const response = await fetch('/api/visitor/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newExperience)
      })

      if (response.ok) {
        alerts.success("Experience Shared", "Thank you for sharing your experience!")
        setShowExperienceModal(false)
        setNewExperience({ rating: 5, message: '', eventType: '' })
        fetchData()
      }
    } catch (error) {
      alerts.error("Failed to Submit", "Please try again later.")
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-300">
        <ProfessionalHeader
          title="Visitor Dashboard"
          subtitle="Track your journey and integration progress"
        />
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <UltraFastCardSkeleton key={i} />
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <UltraFastChartSkeleton />
            <UltraFastChartSkeleton />
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <UltraFastTableSkeleton />
            <UltraFastTableSkeleton />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-purple-300 flex items-center justify-center px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md text-center">
          <strong>Error:</strong> {error}
          <button 
            onClick={fetchData}
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
      <div className="min-h-screen bg-purple-300 flex items-center justify-center px-4">
        <div className="bg-purple-200/90 backdrop-blur-md rounded-lg p-6 border border-purple-300 text-center">
          <p className="text-purple-800">No visitor data available.</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }

  const milestoneData = data.milestones.map(milestone => ({
    week: `Week ${milestone.week}`,
    completed: milestone.completed ? 100 : 0,
    status: milestone.completed ? 'Completed' : 'Pending'
  }))

  const visitTrendData = data.visitHistory.slice(-8).map((visit, index) => ({
    visit: `Visit ${index + 1}`,
    attended: visit.attendanceStatus === 'present' ? 1 : 0,
    date: format(new Date(visit.date), 'MMM dd')
  }))

  return (
    <div className="min-h-screen bg-blue-300">
      <ProfessionalHeader
        title={`Welcome, ${data.visitor.name}! 🌟`}
        subtitle={`Joining Visitor • ${data.visitor.daysRemaining} days remaining in monitoring`}
        user={{
          name: data.visitor.name,
          email: data.visitor.email,
          profilePicture: (data.visitor as any).profilePicture
        }}
        actions={[
          {
            label: "Profile",
            href: "/visitor/profile",
            variant: "outline",
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="animate-fade-in space-y-4 sm:space-y-6 md:space-y-8">
        
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-3 sm:p-4 md:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600" />
                </div>
                <div className="ml-2 sm:ml-3 md:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 uppercase tracking-wide">Progress</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-800">{data.visitor.monitoringProgress}%</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-3 sm:p-4 md:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600" />
                </div>
                <div className="ml-2 sm:ml-3 md:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 uppercase tracking-wide">Attendance</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-800">{data.statistics.attendanceRate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-3 sm:p-4 md:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Award className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600" />
                </div>
                <div className="ml-2 sm:ml-3 md:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 uppercase tracking-wide">Milestones</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-800">{data.statistics.completedMilestones}/12</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-3 sm:p-4 md:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Star className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600" />
                </div>
                <div className="ml-2 sm:ml-3 md:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 uppercase tracking-wide">Rating</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-800">{data.statistics.averageRating}/5</p>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Milestone Progress Chart */}
            <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-4 sm:p-6">
              <h3 className="text-sm sm:text-base md:text-lg font-medium text-blue-800 mb-2 sm:mb-3 md:mb-4 flex items-center gap-2">
                <Target className="h-5 w-5" />
                3-Month Journey Progress
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={milestoneData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#1E40AF' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#1E40AF' }} domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value, name) => [value === 100 ? 'Completed' : 'Pending', 'Status']}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #3B82F6',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="completed" 
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-blue-700 mb-2">
                  <span>Overall Progress</span>
                  <span>{data.visitor.monitoringProgress}%</span>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${data.visitor.monitoringProgress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {data.visitor.daysRemaining} days remaining until membership eligibility
                </div>
              </div>
            </div>

            {/* Attendance Analytics */}
            <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-4 sm:p-6">
              <h3 className="text-sm sm:text-base md:text-lg font-medium text-blue-800 mb-2 sm:mb-3 md:mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Attendance Analytics
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <div className="relative">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Present', value: data.statistics.presentCount, color: '#3B82F6' },
                          { name: 'Absent', value: data.statistics.totalVisits - data.statistics.presentCount, color: '#E5E7EB' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#3B82F6" />
                        <Cell fill="#E5E7EB" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-800">
                          {data.statistics.attendanceRate}%
                        </div>
                        <div className="text-xs text-blue-600">Attendance</div>
                      </div>
                    </div>
                  </div>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Button
              onClick={() => setShowSuggestionModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 sm:p-4 h-auto flex-col gap-2 text-sm sm:text-base"
            >
              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
              <span>Share Suggestion</span>
            </Button>
            
            <Button
              onClick={() => setShowExperienceModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 sm:p-4 h-auto flex-col gap-2 text-sm sm:text-base"
            >
              <Star className="h-5 w-5 sm:h-6 sm:w-6" />
              <span>Share Experience</span>
            </Button>
            
            <Link href="/visitor/events">
              <Button
                variant="outline"
                className="border-blue-300 text-blue-800 hover:bg-blue-50 p-3 sm:p-4 h-auto flex-col gap-2 w-full text-sm sm:text-base"
              >
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>View Events</span>
              </Button>
            </Link>
            
            <Link href="/visitor/milestones">
              <Button
                variant="outline"
                className="border-blue-300 text-blue-800 hover:bg-blue-50 p-3 sm:p-4 h-auto flex-col gap-2 w-full text-sm sm:text-base"
              >
                <Target className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>My Milestones</span>
              </Button>
            </Link>
          </div>

          {/* Recent Activity & Upcoming Events */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Recent Visits */}
            <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-4 sm:p-6">
              <h3 className="text-sm sm:text-base md:text-lg font-medium text-blue-800 mb-2 sm:mb-3 md:mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Visits
              </h3>
              {data.visitHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                  <p className="text-blue-600">No visits recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {data.visitHistory.slice(-5).map((visit, index) => (
                    <div
                      key={index}
                      className="p-3 bg-white/80 rounded-lg border border-blue-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            {visit.attendanceStatus === 'present' ? (
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-blue-400" />
                            )}
                            <span className="font-medium text-blue-800">{visit.eventType}</span>
                          </div>
                          <p className="text-sm text-blue-600">
                            {format(new Date(visit.date), "MMM dd, yyyy")}
                          </p>
                          {visit.notes && (
                            <p className="text-xs text-blue-500 mt-1">{visit.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-4 sm:p-6">
              <h3 className="text-sm sm:text-base md:text-lg font-medium text-blue-800 mb-2 sm:mb-3 md:mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </h3>
              {data.upcomingEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                  <p className="text-blue-600">No upcoming events</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.upcomingEvents.map((event) => (
                    <div
                      key={event._id}
                      className="p-3 bg-white/80 rounded-lg border border-blue-200"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-blue-800 text-sm truncate">
                            {event.title}
                          </h4>
                          <div className="text-xs text-blue-600 space-y-1">
                            <div>{format(new Date(event.date), "MMM dd, yyyy 'at' h:mm a")}</div>
                            {event.location && <div>📍 {event.location}</div>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                          >
                            Will Attend
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-300 text-blue-800 hover:bg-blue-50 text-xs"
                          >
                            Can't Attend
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Feedback Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Recent Suggestions */}
            <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-4 sm:p-6">
              <h3 className="text-sm sm:text-base md:text-lg font-medium text-blue-800 mb-2 sm:mb-3 md:mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Your Suggestions
              </h3>
              {data.suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                  <p className="text-blue-600">No suggestions yet</p>
                  <Button
                    onClick={() => setShowSuggestionModal(true)}
                    size="sm"
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Share Your First Suggestion
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {data.suggestions.slice(-3).map((suggestion, index) => (
                    <div key={index} className="p-3 bg-white/80 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {suggestion.category}
                        </span>
                        <span className="text-xs text-blue-500">
                          {format(new Date(suggestion.date), "MMM dd")}
                        </span>
                      </div>
                      <p className="text-sm text-blue-700">{suggestion.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Experiences */}
            <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-4 sm:p-6">
              <h3 className="text-sm sm:text-base md:text-lg font-medium text-blue-800 mb-2 sm:mb-3 md:mb-4 flex items-center gap-2">
                <Star className="h-5 w-5" />
                Your Experiences
              </h3>
              {data.experiences.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                  <p className="text-blue-600">No experiences shared yet</p>
                  <Button
                    onClick={() => setShowExperienceModal(true)}
                    size="sm"
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Share Your Experience
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {data.experiences.slice(-3).map((experience, index) => (
                    <div key={index} className="p-3 bg-white/80 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < experience.rating ? 'fill-yellow-400 text-yellow-400' : 'text-blue-400'}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-blue-500">
                          {format(new Date(experience.date), "MMM dd")}
                        </span>
                      </div>
                      <p className="text-sm text-blue-700">{experience.message}</p>
                      {experience.eventType && (
                        <p className="text-xs text-blue-500 mt-1">Event: {experience.eventType}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Suggestion Modal */}
      {showSuggestionModal && (
        <div className="fixed inset-0 bg-blue-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-blue-200/95 backdrop-blur-md rounded-lg shadow-xl max-w-md w-full border border-blue-300">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">
                Share Your Suggestion
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Category</label>
                  <select
                    value={newSuggestion.category}
                    onChange={(e) => setNewSuggestion({...newSuggestion, category: e.target.value})}
                    className="w-full p-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/90 text-blue-800"
                  >
                    <option value="service">Service</option>
                    <option value="facility">Facility</option>
                    <option value="community">Community</option>
                    <option value="spiritual">Spiritual</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Your Suggestion</label>
                  <textarea
                    value={newSuggestion.message}
                    onChange={(e) => setNewSuggestion({...newSuggestion, message: e.target.value})}
                    placeholder="Share your suggestion to help us improve..."
                    className="w-full p-3 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] bg-white/90 text-blue-800 placeholder-blue-600"
                    maxLength={500}
                  />
                  <div className="text-xs text-blue-600 mt-1">
                    {newSuggestion.message.length}/500 characters
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setShowSuggestionModal(false)}
                  variant="outline"
                  className="flex-1 border-blue-300 text-blue-800 hover:bg-blue-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitSuggestion}
                  disabled={!newSuggestion.message.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Submit
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Experience Modal */}
      {showExperienceModal && (
        <div className="fixed inset-0 bg-blue-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-blue-200/95 backdrop-blur-md rounded-lg shadow-xl max-w-md w-full border border-blue-300">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">
                Share Your Experience
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Rating</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Star
                        key={rating}
                        className={`h-8 w-8 cursor-pointer ${
                          rating <= newExperience.rating 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-blue-400 hover:text-yellow-300'
                        }`}
                        onClick={() => setNewExperience({...newExperience, rating})}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Event Type (Optional)</label>
                  <input
                    type="text"
                    value={newExperience.eventType}
                    onChange={(e) => setNewExperience({...newExperience, eventType: e.target.value})}
                    placeholder="e.g., Sunday Service, Bible Study..."
                    className="w-full p-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/90 text-blue-800 placeholder-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Your Experience</label>
                  <textarea
                    value={newExperience.message}
                    onChange={(e) => setNewExperience({...newExperience, message: e.target.value})}
                    placeholder="Tell us about your experience..."
                    className="w-full p-3 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] bg-white/90 text-blue-800 placeholder-blue-600"
                    maxLength={500}
                  />
                  <div className="text-xs text-blue-600 mt-1">
                    {newExperience.message.length}/500 characters
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setShowExperienceModal(false)}
                  variant="outline"
                  className="flex-1 border-blue-300 text-blue-800 hover:bg-blue-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitExperience}
                  disabled={!newExperience.message.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Submit
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
