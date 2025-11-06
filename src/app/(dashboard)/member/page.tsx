"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';
import { useAlerts } from "@/components/ui/alert-system"
import { ProfileIcon } from "@/components/ProfileIcon"
import { ProfessionalHeader } from "@/components/ProfessionalHeader"
import { 
  User, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  Building, 
  Phone, 
  Mail,
  Users,
  Clock,
  LogOut,
  Settings,
  BarChart3,
  Target,
  Award,
  Heart,
  MessageSquare
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
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
  Line
} from 'recharts'

interface Member {
  _id: string
  name: string
  email: string
  phone?: string
  residence?: string
  department?: string
  group?: {
    _id: string
    name: string
  }
  groups?: {
    _id: string
    name: string
  }[]
}

interface Event {
  _id: string
  title: string
  date: string
  location?: string
  group: {
    _id: string
    name: string
  }
  createdBy: {
    _id: string
    name: string
  }
}

interface AttendanceRecord {
  _id: string
  date: string
  event?: {
    title: string
    date: string
    location?: string
  }
  status: 'present' | 'absent'
}

interface AttendanceStats {
  totalRecords: number
  presentCount: number
  absentCount: number
  attendanceRate: number
}

interface MemberDashboardData {
  member: Member
  upcomingEvents: Event[]
  attendanceStats: AttendanceStats
  recentAttendance: AttendanceRecord[]
}

export default function MemberDashboard() {
  const alerts = useAlerts()
  const [data, setData] = useState<MemberDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showApologyModal, setShowApologyModal] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [apologyReason, setApologyReason] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch("/api/member", {
        credentials: "include"
      })
      
      if (!response.ok) {
        throw new Error("Failed to fetch member data")
      }
      
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || "Failed to fetch member data")
      }
    } catch (err) {
      console.error("Error fetching member data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include"
      })
      window.location.href = "/"
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const confirmAttendance = async (eventId: string, willAttend: boolean, reason?: string) => {
    try {
      const response = await fetch("/api/member/event-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          eventId,
          willAttend,
          reason: reason || undefined
        })
      })

      if (response.ok) {
        alerts.success(
          "Response Recorded",
          `Your ${willAttend ? 'attendance confirmation' : 'absence notification'} has been recorded.`,
          [
            {
              label: "View Events",
              action: () => fetchData(),
              variant: "primary"
            }
          ]
        )
        await fetchData()
      } else {
        throw new Error("Failed to record response")
      }
    } catch (error) {
      alerts.error(
        "Failed to Record Response",
        "Please try again or contact your leader.",
        [
          {
            label: "Retry",
            action: () => confirmAttendance(eventId, willAttend, reason),
            variant: "primary"
          }
        ]
      )
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-300">
        <ProfessionalHeader
          title="Member Dashboard"
          subtitle="View your attendance and participate in events"
        />
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <UltraFastCardSkeleton key={i} />
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <UltraFastChartSkeleton />
            <UltraFastChartSkeleton />
          </div>

          {/* Content Skeleton */}
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
      <div className="min-h-screen bg-blue-300 flex items-center justify-center px-4">
        <div className="bg-blue-200/90 backdrop-blur-md rounded-lg p-6 border border-blue-300 text-center">
          <p className="text-blue-800">No data available.</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-300">
      <ProfessionalHeader
        title={`Welcome, ${data.member.name}`}
        subtitle={`${data.member.groups && data.member.groups.length > 0 ? 
          `${data.member.groups.length} Group${data.member.groups.length > 1 ? 's' : ''} Member` : 
          'Group Member'}`}
        user={{
          name: data.member.name,
          email: data.member.email,
          profilePicture: (data.member as any).profilePicture
        }}
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="space-y-4 sm:space-y-6">
          
          {/* Member Info Card */}
          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-blue-800 flex items-center gap-2 text-base sm:text-lg">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs sm:text-sm text-blue-600">Email</p>
                    <p className="text-sm sm:text-base font-medium text-blue-800">{data.member.email}</p>
                  </div>
                </div>
                
                {data.member.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs sm:text-sm text-blue-600">Phone</p>
                      <p className="text-sm sm:text-base font-medium text-blue-800">{data.member.phone}</p>
                    </div>
                  </div>
                )}
                
                {data.member.residence && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs sm:text-sm text-blue-600">Residence</p>
                      <p className="text-sm sm:text-base font-medium text-blue-800">{data.member.residence}</p>
                    </div>
                  </div>
                )}
                
                {data.member.department && (
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs sm:text-sm text-blue-600">Department</p>
                      <p className="text-sm sm:text-base font-medium text-blue-800">{data.member.department}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <Users className="h-4 w-4 text-blue-600 mt-1" />
                  <div>
                    <p className="text-xs sm:text-sm text-blue-600">Groups</p>
                    {data.member.groups && data.member.groups.length > 0 ? (
                      <div>
                        <p className="text-sm sm:text-base font-medium text-blue-800 mb-1">
                          {data.member.groups.length} Group{data.member.groups.length > 1 ? 's' : ''}
                        </p>
                        <div className="space-y-1">
                          {data.member.groups.map((group, index) => (
                            <p key={group._id} className="text-xs sm:text-sm text-blue-700">
                              • {group.name}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : data.member.group ? (
                      <p className="text-sm sm:text-base font-medium text-blue-800">{data.member.group.name}</p>
                    ) : (
                      <p className="text-sm sm:text-base font-medium text-blue-800">No groups assigned</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-blue-700 uppercase tracking-wide">Attendance Rate</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-800">{data.attendanceStats.attendanceRate}%</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-blue-700 uppercase tracking-wide">Present</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-800">{data.attendanceStats.presentCount}</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-400 rounded-full flex items-center justify-center">
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-blue-700 uppercase tracking-wide">Absent</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-800">{data.attendanceStats.absentCount}</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-700 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-blue-700 uppercase tracking-wide">Total Events</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-800">{data.attendanceStats.totalRecords}</p>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Attendance Progress Circle */}
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-blue-800 flex items-center gap-2 text-base sm:text-lg">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                  Attendance Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Present', value: data.attendanceStats.presentCount, color: '#3B82F6' },
                            { name: 'Absent', value: data.attendanceStats.absentCount, color: '#E5E7EB' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#3B82F6" />
                          <Cell fill="#E5E7EB" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-blue-800">
                          {data.attendanceStats.attendanceRate}%
                        </div>
                        <div className="text-xs text-blue-600">Attendance</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-blue-700">Present</span>
                    </div>
                    <span className="font-medium text-blue-800">{data.attendanceStats.presentCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      <span className="text-blue-700">Absent</span>
                    </div>
                    <span className="font-medium text-blue-800">{data.attendanceStats.absentCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-blue-800 flex items-center gap-2 text-base sm:text-lg">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  Monthly Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="h-48 sm:h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { month: 'Jan', rate: Math.max(0, data.attendanceStats.attendanceRate - 10) },
                        { month: 'Feb', rate: Math.max(0, data.attendanceStats.attendanceRate - 5) },
                        { month: 'Mar', rate: data.attendanceStats.attendanceRate },
                        { month: 'Apr', rate: Math.min(100, data.attendanceStats.attendanceRate + 5) }
                      ]}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#1E40AF' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#1E40AF' }} domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Attendance']} 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #3B82F6',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="rate" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#1E40AF' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Performance Goal */}
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-blue-800 flex items-center gap-2 text-base sm:text-lg">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                  Performance Goal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-800 mb-2">
                      {data.attendanceStats.attendanceRate >= 80 ? '🎉' : '🎯'}
                    </div>
                    <div className="text-lg font-semibold text-blue-800">
                      {data.attendanceStats.attendanceRate >= 80 ? 'Excellent!' : 'Keep Going!'}
                    </div>
                    <div className="text-sm text-blue-600">
                      {data.attendanceStats.attendanceRate >= 80 
                        ? 'You\'re exceeding expectations!' 
                        : `${80 - data.attendanceStats.attendanceRate}% more to reach 80% goal`
                      }
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-blue-700">
                      <span>Progress to 80%</span>
                      <span>{Math.min(100, Math.round((data.attendanceStats.attendanceRate / 80) * 100))}%</span>
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (data.attendanceStats.attendanceRate / 80) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Achievement Badges */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className={`p-2 rounded-lg text-center text-xs ${
                      data.attendanceStats.attendanceRate >= 50 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      <div className="font-semibold">Regular</div>
                      <div>50%+</div>
                    </div>
                    <div className={`p-2 rounded-lg text-center text-xs ${
                      data.attendanceStats.attendanceRate >= 80 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      <div className="font-semibold">Excellent</div>
                      <div>80%+</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Communications Card */}
          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-blue-800 flex items-center gap-2 text-base sm:text-lg">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                Communications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="text-center">
                <MessageSquare className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-blue-400 mb-4" />
                <p className="text-blue-600 text-sm mb-4">
                  View messages from your leaders and the Bishop
                </p>
                <Link href="/inbox">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Messages
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Prayer Requests Card */}
          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-blue-800 flex items-center gap-2 text-base sm:text-lg">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                Prayer Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="text-center">
                <Heart className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-blue-400 mb-4" />
                <p className="text-blue-600 text-sm mb-4">
                  Submit your prayer requests to the Bishop and track their status
                </p>
                <Link href="/member/prayer-requests">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Heart className="h-4 w-4 mr-2" />
                    Manage Prayer Requests
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Upcoming Events */}
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-blue-800 flex items-center gap-2 text-base sm:text-lg">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {data.upcomingEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-blue-400 mb-4" />
                    <p className="text-blue-600 text-sm">No upcoming events</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.upcomingEvents.map((event) => (
                      <div
                        key={event._id}
                        className="p-3 sm:p-4 bg-white/80 rounded-lg border border-blue-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-blue-800 text-sm sm:text-base truncate">
                              {event.title}
                            </h4>
                            <div className="text-xs sm:text-sm text-blue-600 space-y-1">
                              <div>{format(new Date(event.date), "MMM dd, yyyy 'at' h:mm a")}</div>
                              {event.location && <div>📍 {event.location}</div>}
                              <div>Group: {event.group.name}</div>
                              <div>By: {event.createdBy.name}</div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              size="sm"
                              onClick={() => confirmAttendance(event._id, true)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
                            >
                              Will Attend
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedEventId(event._id)
                                setShowApologyModal(true)
                                setApologyReason('')
                              }}
                              className="border-blue-300 text-blue-800 hover:bg-blue-50 text-xs sm:text-sm"
                            >
                              Can't Attend
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendance History */}
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-blue-800 flex items-center gap-2 text-base sm:text-lg">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  Recent Attendance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {data.recentAttendance.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-blue-400 mb-4" />
                    <p className="text-blue-600 text-sm">No attendance records yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
                    {data.recentAttendance.map((record) => (
                      <div
                        key={record._id}
                        className="p-3 bg-white/80 rounded-lg border border-blue-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {record.status === 'present' ? (
                                <CheckCircle className="h-4 w-4 text-blue-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-blue-400" />
                              )}
                              <span className={`text-xs sm:text-sm font-medium ${
                                record.status === 'present' ? 'text-blue-800' : 'text-blue-600'
                              }`}>
                                {record.status === 'present' ? 'Present' : 'Absent'}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-blue-600 mt-1">
                              {format(new Date(record.date), "MMM dd, yyyy")}
                            </p>
                            {record.event && (
                              <p className="text-xs text-blue-500 truncate">{record.event.title}</p>
                            )}
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
      </div>

      {/* Apology Modal */}
      {showApologyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Can't Attend Event
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Please provide a reason for not attending this event. This helps your leader understand your situation.
              </p>
              <textarea
                value={apologyReason}
                onChange={(e) => setApologyReason(e.target.value)}
                placeholder="Please explain why you cannot attend..."
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-vertical"
                maxLength={500}
              />
              <div className="text-xs text-blue-600 mt-1">
                {apologyReason.length}/500 characters
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => {
                    setShowApologyModal(false)
                    setSelectedEventId(null)
                    setApologyReason('')
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedEventId && apologyReason.trim()) {
                      confirmAttendance(selectedEventId, false, apologyReason.trim())
                      setShowApologyModal(false)
                      setSelectedEventId(null)
                      setApologyReason('')
                    }
                  }}
                  disabled={!apologyReason.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Submit Apology
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
