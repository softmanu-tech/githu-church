"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Layers, RefreshCw, Users, Wifi, Settings, TrendingUp, Award, AlertTriangle, BarChart3, MessageSquare, Heart, LogOut } from "lucide-react"
import { format } from "date-fns"
import { ResponsiveDashboard } from "@/components/ResponsiveDashboard"
import { ProfileIcon } from "@/components/ProfileIcon"
import { ProfessionalHeader } from "@/components/ProfessionalHeader"
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from "@/components/ui/ultra-fast-skeleton"
import dynamic from "next/dynamic"
import { Suspense } from "react"

// Lazy load heavy chart components
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-200 animate-pulse rounded" />
})

const BarChart = dynamic(() => import('recharts').then(mod => ({ default: mod.BarChart })), {
  ssr: false
})

const LineChart = dynamic(() => import('recharts').then(mod => ({ default: mod.LineChart })), {
  ssr: false
})

const PieChart = dynamic(() => import('recharts').then(mod => ({ default: mod.PieChart })), {
  ssr: false
})

// Import lightweight chart components normally
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  Pie,
  Cell
} from 'recharts'

interface StatCardProps {
    title: string
    value: number
    delay?: number
}

interface DashboardStats {
    leaders: number
    groups: number
    members: number
    totalAttendance: number
}

interface Event {
    _id: string
    title: string
    date: string
    location?: string
    description?: string
    createdBy?: {
        _id: string
        name: string
    }
    group?: {
        _id: string
        name: string
    }
    attendanceCount?: number
    totalMembers?: number
    attendanceRate?: number
}

interface AttendanceRecord {
    _id: string
    date: string
    count: number
    group?: {
        _id: string
        name: string
    }
    leader?: {
        _id: string
        name: string
    }
}

interface Member {
    _id: string
    name: string
    phone?: string
    email: string
    residence?: string
    department?: string
    group?: {
        _id: string
        name: string
    }
    attendanceCount?: number
    totalEvents?: number
    attendanceRate?: number
    rating?: string
    lastAttendanceDate?: string | null
}

function StatCard({ title, value, delay = 0 }: StatCardProps) {
    return (
        <div className="animate-fade-in">
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 uppercase tracking-wide">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-800">{value}</p>
                </CardContent>
            </Card>
        </div>
    )
}

function TableCard<T>({
                          title,
                          headers,
                          data,
                          renderRow,
                          emptyMessage
                      }: {
    title: string
    headers: string[]
    data: T[]
    renderRow: (item: T) => string[]
    emptyMessage: string
}) {
    return (
        <div className="animate-fade-in">
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                {headers.map((header) => (
                                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {data.length > 0 ? (
                                data.map((item, index) => (
                                    <tr className="animate-fade-in"
                                        key={index}
                                    >
                                        {renderRow(item).map((cell, i) => (
                                            <td key={i} className="px-6 py-4 whitespace-nowrap text-sm">
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={headers.length} className="px-6 py-4 text-center text-sm text-blue-600">
                                        {emptyMessage}
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}


export default function BishopDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        leaders: 0,
        groups: 0,
        members: 0,
        totalAttendance: 0,
    })
    const [events, setEvents] = useState<Event[]>([])
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
    const [members, setMembers] = useState<Member[]>([])
    const [bishop, setBishop] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState("")
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
    const [groupsPerformance, setGroupsPerformance] = useState<any>(null)
    const [performanceLoading, setPerformanceLoading] = useState(false)
    const [allResponses, setAllResponses] = useState<any>(null)
    const [responsesLoading, setResponsesLoading] = useState(false)

    const handleLogout = async () => {
        try {
            await fetch("/api/logout", {
                method: "POST",
                credentials: "include"
            });
            window.location.href = "/";
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const parseJsonSafely = async (response: Response) => {
        try {
            const text = await response.text()
            return text ? JSON.parse(text) : null
        } catch (err) {
            console.error("Failed to parse JSON:", err)
            return null
        }
    }

    const fetchDashboardData = async () => {
        try {
            setRefreshing(true)
            setError("")

            // Create AbortController for timeout handling
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

            const [statsRes, eventsRes, profileRes, membersRes] = await Promise.all([
                fetch("/api/bishop/dashboard", { 
                    signal: controller.signal,
                    credentials: "include",
                    headers: { 
                        'Cache-Control': 'no-cache',
                        'Content-Type': 'application/json'
                    }
                }),
                fetch("/api/events", { 
                    signal: controller.signal,
                    credentials: "include",
                    headers: { 
                        'Cache-Control': 'no-cache',
                        'Content-Type': 'application/json'
                    }
                }),
                fetch("/api/bishop/profile", { 
                    signal: controller.signal,
                    credentials: "include",
                    headers: { 
                        'Cache-Control': 'no-cache',
                        'Content-Type': 'application/json'
                    }
                }),
                fetch("/api/bishop/members", { 
                    signal: controller.signal,
                    credentials: "include",
                    headers: { 
                        'Cache-Control': 'no-cache',
                        'Content-Type': 'application/json'
                    }
                }),
            ])

            clearTimeout(timeoutId)

            if (!statsRes.ok) {
                const errorText = await statsRes.text()
                throw new Error(`Dashboard API error: ${statsRes.status} - ${errorText}`)
            }

            const statsData = await parseJsonSafely(statsRes)
            if (!statsData) throw new Error("Invalid stats data")

            // Ensure all values are numbers - Fixed property names
            setStats({
                leaders: Number(statsData.stats?.totalLeaders || statsData.stats?.leaders || statsData.leaders) || 0,
                groups: Number(statsData.stats?.totalGroups || statsData.stats?.groups || statsData.groups) || 0,
                members: Number(statsData.stats?.totalMembers || statsData.stats?.members || statsData.members) || 0,
                totalAttendance: Number(statsData.stats?.totalAttendance || statsData.totalAttendance) || 0,
            })

            const eventsData = await parseJsonSafely(eventsRes)
            setEvents(eventsData?.events || eventsData || [])

            // Handle profile data
            if (profileRes.ok) {
                const profileData = await parseJsonSafely(profileRes)
                if (profileData?.success) {
                    setBishop(profileData.data.user)
                }
            }

            // Handle members data
            if (membersRes.ok) {
                const membersData = await parseJsonSafely(membersRes)
                if (membersData?.success) {
                    setMembers(membersData.data.members || [])
                } else {
                    setMembers([])
                }
            } else {
                setMembers([])
            }
            
            // For now, set empty array for attendance
            // This will be populated when attendance API endpoint is fixed
            setAttendance([])

            setLastRefreshed(new Date())
        } catch (err) {
            console.error("Error fetching dashboard data:", err)
            if (err instanceof Error) {
                if (err.name === 'AbortError') {
                    setError("Request timed out. Please check your connection and try again.")
                } else if (err.message.includes('Failed to fetch')) {
                    setError("Unable to connect to server. Please check if the server is running.")
                } else {
                    setError(`Failed to load dashboard data: ${err.message}`)
                }
            } else {
                setError("Failed to load dashboard data. Please try refreshing the page.")
            }
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const fetchGroupsPerformance = async () => {
        try {
            setPerformanceLoading(true)
            const response = await fetch('/api/bishop/groups-performance?months=6')
            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setGroupsPerformance(result.data)
                }
            }
        } catch (err) {
            console.error('Error fetching groups performance:', err)
        } finally {
            setPerformanceLoading(false)
        }
    }

    const fetchAllResponses = async () => {
        try {
            setResponsesLoading(true)
            const response = await fetch('/api/bishop/all-responses?days=30')
            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setAllResponses(result.data)
                }
            }
        } catch (err) {
            console.error('Error fetching all responses:', err)
        } finally {
            setResponsesLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
        fetchGroupsPerformance()
        fetchAllResponses()

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchDashboardData, 30000)
        
        // Refresh when window gets focus (when coming back from other pages)
        const handleFocus = () => {
            fetchDashboardData()
        }
        
        // Listen for refresh messages from other pages
        const handleMessage = (event: MessageEvent) => {
            if (event.data === 'refresh-dashboard') {
                fetchDashboardData()
            }
        }
        
        window.addEventListener('focus', handleFocus)
        window.addEventListener('message', handleMessage)
        
        return () => {
            clearInterval(interval)
            window.removeEventListener('focus', handleFocus)
            window.removeEventListener('message', handleMessage)
        }
    }, [])

    const formatDate = (dateStr: string) => {
        try {
            return format(new Date(dateStr), "MMM dd, yyyy")
        } catch {
            return "Invalid date"
        }
    }

    const formatTime = (date: Date | null) => {
        if (!date) return "Loading..."
        return format(date, "hh:mm:ss a")
    }

    return (
        <div className="min-h-screen bg-blue-300">
            <ProfessionalHeader
                title="Bishop Dashboard"
                subtitle="Manage your church community"
                user={bishop ? {
                    name: bishop.name,
                    email: bishop.email,
                    profilePicture: bishop.profilePicture
                } : undefined}
                actions={[
                    {
                        label: "Leaders",
                        href: "/bishop/leaders",
                        variant: "outline",
                        icon: <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    },
                    {
                        label: "Groups",
                        href: "/bishop/groups",
                        variant: "default",
                        icon: <Layers className="h-3 w-3 sm:h-4 sm:w-4" />
                    },
                    {
                        label: "Members",
                        href: "/bishop/members",
                        variant: "outline",
                        className: "border-green-300 text-green-100 bg-green-600/20 hover:bg-green-600/30",
                        icon: <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    },
                    {
                        label: "Protocol Teams",
                        href: "/bishop/protocol-teams",
                        variant: "outline",
                        className: "border-purple-300 text-purple-100 bg-purple-600/20 hover:bg-purple-600/30",
                        icon: <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    },
                    {
                        label: "Analytics",
                        href: "/bishop/protocol-analytics",
                        variant: "outline",
                        className: "border-teal-300 text-teal-100 bg-teal-600/20 hover:bg-teal-600/30",
                        icon: <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                    },
                    {
                        label: "Support",
                        href: "/bishop/protocol-support",
                        variant: "outline",
                        className: "border-indigo-300 text-indigo-100 bg-indigo-600/20 hover:bg-indigo-600/30",
                        icon: <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                    },
                    {
                        label: "Strategy Review",
                        href: "/bishop/strategy-review",
                        variant: "outline",
                        className: "border-emerald-300 text-emerald-100 bg-emerald-600/20 hover:bg-emerald-600/30",
                        icon: <Award className="h-3 w-3 sm:h-4 sm:w-4" />
                    },
                    {
                        label: "Prayer Requests",
                        href: "/bishop/prayer-requests",
                        variant: "outline",
                        className: "border-pink-300 text-pink-100 bg-pink-600/20 hover:bg-pink-600/30",
                        icon: <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
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

                    {/* Error State */}
                    {error && (
                        <div className="bg-red-200/90 backdrop-blur-md border border-red-300 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                            <div className="flex items-center">
                                <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                                <div>
                                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                                    <div className="mt-1 text-sm text-red-700">{error}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Ultra-Fast Loading State */}
                    {loading ? (
                        <UltraFastPageSkeleton />
                    ) : (
                        <div className="space-y-4 sm:space-y-6 md:space-y-8">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                                <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-3 sm:p-4 md:p-6">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <Users className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600" />
                                        </div>
                                        <div className="ml-2 sm:ml-3 md:ml-4">
                                            <p className="text-xs sm:text-sm font-medium text-blue-700 uppercase tracking-wide">Leaders</p>
                                            <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-800">{stats.leaders}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-3 sm:p-4 md:p-6">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <Layers className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600" />
                                        </div>
                                        <div className="ml-2 sm:ml-3 md:ml-4">
                                            <p className="text-xs sm:text-sm font-medium text-blue-700 uppercase tracking-wide">Groups</p>
                                            <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-800">{stats.groups}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-3 sm:p-4 md:p-6">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <Users className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600" />
                                        </div>
                                        <div className="ml-2 sm:ml-3 md:ml-4">
                                            <p className="text-xs sm:text-sm font-medium text-blue-700 uppercase tracking-wide">Members</p>
                                            <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-800">{stats.members}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-3 sm:p-4 md:p-6">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600" />
                                        </div>
                                        <div className="ml-2 sm:ml-3 md:ml-4">
                                            <p className="text-xs sm:text-sm font-medium text-blue-700 uppercase tracking-wide">Total Attendance</p>
                                            <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-800">{stats.totalAttendance}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        {/* Groups Performance Analytics */}
                        <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-4 sm:p-6">
                            <h3 className="text-sm sm:text-base md:text-lg font-medium text-blue-800 mb-2 sm:mb-3 md:mb-4 flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                All Groups Performance Analysis
                            </h3>
                            
                            {performanceLoading ? (
                                <UltraFastChartSkeleton />
                            ) : groupsPerformance ? (
                                <div className="space-y-6">
                                    {/* Performance Summary Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                                        <div className="bg-white/80 p-2 sm:p-3 md:p-2 sm:p-3 md:p-4 rounded-lg border border-blue-200">
                                            <div className="text-2xl font-bold text-blue-800">{groupsPerformance.insights.averageAttendanceRate}%</div>
                                            <div className="text-sm text-blue-600">Church Average</div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                Across {groupsPerformance.overallStats.totalGroups} groups
                                            </div>
                                        </div>
                                        
                                        <div className="bg-green-50 p-2 sm:p-3 md:p-4 rounded-lg border border-green-200">
                                            <div className="text-2xl font-bold text-green-800">{groupsPerformance.insights.excellentGroups}</div>
                                            <div className="text-sm text-green-600">Excellent Groups</div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                80%+ attendance rate
                                            </div>
                                        </div>
                                        
                                        <div className="bg-blue-50 p-2 sm:p-3 md:p-4 rounded-lg border border-blue-200">
                                            <div className="text-2xl font-bold text-blue-800">{groupsPerformance.insights.improvingGroups}</div>
                                            <div className="text-sm text-blue-600">Improving Groups</div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                Positive trend
                                            </div>
                                        </div>
                                        
                                        <div className="bg-amber-50 p-2 sm:p-3 md:p-4 rounded-lg border border-amber-200">
                                            <div className="text-2xl font-bold text-amber-800">{groupsPerformance.insights.needsImprovementGroups}</div>
                                            <div className="text-sm text-amber-600">Need Attention</div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                Below 50% attendance
                                            </div>
                                        </div>
                                    </div>

                                    {/* Groups Comparison Chart */}
                                    <div className="bg-white/80 p-2 sm:p-3 md:p-4 rounded-lg border border-blue-200">
                                        <h4 className="text-lg font-medium text-blue-800 mb-4">Groups Attendance Comparison</h4>
                                        <ResponsiveContainer width="100%" height={350}>
                                            <BarChart data={groupsPerformance.groupPerformance}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
                                                <XAxis 
                                                    dataKey="groupName" 
                                                    tick={{ fontSize: 10, fill: '#1E40AF' }}
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={80}
                                                />
                                                <YAxis 
                                                    tick={{ fontSize: 12, fill: '#1E40AF' }} 
                                                    domain={[0, 100]}
                                                    label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }}
                                                />
                                                <Tooltip 
                                                    formatter={(value, name) => [
                                                        name === 'attendanceRate' ? `${value}%` : value,
                                                        name === 'attendanceRate' ? 'Attendance Rate' : 
                                                        name === 'memberCount' ? 'Members' : name
                                                    ]}
                                                    contentStyle={{ 
                                                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                                        border: '1px solid #3B82F6',
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                                <Legend />
                                                <Bar 
                                                    dataKey="attendanceRate" 
                                                    name="Attendance Rate (%)"
                                                    fill="#3B82F6"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                                <Bar 
                                                    dataKey="memberCount" 
                                                    name="Member Count"
                                                    fill="#10B981"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Church-wide Monthly Trend */}
                                    <div className="bg-white/80 p-2 sm:p-3 md:p-4 rounded-lg border border-blue-200">
                                        <h4 className="text-lg font-medium text-blue-800 mb-4">Church-wide Monthly Attendance Trend</h4>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={groupsPerformance.churchWideMonthly}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
                                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#1E40AF' }} />
                                                <YAxis 
                                                    tick={{ fontSize: 12, fill: '#1E40AF' }} 
                                                    domain={[0, 100]}
                                                    label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }}
                                                />
                                                <Tooltip 
                                                    formatter={(value) => [`${value}%`, 'Attendance Rate']}
                                                    contentStyle={{ 
                                                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                                        border: '1px solid #3B82F6',
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="attendanceRate" 
                                                    stroke="#3B82F6" 
                                                    strokeWidth={3}
                                                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                                                    activeDot={{ r: 7, fill: '#1E40AF' }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Performance Insights */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                                        {groupsPerformance.insights.topPerformer && (
                                            <div className="bg-green-50 p-2 sm:p-3 md:p-4 rounded-lg border border-green-200">
                                                <h5 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                                                    <Award className="h-4 w-4" />
                                                    Top Performing Group
                                                </h5>
                                                <p className="text-sm text-green-700">
                                                    <strong>{groupsPerformance.insights.topPerformer.groupName}</strong> leads with 
                                                    <strong>{groupsPerformance.insights.topPerformer.attendanceRate}%</strong> attendance rate
                                                </p>
                                                <p className="text-xs text-green-600 mt-1">
                                                    Leader: {groupsPerformance.insights.topPerformer.leaderName}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {groupsPerformance.insights.needsAttention && (
                                            <div className="bg-amber-50 p-2 sm:p-3 md:p-4 rounded-lg border border-amber-200">
                                                <h5 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    Needs Attention
                                                </h5>
                                                <p className="text-sm text-amber-700">
                                                    <strong>{groupsPerformance.insights.needsAttention.groupName}</strong> has 
                                                    <strong>{groupsPerformance.insights.needsAttention.attendanceRate}%</strong> attendance rate
                                                </p>
                                                <p className="text-xs text-amber-600 mt-1">
                                                    Consider supporting leader: {groupsPerformance.insights.needsAttention.leaderName}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-blue-600">
                                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Groups performance analytics will appear here once data is available.</p>
                                </div>
                            )}
                        </div>

                        {/* All Member Responses Overview */}
                        <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-4 sm:p-6">
                            <h3 className="text-sm sm:text-base md:text-lg font-medium text-blue-800 mb-2 sm:mb-3 md:mb-4 flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Recent Member Responses (Last 30 Days)
                            </h3>
                            
                            {responsesLoading ? (
                                <UltraFastTableSkeleton />
                            ) : allResponses ? (
                                <div className="space-y-6">
                                    {/* Response Summary Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                                        <div className="bg-green-50 p-2 sm:p-3 md:p-4 rounded-lg border border-green-200">
                                            <div className="text-2xl font-bold text-green-800">{allResponses.summary.attendingCount}</div>
                                            <div className="text-sm text-green-600">Will Attend</div>
                                            <div className="text-xs text-gray-600 mt-1">Confirmations received</div>
                                        </div>
                                        
                                        <div className="bg-red-50 p-2 sm:p-3 md:p-4 rounded-lg border border-red-200">
                                            <div className="text-2xl font-bold text-red-800">{allResponses.summary.notAttendingCount}</div>
                                            <div className="text-sm text-red-600">Won't Attend</div>
                                            <div className="text-xs text-gray-600 mt-1">Apologies received</div>
                                        </div>
                                        
                                        <div className="bg-blue-50 p-2 sm:p-3 md:p-4 rounded-lg border border-blue-200">
                                            <div className="text-2xl font-bold text-blue-800">{allResponses.summary.responseRate}%</div>
                                            <div className="text-sm text-blue-600">Response Rate</div>
                                            <div className="text-xs text-gray-600 mt-1">Member engagement</div>
                                        </div>
                                        
                                        <div className="bg-purple-50 p-2 sm:p-3 md:p-4 rounded-lg border border-purple-200">
                                            <div className="text-2xl font-bold text-purple-800">{allResponses.needsFollowUp.length}</div>
                                            <div className="text-sm text-purple-600">Need Follow-up</div>
                                            <div className="text-xs text-gray-600 mt-1">No recent responses</div>
                                        </div>
                                    </div>

                                    {/* Members Not Attending with Reasons */}
                                    <div className="bg-white/80 p-2 sm:p-3 md:p-4 rounded-lg border border-blue-200">
                                        <h4 className="text-lg font-medium text-blue-800 mb-4 flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-red-600" />
                                            Members Not Attending - Apology Reasons
                                        </h4>
                                        {allResponses.responses.notAttending.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Users className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                                                <p className="text-blue-600">No apologies received in the last 30 days</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
                                                {allResponses.responses.notAttending.map((response: any) => (
                                                    <div 
                                                        key={response._id}
                                                        className="animate-fade-in p-4 bg-red-50 rounded-lg border border-red-200"
                                                    >
                                                        <div className="space-y-3">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="font-medium text-red-800">{response.member.name}</div>
                                                                    <div className="text-sm text-red-600">{response.member.email}</div>
                                                                    <div className="text-xs text-red-500">
                                                                        Group: {response.member.group?.name || 'No Group'}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-sm font-medium text-red-700">{response.event.title}</div>
                                                                    <div className="text-xs text-red-500">
                                                                        {format(new Date(response.event.date), "MMM dd, yyyy")}
                                                                    </div>
                                                                    <div className="text-xs text-red-400">
                                                                        Response: {format(new Date(response.responseDate), "MMM dd, h:mm a")}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {response.reason && (
                                                                <div className="mt-3 p-3 bg-red-100 rounded border-l-4 border-red-400">
                                                                    <div className="flex items-start gap-2">
                                                                        <MessageSquare className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                                        <div>
                                                                            <div className="text-xs font-medium text-red-700 mb-1">Reason for not attending:</div>
                                                                            <div className="text-sm text-red-800 font-medium">{response.reason}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Members Needing Follow-up */}
                                    {allResponses.needsFollowUp.length > 0 && (
                                        <div className="bg-amber-50 p-2 sm:p-3 md:p-4 rounded-lg border border-amber-200">
                                            <h4 className="text-lg font-medium text-amber-800 mb-4 flex items-center gap-2">
                                                <AlertTriangle className="h-5 w-5" />
                                                Members Needing Follow-up
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                                                {allResponses.needsFollowUp.map((item: any) => (
                                                    <div key={item.member._id} className="bg-white p-3 rounded border border-amber-300">
                                                        <div className="font-medium text-amber-800">{item.member.name}</div>
                                                        <div className="text-sm text-amber-600">{item.member.email}</div>
                                                        <div className="text-xs text-amber-500 mt-1">
                                                            {item.unrespondedEvents} unresponded events
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-blue-600">
                                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Member responses will appear here once available.</p>
                                </div>
                            )}
                        </div>


                        {/* Dashboard Content */}
                        <ResponsiveDashboard
                            attendance={attendance}
                            events={events}
                            members={members}
                            formatDate={formatDate}
                        />
                    </div>
                    )}
                </div>
            </div>
        </div>
    )
}
