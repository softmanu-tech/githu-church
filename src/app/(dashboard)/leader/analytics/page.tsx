"use client"

import React, { useState, useEffect } from "react"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';
import { TrendingUp, Users, Calendar, Target } from "lucide-react"
import Link from "next/link"

interface AttendanceAnalytics {
  totalEvents: number
  totalAttendance: number
  averageAttendance: number
  attendanceRate: number
  monthlyTrend: Array<{
    month: string
    attendance: number
    events: number
  }>
  memberPerformance: Array<{
    memberId: string
    memberName: string
    attendanceCount: number
    attendanceRate: number
    lastAttended: string | null
  }>
  eventPerformance: Array<{
    eventId: string
    eventTitle: string
    date: string
    attendanceCount: number
    attendanceRate: number
  }>
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AttendanceAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AttendanceAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(
        `/api/leader/analytics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      )
      
      if (!response.ok) {
        throw new Error("Failed to fetch analytics")
      }
      
      const data = await response.json()
      
      if (data.success) {
        setAnalytics(data.data)
      } else {
        throw new Error(data.error || "Failed to load analytics")
      }
      
    } catch (err) {
      console.error("Error fetching analytics:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch analytics")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-300">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-blue-100 text-sm sm:text-base">Analyzing attendance data...</p>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <UltraFastCardSkeleton key={i} />
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <UltraFastChartSkeleton />
            <UltraFastChartSkeleton />
          </div>

          {/* Table Skeleton */}
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
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-blue-300 flex items-center justify-center px-4">
        <div className="bg-blue-200/90 backdrop-blur-md rounded-lg p-6 border border-blue-300 text-center">
          <p className="text-blue-800">No analytics data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-300">
      {/* Header */}
      <div className="bg-blue-200/90 backdrop-blur-md border-b border-blue-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-blue-800">Attendance Analytics</h1>
              <p className="text-sm text-blue-700 mt-1">Detailed attendance insights and trends</p>
            </div>
            <div className="flex space-x-3">
              <Link 
                href="/leader/attendance" 
                className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-800 bg-white/80 backdrop-blur-sm hover:bg-white/90"
              >
                Mark Attendance
              </Link>
              <Link 
                href="/leader" 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in space-y-6">
          
          {/* Date Range Filter */}
          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 bg-white/90 text-blue-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 bg-white/90 text-blue-800"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardContent className="p-6 text-center">
                <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-700 uppercase tracking-wide">Total Events</p>
                <p className="text-3xl font-bold text-blue-800">{analytics.totalEvents}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-700 uppercase tracking-wide">Total Attendance</p>
                <p className="text-3xl font-bold text-blue-800">{analytics.totalAttendance}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-700 uppercase tracking-wide">Average Attendance</p>
                <p className="text-3xl font-bold text-blue-800">{analytics.averageAttendance.toFixed(1)}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardContent className="p-6 text-center">
                <Target className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-700 uppercase tracking-wide">Attendance Rate</p>
                <p className="text-3xl font-bold text-blue-800">{analytics.attendanceRate.toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Tabs */}
          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <Tabs defaultValue="trends" className="w-full">
              <div className="border-b border-blue-300">
                <TabsList className="bg-transparent border-0 w-full justify-start p-0">
                  <TabsTrigger 
                    value="trends" 
                    className="flex items-center gap-2 px-6 py-4 border-b-2 border-transparent data-[state=active]:border-blue-800 data-[state=active]:text-blue-800 data-[state=active]:bg-white/20 bg-transparent hover:bg-white/10 rounded-none text-blue-700"
                  >
                    <TrendingUp className="h-4 w-4" /> Trends
                  </TabsTrigger>
                  <TabsTrigger 
                    value="members" 
                    className="flex items-center gap-2 px-6 py-4 border-b-2 border-transparent data-[state=active]:border-blue-800 data-[state=active]:text-blue-800 data-[state=active]:bg-white/20 bg-transparent hover:bg-white/10 rounded-none text-blue-700"
                  >
                    <Users className="h-4 w-4" /> Members
                  </TabsTrigger>
                  <TabsTrigger 
                    value="events" 
                    className="flex items-center gap-2 px-6 py-4 border-b-2 border-transparent data-[state=active]:border-blue-800 data-[state=active]:text-blue-800 data-[state=active]:bg-white/20 bg-transparent hover:bg-white/10 rounded-none text-blue-700"
                  >
                    <Calendar className="h-4 w-4" /> Events
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="trends" className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-blue-800">Monthly Attendance Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.monthlyTrend}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="attendance" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="members" className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-blue-800">Member Performance</h3>
                  <div className="mobile-table-container">
                    <table className="mobile-table">
                      <thead className="mobile-table-header">
                        <tr>
                          <th>Member</th>
                          <th>Attendance</th>
                          <th className="hide-mobile">Rate</th>
                          <th className="hide-tablet">Last Attended</th>
                        </tr>
                      </thead>
                      <tbody className="mobile-table-body">
                        {analytics.memberPerformance.map((member) => (
                          <tr key={member.memberId}>
                            <td>
                              <div className="min-w-0">
                                <div className="font-medium truncate">{member.memberName}</div>
                                <div className="text-xs opacity-75 show-mobile-only">{member.attendanceRate.toFixed(1)}% rate</div>
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                <span className="font-medium">{member.attendanceCount}</span>
                                <span className="text-xs opacity-75 ml-1 hide-mobile">events</span>
                              </div>
                            </td>
                            <td className="hide-mobile">
                              <div className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {member.attendanceRate.toFixed(1)}%
                              </div>
                            </td>
                            <td className="hide-tablet">
                              <div className="truncate">
                                {member.lastAttended ? 
                                  new Date(member.lastAttended).toLocaleDateString() : 
                                  'Never'
                                }
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="events" className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-blue-800">Event Performance</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.eventPerformance}>
                      <XAxis dataKey="eventTitle" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="attendanceCount" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}
