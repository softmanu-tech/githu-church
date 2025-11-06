"use client"

import React, { useState, useEffect, Suspense } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';
import { useAlerts } from "@/components/ui/alert-system"
import { ProfessionalHeader } from "@/components/ProfessionalHeader"
import Link from "next/link"

import { format } from "date-fns"
import {
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Target,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Crown,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Settings,
  LogOut
} from "lucide-react"
// Lazy load heavy chart components
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-200 animate-pulse rounded" />
})

const ComposedChart = dynamic(() => import('recharts').then(mod => ({ default: mod.ComposedChart })), {
  ssr: false
})

const AreaChart = dynamic(() => import('recharts').then(mod => ({ default: mod.AreaChart })), {
  ssr: false
})

const BarChart = dynamic(() => import('recharts').then(mod => ({ default: mod.BarChart })), {
  ssr: false
})

// Import other chart components normally (they're lightweight)
import {
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts'

interface TeamAnalytics {
  teamId: string
  teamName: string
  teamDescription: string
  leader: {
    name: string
    email: string
  }
  memberCount: number
  createdAt: string
  statistics: {
    totalVisitors: number
    joiningVisitors: number
    visitingOnly: number
    activeMonitoring: number
    completedMonitoring: number
    convertedMembers: number
    conversionRate: number
  }
  growth: {
    monthlyGrowth: Array<{
      month: string
      totalVisitors: number
      joining: number
      visiting: number
      conversions: number
      cumulativeTotal: number
    }>
    growthTrend: number
    trendDirection: 'growing' | 'declining' | 'stable'
    performanceScore: number
  }
  memberPerformance: Array<{
    memberId: string
    name: string
    email: string
    assignedVisitors: number
    conversions: number
    conversionRate: number
    isLeader: boolean
  }>
}

interface TeamRanking {
  rank: number
  teamId: string
  teamName: string
  performanceScore: number
  totalVisitors: number
  conversionRate: number
  growthTrend: number
  trendDirection: string
}

interface AnalyticsData {
  teamAnalytics: TeamAnalytics[]
  churchStats: {
    totalTeams: number
    totalVisitors: number
    totalJoining: number
    totalConversions: number
    averageConversionRate: number
    topPerformingTeam: TeamAnalytics | null
  }
  teamRankings: TeamRanking[]
  churchGrowth: Array<{
    month: string
    totalVisitors: number
    joining: number
    visiting: number
    conversions: number
  }>
  insights: {
    fastestGrowingTeam: TeamRanking | undefined
    highestConversionTeam: TeamRanking
    teamsNeedingAttention: number
    totalActiveVisitors: number
  }
}

export default function ProtocolAnalyticsPage() {
  const alerts = useAlerts()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/bishop/protocol-teams/analytics/simple', {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch analytics data")
      }

      const result = await response.json()
      if (result.success) {
        setData(result.data)
        if (result.data.teamAnalytics.length > 0) {
          setSelectedTeam(result.data.teamAnalytics[0].teamId)
        }
      } else {
        throw new Error(result.error || "Failed to fetch analytics data")
      }
    } catch (err) {
      console.error("Error fetching analytics data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch analytics data")
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

  useEffect(() => {
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-300">
        <ProfessionalHeader
          title="Protocol Teams Performance Analytics"
          subtitle="Loading analytics data..."
          backHref="/bishop"
          actions={[
            {
              label: "Dashboard",
              href: "/bishop",
              variant: "outline",
              icon: <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            },
            {
              label: "Logout",
              onClick: handleLogout,
              variant: "outline",
              className: "border-blue-300 text-blue-100 bg-blue-600/20 hover:bg-blue-600/30",
              icon: <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
            }
          ]}
        />

                {/* Optimized Skeleton Loading */}
                <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
                  {/* Overview Cards Skeleton */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 mb-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <UltraFastCardSkeleton key={i} />
                    ))}
                  </div>

                  {/* Chart Skeleton */}
                  <div className="mb-6">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md text-center">
          <strong>Error:</strong> {error}
          <button 
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!data || data.churchStats.totalTeams === 0) {
    return (
      <div className="min-h-screen bg-blue-300">
        <ProfessionalHeader
          title="Protocol Teams Performance Analytics"
          subtitle="Analytics will appear once protocol teams are created"
          backHref="/bishop"
          actions={[
            {
              label: "Create Protocol Teams",
              href: "/bishop/protocol-teams",
              variant: "default",
              icon: <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            },
            {
              label: "Dashboard",
              href: "/bishop",
              variant: "outline",
              icon: <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            },
            {
              label: "Logout",
              onClick: handleLogout,
              variant: "outline",
              className: "border-blue-300 text-blue-100 bg-blue-600/20 hover:bg-blue-600/30",
              icon: <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
            }
          ]}
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <div className="bg-blue-200/90 backdrop-blur-md border border-blue-300 rounded-lg shadow-sm p-6 sm:p-8">
            <div className="text-center">
              <div className="mb-6">
                <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-blue-900 mb-2">No Protocol Teams Yet</h2>
                <p className="text-blue-700 mb-6">
                  Protocol teams analytics will be available once you create your first protocol team and start managing visitors.
                </p>
              </div>
              
              <div className="space-y-4">
                <Link href="/bishop/protocol-teams">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3">
                    <Users className="h-5 w-5 mr-2" />
                    Create Protocol Teams
                  </Button>
                </Link>
                
                <div className="text-sm text-blue-600">
                  <p>Protocol teams help manage visitors and track their journey from first visit to membership.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const selectedTeamData = selectedTeam ? data.teamAnalytics.find(t => t.teamId === selectedTeam) : data.teamAnalytics[0]
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

  const getTrendIcon = (direction: string, trend: number) => {
    if (direction === 'growing') return <ArrowUp className="h-4 w-4 text-green-500" />
    if (direction === 'declining') return <ArrowDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getTrendColor = (direction: string) => {
    if (direction === 'growing') return 'text-green-600 bg-green-50 border-green-200'
    if (direction === 'declining') return 'text-red-600 bg-red-50 border-red-200'
    return 'text-blue-600 bg-gray-50 border-gray-200'
  }

  return (
    <div className="min-h-screen bg-blue-300">
      <ProfessionalHeader
        title="Protocol Teams Performance Analytics"
        subtitle={`Comprehensive analysis of ${data.churchStats.totalTeams} protocol teams managing ${data.churchStats.totalVisitors} visitors`}
        backHref="/bishop"
        actions={[
          {
            label: "Dashboard",
            href: "/bishop",
            variant: "outline",
            icon: <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
          },
          {
            label: "Logout",
            onClick: handleLogout,
            variant: "outline",
            className: "border-blue-300 text-blue-100 bg-blue-600/20 hover:bg-blue-600/30",
            icon: <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
          }
        ]}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 overflow-x-hidden">
        
        {/* Church-wide Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 mb-6">
          <div className="bg-blue-200/90 backdrop-blur-md border border-blue-300 rounded-lg shadow-sm p-2 sm:p-3 md:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-blue-600" />
              </div>
              <div className="ml-1 sm:ml-2 md:ml-3 lg:ml-4">
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Protocol Teams</p>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-blue-800">{data.churchStats.totalTeams}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-200/90 backdrop-blur-md border border-blue-300 rounded-lg shadow-sm p-2 sm:p-3 md:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-blue-600" />
              </div>
              <div className="ml-1 sm:ml-2 md:ml-3 lg:ml-4">
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Total Visitors</p>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-blue-800">{data.churchStats.totalVisitors}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-200/90 backdrop-blur-md border border-blue-300 rounded-lg shadow-sm p-2 sm:p-3 md:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-blue-600" />
              </div>
              <div className="ml-1 sm:ml-2 md:ml-3 lg:ml-4">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Conversions</p>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-blue-900">{data.churchStats.totalConversions}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-200/90 backdrop-blur-md border border-blue-300 rounded-lg shadow-sm p-2 sm:p-3 md:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-blue-600" />
              </div>
              <div className="ml-1 sm:ml-2 md:ml-3 lg:ml-4">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Avg Conversion</p>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-blue-900">{data.churchStats.averageConversionRate}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-200/90 backdrop-blur-md border border-blue-300 rounded-lg shadow-sm p-2 sm:p-3 md:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-blue-600" />
              </div>
              <div className="ml-1 sm:ml-2 md:ml-3 lg:ml-4">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Need Attention</p>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-blue-900">{data.insights.teamsNeedingAttention}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-200/90 backdrop-blur-md border border-blue-300 rounded-lg shadow-sm p-2 sm:p-3 md:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-blue-600" />
              </div>
              <div className="ml-1 sm:ml-2 md:ml-3 lg:ml-4">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Active Visitors</p>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-blue-900">{data.insights.totalActiveVisitors}</p>
              </div>
            </div>
          </div>
        </div>

                {/* Church-wide Growth Chart - Mobile Optimized */}
                <div className="bg-blue-200/90 backdrop-blur-md border border-blue-300 rounded-lg shadow-sm p-3 sm:p-4 md:p-6 mb-6">
                  <h3 className="text-sm sm:text-base md:text-lg font-medium text-blue-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              Church-wide Visitor Growth Trend
                  </h3>
                  <div className="overflow-hidden">
                    <Suspense fallback={<div className="h-48 sm:h-56 md:h-64 bg-gray-200 animate-pulse rounded" />}>
                      <div className="h-48 sm:h-56 md:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart 
                            data={data.churchGrowth}
                            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="2 2" stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="month" 
                              fontSize={10}
                              tick={{ fontSize: 10 }}
                              className="sm:text-xs md:text-sm"
                            />
                            <YAxis 
                              fontSize={10}
                              tick={{ fontSize: 10 }}
                              className="sm:text-xs md:text-sm"
                            />
                            <Tooltip 
                              contentStyle={{
                                fontSize: 12,
                                padding: 8,
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px'
                              }}
                            />
                            <Legend 
                              wrapperStyle={{
                                fontSize: 10,
                                paddingTop: 8
                              }}
                              className="text-xs sm:text-sm"
                            />
                            {/* Simplified chart - only show most important metrics */}
                            <Area 
                              type="monotone" 
                              dataKey="totalVisitors" 
                              fill="#3B82F6" 
                              fillOpacity={0.2} 
                              stroke="#3B82F6" 
                              strokeWidth={1.5} 
                              name="Total Visitors" 
                            />
                            <Bar 
                              dataKey="joining" 
                              fill="#10B981" 
                              name="Joining" 
                              radius={[2, 2, 0, 0]}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="conversions" 
                              stroke="#8B5CF6" 
                              strokeWidth={2} 
                              name="Conversions"
                              dot={{ r: 3 }}
                            />
              </ComposedChart>
            </ResponsiveContainer>
                      </div>
                    </Suspense>
                  </div>
                </div>

        {/* Team Rankings */}
        <div className="bg-blue-200/90 backdrop-blur-md border border-blue-300 rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <h3 className="text-sm sm:text-base md:text-lg font-medium text-blue-900 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
              Protocol Team Performance Rankings
          </h3>
            <div className="space-y-3">
              {data.teamRankings.map((team, index) => (
                <div 
                  key={team.teamId}
                  className={`animate-fade-in p-3 sm:p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedTeam === team.teamId 
                    ? 'bg-gray-50 border-gray-300 shadow-md' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTeam(team.teamId)}
                >
                <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 xs:gap-3">
                  <div className="flex items-center gap-2 xs:gap-3">
                    <div className={`flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full font-bold text-xs sm:text-sm ${
                      team.rank === 1 ? 'bg-gray-100 text-blue-800' :
                      team.rank === 2 ? 'bg-gray-100 text-blue-800' :
                      team.rank === 3 ? 'bg-gray-100 text-blue-800' :
                      'bg-gray-100 text-blue-800'
                    }`}>
                      {team.rank === 1 && <Crown className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />}
                        {team.rank !== 1 && team.rank}
                      </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-blue-900 text-sm sm:text-base truncate">{team.teamName}</h4>
                      <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 text-xs sm:text-sm">
                          <span className="text-blue-600">{team.totalVisitors} visitors</span>
                        <span className="hidden xs:inline text-gray-400">•</span>
                        <span className="text-blue-600">{team.conversionRate}% conversion</span>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getTrendColor(team.trendDirection)}`}>
                            {getTrendIcon(team.trendDirection, team.growthTrend)}
                            {team.growthTrend.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  <div className="text-left xs:text-right">
                    <div className="text-sm xs:text-base sm:text-lg font-bold text-blue-900">{team.performanceScore}</div>
                      <div className="text-xs text-blue-600">Performance Score</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </div>

        {/* Selected Team Detailed Analysis */}
        {selectedTeamData && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                    {/* Team Growth Chart - Mobile Optimized */}
                    <div className="bg-blue-200/90 backdrop-blur-md border border-blue-300 rounded-lg shadow-sm p-3 sm:p-4 md:p-6">
                      <h3 className="text-sm sm:text-base md:text-lg font-medium text-blue-900 mb-3 sm:mb-4 flex items-center gap-2">
                        <LineChart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        <span className="truncate">{selectedTeamData.teamName} - Growth</span>
                      </h3>
                      <div className="overflow-hidden">
                        <Suspense fallback={<div className="h-48 sm:h-56 md:h-64 bg-gray-200 animate-pulse rounded" />}>
                          <div className="h-48 sm:h-56 md:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart 
                                data={selectedTeamData.growth.monthlyGrowth}
                                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                              >
                                <CartesianGrid strokeDasharray="2 2" stroke="#e5e7eb" />
                                <XAxis 
                                  dataKey="month" 
                                  fontSize={10}
                                  tick={{ fontSize: 10 }}
                                />
                                <YAxis 
                                  fontSize={10}
                                  tick={{ fontSize: 10 }}
                                />
                                <Tooltip 
                                  contentStyle={{
                                    fontSize: 12,
                                    padding: 8,
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px'
                                  }}
                                />
                                <Legend 
                                  wrapperStyle={{
                                    fontSize: 10,
                                    paddingTop: 8
                                  }}
                                />
                                {/* Simplified - only show key metrics */}
                                <Area 
                                  type="monotone" 
                                  dataKey="totalVisitors" 
                                  fill="#3B82F6" 
                                  fillOpacity={0.3} 
                                  stroke="#3B82F6" 
                                  strokeWidth={1.5} 
                                  name="New Visitors" 
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="conversions" 
                                  fill="#8B5CF6" 
                                  fillOpacity={0.5} 
                                  stroke="#8B5CF6" 
                                  strokeWidth={1.5} 
                                  name="Conversions" 
                                />
                  </AreaChart>
                </ResponsiveContainer>
                          </div>
                        </Suspense>
                      </div>
                    </div>

            {/* Team Member Performance - Mobile Optimized */}
            <div className="bg-blue-200/90 backdrop-blur-md border border-blue-300 rounded-lg shadow-sm p-3 sm:p-4 md:p-6">
              <h3 className="text-sm sm:text-base md:text-lg font-medium text-blue-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                Team Performance
              </h3>
              <div>
                <Suspense fallback={<div className="h-48 sm:h-56 md:h-64 bg-gray-200 animate-pulse rounded" />}>
                  <div className="h-48 sm:h-56 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={selectedTeamData.memberPerformance}
                        margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="2 2" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="name" 
                          fontSize={10}
                          tick={{ fontSize: 10 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          fontSize={10}
                          tick={{ fontSize: 10 }}
                        />
                        <Tooltip 
                          contentStyle={{
                            fontSize: 12,
                            padding: 8,
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px'
                          }}
                        />
                        <Legend 
                          wrapperStyle={{
                            fontSize: 10,
                            paddingTop: 8
                          }}
                        />
                        <Bar 
                          dataKey="assignedVisitors" 
                          fill="#3B82F6" 
                          name="Assigned" 
                          radius={[2, 2, 0, 0]}
                        />
                        <Bar 
                          dataKey="conversions" 
                          fill="#10B981" 
                          name="Conversions" 
                          radius={[2, 2, 0, 0]}
                        />
                  </BarChart>
                </ResponsiveContainer>
                  </div>
                </Suspense>
              </div>
            </div>
          </div>
        )}

        {/* Performance Insights */}
        <div className="bg-blue-200/90 backdrop-blur-md border border-blue-300 rounded-lg shadow-sm p-4 sm:p-6">
          <h3 className="text-sm sm:text-base md:text-lg font-medium text-blue-900 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
              Performance Insights & Recommendations
          </h3>
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {data.insights.fastestGrowingTeam && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Fastest Growing Team</h4>
                  </div>
                  <p className="text-blue-700 font-medium">{data.insights.fastestGrowingTeam.teamName}</p>
                  <p className="text-sm text-blue-600">Growth: +{data.insights.fastestGrowingTeam.growthTrend.toFixed(1)}%</p>
                </div>
              )}
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Highest Conversion Rate</h4>
                </div>
                <p className="text-blue-700 font-medium">{data.insights.highestConversionTeam.teamName}</p>
                <p className="text-sm text-blue-600">Conversion: {data.insights.highestConversionTeam.conversionRate}%</p>
              </div>
              
              {data.insights.teamsNeedingAttention > 0 && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <h4 className="font-medium text-red-800">Teams Needing Attention</h4>
                  </div>
                  <p className="text-red-700 font-medium">{data.insights.teamsNeedingAttention} teams</p>
                  <p className="text-sm text-red-600">Require support or intervention</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-medium text-blue-900 mb-2">Key Recommendations:</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Focus on teams with declining growth trends for additional support</li>
                <li>• Share best practices from high-performing teams across all protocol teams</li>
                <li>• Consider additional training for teams with low conversion rates</li>
                <li>• Monitor active visitors regularly to prevent drop-offs</li>
                <li>• Celebrate and recognize top-performing teams to maintain motivation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
