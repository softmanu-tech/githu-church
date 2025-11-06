"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';
import { useAlerts } from "@/components/ui/alert-system"
import { ProfileIcon } from "@/components/ProfileIcon"
import { ProfessionalHeader } from "@/components/ProfessionalHeader"
import { format } from "date-fns"
import Link from "next/link"
import {
  Users,
  UserPlus,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  LogOut,
  Settings,
  Award,
  AlertTriangle,
  Calendar,
  Target,
  Star,
  MessageSquare,
  Phone,
  MapPin,
  Mail,
  BookOpen,
  X
} from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'

interface ProtocolDashboardData {
  protocolMember: {
    name: string
    email: string
    profilePicture?: string
    team: {
      name: string
      description?: string
    }
  }
  visitors: {
    _id: string
    name: string
    email: string
    phone?: string
    address?: string
    type: string
    status: string
    monitoringStatus: string
    attendanceRate: number
    monitoringProgress: number
    daysRemaining: number
    createdAt: string
  }[]
  statistics: {
    totalVisitors: number
    joiningVisitors: number
    visitingOnly: number
    activeMonitoring: number
    completedMonitoring: number
    convertedToMembers: number
    needsAttention: number
    conversionRate: number
  }
}

export default function ProtocolDashboard() {
  const alerts = useAlerts()
  
  const [data, setData] = useState<ProtocolDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateVisitor, setShowCreateVisitor] = useState(false)
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

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/protocol/visitors', {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch protocol dashboard data")
      }

      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || "Failed to fetch dashboard data")
      }
    } catch (err) {
      console.error("Error fetching protocol data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch protocol data")
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
        // Refresh the dashboard data
        await fetchData()
        
        // Reset form
        setNewVisitor({
          name: '', email: '', phone: '', address: '', age: '', occupation: '', maritalStatus: 'single',
          type: 'first-time', status: 'visiting', referredBy: '', howDidYouHear: '',
          emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelationship: ''
        })
        setShowCreateVisitor(false)
        alerts.success("Registration Success", `Visitor ${result.data.name} registered successfully!`)
      } else {
        alerts.error("Registration Error", result.error || "Failed to register visitor")
      }
    } catch (err) {
      alerts.error("Registration Error", "Failed to register visitor")
    } finally {
      setRegistering(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-300">
        <ProfessionalHeader
          title="Protocol Dashboard"
          subtitle="Manage visitors and track integration progress"
        />
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <UltraFastCardSkeleton key={i} />
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <UltraFastChartSkeleton />
            <UltraFastChartSkeleton />
          </div>

          {/* Visitors Table Skeleton */}
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
          <p className="text-blue-800">No protocol data available.</p>
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

  const visitorTypeData = [
    { name: 'Joining', value: data.statistics.joiningVisitors, color: '#10B981' },
    { name: 'Visiting', value: data.statistics.visitingOnly, color: '#6B7280' }
  ]

  const monitoringStatusData = [
    { name: 'Active', value: data.statistics.activeMonitoring, color: '#3B82F6' },
    { name: 'Completed', value: data.statistics.completedMonitoring, color: '#10B981' },
    { name: 'Converted', value: data.statistics.convertedToMembers, color: '#8B5CF6' }
  ]

  return (
    <div className="min-h-screen bg-blue-300">
      <ProfessionalHeader
        title={`Protocol Dashboard - ${data.protocolMember.name}`}
        subtitle={`${data.protocolMember.team.name} • Managing ${data.statistics.totalVisitors} visitors`}
        user={{
          name: data.protocolMember.name,
          email: data.protocolMember.email,
          profilePicture: data.protocolMember.profilePicture
        }}
        actions={[
          {
            label: "Add Visitor",
            onClick: () => setShowCreateVisitor(true),
            variant: "default",
            icon: <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
          },
          {
            label: "Responsibilities",
            href: "/protocol/responsibilities",
            variant: "outline",
            className: "border-purple-300 text-purple-100 bg-purple-600/20 hover:bg-purple-600/30",
            icon: <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
          },
          {
            label: "Strategies",
            href: "/protocol/strategies",
            variant: "outline",
            className: "border-green-300 text-green-100 bg-green-600/20 hover:bg-green-600/30",
            icon: <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
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
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-blue-800">{data.statistics.totalVisitors}</div>
              <div className="text-xs sm:text-sm text-blue-600">Total Visitors</div>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-100 border border-blue-300">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-blue-800">{data.statistics.joiningVisitors}</div>
              <div className="text-xs sm:text-sm text-blue-600">Joining</div>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-100 border border-blue-300">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-blue-800">{data.statistics.activeMonitoring}</div>
              <div className="text-xs sm:text-sm text-blue-600">Monitoring</div>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-100 border border-blue-300">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-blue-800">{data.statistics.convertedToMembers}</div>
              <div className="text-xs sm:text-sm text-blue-600">Converted</div>
            </CardContent>
          </Card>
          
          <Card className="bg-amber-100 border border-amber-300">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-amber-800">{data.statistics.needsAttention}</div>
              <div className="text-xs sm:text-sm text-amber-600">Need Attention</div>
            </CardContent>
          </Card>
          
          <Card className="bg-indigo-100 border border-indigo-300">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-indigo-800">{data.statistics.conversionRate}%</div>
              <div className="text-xs sm:text-sm text-indigo-600">Conversion Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Visitor Types Distribution */}
          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Visitor Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={visitorTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {visitorTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Monitoring Status */}
          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Monitoring Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monitoringStatusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#166534' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#166534' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #10B981',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visitors List */}
        <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Assigned Visitors ({data.visitors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.visitors.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                <p className="text-blue-600">No visitors assigned yet</p>
                <Button
                  onClick={() => setShowCreateVisitor(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Register First Visitor
                </Button>
              </div>
            ) : (
              <>
                {/* Mobile Card Layout */}
                <div className="block lg:hidden space-y-4">
                  {data.visitors.map((visitor) => (
                    <div 
                      key={visitor._id}
                      className="animate-fade-in bg-white/80 rounded-lg border border-blue-200 p-4"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-blue-800">{visitor.name}</h3>
                            <p className="text-sm text-blue-600">{visitor.email}</p>
                            {visitor.phone && (
                              <p className="text-xs text-blue-500">📞 {visitor.phone}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${ 
                              visitor.status === 'joining' ? 'bg-blue-100 text-blue-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {visitor.status}
                            </span>
                            {visitor.status === 'joining' && (
                              <div className="text-xs text-blue-600 mt-1">
                                {visitor.daysRemaining} days left
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {visitor.status === 'joining' && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-blue-700">Progress:</span>
                              <span className="font-medium text-blue-800">{visitor.monitoringProgress}%</span>
                            </div>
                            <div className="w-full bg-blue-100 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${visitor.monitoringProgress}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-blue-600">
                              <span>Attendance: {visitor.attendanceRate}%</span>
                              <span className={visitor.monitoringStatus === 'active' ? 'text-blue-600' : 'text-blue-600'}>
                                {visitor.monitoringStatus}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-blue-300">
                        <th className="text-left p-3 text-sm font-medium text-blue-800">Visitor</th>
                        <th className="text-left p-3 text-sm font-medium text-blue-800">Contact</th>
                        <th className="text-left p-3 text-sm font-medium text-blue-800">Status</th>
                        <th className="text-left p-3 text-sm font-medium text-blue-800">Progress</th>
                        <th className="text-left p-3 text-sm font-medium text-blue-800">Performance</th>
                        <th className="text-left p-3 text-sm font-medium text-blue-800">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.visitors.map((visitor) => (
                        <tr
                          key={visitor._id}
                          className="border-b border-blue-200 hover:bg-white/50 transition-colors"
                        >
                          <td className="p-3">
                            <div>
                              <div className="font-medium text-blue-800">{visitor.name}</div>
                              <div className="text-sm text-blue-600">{visitor.email}</div>
                              <div className="text-xs text-blue-500">
                                {visitor.type} • Since {format(new Date(visitor.createdAt), "MMM dd")}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="space-y-1 text-sm">
                              {visitor.phone && (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <Phone className="h-3 w-3" />
                                  <span>{visitor.phone}</span>
                                </div>
                              )}
                              {visitor.address && (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate max-w-32">{visitor.address}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${ 
                              visitor.status === 'joining' ? 'bg-blue-100 text-blue-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {visitor.status}
                            </span>
                            {visitor.status === 'joining' && (
                              <div className="text-xs text-blue-600 mt-1">
                                {visitor.daysRemaining} days left
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            {visitor.status === 'joining' ? (
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-blue-800">
                                  {visitor.monitoringProgress}%
                                </div>
                                <div className="w-16 bg-blue-100 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${visitor.monitoringProgress}%` }}
                                  ></div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-blue-600 text-sm">N/A</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="space-y-1">
                              <div className={`text-sm font-medium ${ 
                                visitor.attendanceRate >= 80 ? 'text-blue-600' :
                                visitor.attendanceRate >= 60 ? 'text-blue-600' :
                                visitor.attendanceRate >= 40 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {visitor.attendanceRate}%
                              </div>
                              <div className="text-xs text-blue-600">
                                Attendance
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              <Link href={`/protocol/visitors/${visitor._id}`}>
                                <Button size="sm" variant="outline" className="text-xs">
                                  View
                                </Button>
                              </Link>
                              {visitor.status === 'joining' && (
                                <Link href={`/protocol/visitors/${visitor._id}/milestones`}>
                                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                                    Track
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Visitor Modal */}
      {showCreateVisitor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-800">Register New Visitor</h3>
                <Button
                  onClick={() => setShowCreateVisitor(false)}
                  variant="ghost"
                  size="sm"
                  className="text-blue-800 hover:bg-blue-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={newVisitor.name}
                      onChange={(e) => setNewVisitor(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800"
                      placeholder="Enter visitor's full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={newVisitor.email}
                      onChange={(e) => setNewVisitor(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800"
                      placeholder="visitor@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={newVisitor.phone}
                      onChange={(e) => setNewVisitor(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800"
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
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800"
                      placeholder="Age"
                    />
                  </div>
                </div>

                {/* Visitor Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Visitor Type</label>
                    <select
                      value={newVisitor.type}
                      onChange={(e) => setNewVisitor(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800"
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
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800"
                    >
                      <option value="visiting">Just Visiting</option>
                      <option value="joining">Interested in Joining</option>
                    </select>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Occupation</label>
                    <input
                      type="text"
                      value={newVisitor.occupation}
                      onChange={(e) => setNewVisitor(prev => ({ ...prev, occupation: e.target.value }))}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800"
                      placeholder="Occupation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Marital Status</label>
                    <select
                      value={newVisitor.maritalStatus}
                      onChange={(e) => setNewVisitor(prev => ({ ...prev, maritalStatus: e.target.value }))}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800"
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
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800"
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
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800"
                    placeholder="Friend, online, social media, etc."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleRegisterVisitor}
                    disabled={registering || !newVisitor.name || !newVisitor.email}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {registering ? 'Registering...' : 'Register Visitor'}
                  </Button>
                  <Button
                    onClick={() => setShowCreateVisitor(false)}
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
  )
}
