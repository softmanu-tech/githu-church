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
  TrendingDown,
  TrendingUp,
  Award,
  AlertTriangle,
  Users,
  BookOpen,
  Eye,
  Crown,
  Send,
  CheckCircle,
  Clock,
  Target,
  Star,
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  ArrowLeft,
  Settings,
  LogOut
} from "lucide-react"

interface TeamMetrics {
  totalVisitors: number
  joiningVisitors: number
  convertedMembers: number
  activeVisitors: number
  conversionRate: number
  growthTrend: number
  trendDirection: string
  visitorsAtRisk: number
}

interface TeamAnalysis {
  teamId: string
  teamName: string
  leader: string
  metrics: TeamMetrics
}

interface SupportAction {
  teamId: string
  teamName: string
  leaderName: string
  leaderEmail: string
  issue?: string
  growthTrend?: number
  conversionRate?: number
  joiningVisitors?: number
  visitorsAtRisk?: number
  recommendedActions: string[]
  priority: string
}

interface BestPractice {
  teamId: string
  teamName: string
  leaderName: string
  conversionRate: number
  growthTrend: number
  successFactors: string[]
  shareableInsights: string[]
}

interface Recognition {
  rank: number
  teamId: string
  teamName: string
  leaderName: string
  achievements: {
    conversionRate: number
    growthTrend: number
    totalVisitors: number
    activeVisitors: number
  }
  recognitionType: string
  suggestedRewards: string[]
}

interface SupportData {
  summary: {
    totalTeams: number
    teamsNeedingSupport: number
    highPerformingTeams: number
    teamsNeedingTraining: number
    totalVisitorsAtRisk: number
    teamsWithRiskyVisitors: number
    averageConversionRate: number
    teamsGrowing: number
    teamsStable: number
    teamsdeclining: number
  }
  actionItems: {
    supportActions: SupportAction[]
    bestPractices: BestPractice[]
    trainingNeeds: SupportAction[]
    monitoringAlerts: SupportAction[]
    recognition: Recognition[]
  }
  teamAnalysis: TeamAnalysis[]
}

export default function ProtocolSupportPage() {
  const alerts = useAlerts()
  const [data, setData] = useState<SupportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'support' | 'practices' | 'training' | 'monitoring' | 'recognition'>('support')
  const [sendingAction, setSendingAction] = useState<string | null>(null)

  const fetchSupportData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/bishop/protocol-teams/support-system', {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch support data")
      }

      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || "Failed to fetch support data")
      }
    } catch (err) {
      console.error("Error fetching support data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch support data")
    } finally {
      setLoading(false)
    }
  }

  const sendSupportAction = async (actionType: string, teamId: string, message: string, priority: string = 'Medium') => {
    try {
      setSendingAction(teamId)
      const response = await fetch('/api/bishop/protocol-teams/support-system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({
          actionType,
          teamId,
          message,
          priority
        })
      })

      const result = await response.json()
      if (result.success) {
        alerts.success("Action Sent", `${actionType} sent to ${result.data.teamName} leader`)
      } else {
        alerts.error("Action Failed", result.error || "Failed to send support action")
      }
    } catch (err) {
      alerts.error("Action Failed", "Failed to send support action")
    } finally {
      setSendingAction(null)
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
    fetchSupportData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-300">
        <ProfessionalHeader
          title="Protocol Team Support System"
          subtitle="Loading support system..."
        />
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <UltraFastCardSkeleton key={i} />
            ))}
          </div>

          {/* Support Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <UltraFastCardSkeleton />
            <UltraFastCardSkeleton />
          </div>

          {/* Support Table Skeleton */}
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
            onClick={fetchSupportData}
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
          <p className="text-blue-800">No support data available.</p>
        </div>
      </div>
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200'
      case 'Medium': return 'text-orange-600 bg-orange-50 border-orange-200'
      default: return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="min-h-screen bg-blue-300">
      <ProfessionalHeader
        title="Protocol Team Support System"
        subtitle="Manage declining teams, share best practices, and provide training support"
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-2 sm:py-4 md:py-6 space-y-2 sm:space-y-4 md:space-y-6">
        
        {/* Summary Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 sm:gap-2 md:gap-3">
          <Card className="bg-red-100 border border-red-300">
            <CardContent className="p-1 sm:p-2 md:p-3 text-center">
              <div className="text-sm sm:text-lg md:text-xl font-bold text-red-800">{data.summary.teamsNeedingSupport}</div>
              <div className="text-xs text-red-600">Need Support</div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-100 border border-green-300">
            <CardContent className="p-1 sm:p-2 md:p-3 text-center">
              <div className="text-sm sm:text-lg md:text-xl font-bold text-green-800">{data.summary.highPerformingTeams}</div>
              <div className="text-xs text-green-600">High Performing</div>
            </CardContent>
          </Card>
          
          <Card className="bg-orange-100 border border-orange-300">
            <CardContent className="p-1 sm:p-2 md:p-3 text-center">
              <div className="text-sm sm:text-lg md:text-xl font-bold text-orange-800">{data.summary.teamsNeedingTraining}</div>
              <div className="text-xs text-orange-600">Need Training</div>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-100 border border-purple-300">
            <CardContent className="p-1 sm:p-2 md:p-3 text-center">
              <div className="text-sm sm:text-lg md:text-xl font-bold text-purple-800">{data.summary.totalVisitorsAtRisk}</div>
              <div className="text-xs text-purple-600">Visitors At Risk</div>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-100 border border-yellow-300">
            <CardContent className="p-1 sm:p-2 md:p-3 text-center">
              <div className="text-sm sm:text-lg md:text-xl font-bold text-blue-800">{data.summary.averageConversionRate}%</div>
              <div className="text-xs text-blue-600">Avg Conversion</div>
            </CardContent>
          </Card>
          
          <Card className="bg-teal-100 border border-teal-300">
            <CardContent className="p-1 sm:p-2 md:p-3 text-center">
              <div className="text-sm sm:text-lg md:text-xl font-bold text-teal-800">{data.summary.teamsGrowing}</div>
              <div className="text-xs text-teal-600">Growing Teams</div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 sm:gap-2 bg-blue-200/90 backdrop-blur-md rounded-lg p-1 sm:p-2 border border-blue-300 overflow-x-auto">
          <Button
            variant={activeTab === 'support' ? 'default' : 'ghost'}
            className={`flex-shrink-0 min-w-16 sm:flex-1 text-xs sm:text-sm px-1 sm:px-2 md:px-3 py-1 sm:py-2 ${activeTab === 'support' ? 'bg-red-600 text-white' : 'text-blue-800 hover:bg-blue-100'}`}
            onClick={() => setActiveTab('support')}
          >
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1 md:mr-2 flex-shrink-0" />
            <span className="hidden sm:block truncate">Declining Teams</span>
          </Button>
          <Button
            variant={activeTab === 'practices' ? 'default' : 'ghost'}
            className={`flex-shrink-0 min-w-16 sm:flex-1 text-xs sm:text-sm px-1 sm:px-2 md:px-3 py-1 sm:py-2 ${activeTab === 'practices' ? 'bg-green-600 text-white' : 'text-blue-800 hover:bg-blue-100'}`}
            onClick={() => setActiveTab('practices')}
          >
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1 md:mr-2 flex-shrink-0" />
            <span className="hidden sm:block truncate">Best Practices</span>
          </Button>
          <Button
            variant={activeTab === 'training' ? 'default' : 'ghost'}
            className={`flex-shrink-0 min-w-16 sm:flex-1 text-xs sm:text-sm px-1 sm:px-2 md:px-3 py-1 sm:py-2 ${activeTab === 'training' ? 'bg-orange-600 text-white' : 'text-blue-800 hover:bg-blue-100'}`}
            onClick={() => setActiveTab('training')}
          >
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1 md:mr-2 flex-shrink-0" />
            <span className="hidden sm:block truncate">Training Needs</span>
          </Button>
          <Button
            variant={activeTab === 'monitoring' ? 'default' : 'ghost'}
            className={`flex-shrink-0 min-w-16 sm:flex-1 text-xs sm:text-sm px-1 sm:px-2 md:px-3 py-1 sm:py-2 ${activeTab === 'monitoring' ? 'bg-purple-600 text-white' : 'text-blue-800 hover:bg-blue-100'}`}
            onClick={() => setActiveTab('monitoring')}
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1 md:mr-2 flex-shrink-0" />
            <span className="hidden sm:block truncate">Visitor Monitoring</span>
          </Button>
          <Button
            variant={activeTab === 'recognition' ? 'default' : 'ghost'}
            className={`flex-shrink-0 min-w-16 sm:flex-1 text-xs sm:text-sm px-1 sm:px-2 md:px-3 py-1 sm:py-2 ${activeTab === 'recognition' ? 'bg-yellow-600 text-white' : 'text-blue-800 hover:bg-blue-100'}`}
            onClick={() => setActiveTab('recognition')}
          >
            <Crown className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1 md:mr-2 flex-shrink-0" />
            <span className="hidden sm:block truncate">Recognition</span>
          </Button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4 sm:space-y-6">
          
          {/* 1. TEAMS NEEDING SUPPORT (Declining Growth) */}
          {activeTab === 'support' && (
            <div className="animate-fade-in">
              <Card className="bg-red-50 border border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-800 flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    Teams with Declining Growth Trends ({data.actionItems.supportActions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.actionItems.supportActions.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-green-700 font-medium">Excellent! No teams currently have declining growth trends.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.actionItems.supportActions.map((action) => (
                        <div key={action.teamId} className="bg-white p-4 rounded-lg border border-red-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-medium text-red-800">{action.teamName}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(action.priority)}`}>
                                  {action.priority} Priority
                                </span>
                              </div>
                              <p className="text-sm text-red-600 mb-2">
                                Leader: {action.leaderName} ({action.leaderEmail})
                              </p>
                              <p className="text-sm text-red-700 mb-3">
                                Growth Trend: {action.growthTrend?.toFixed(1)}% decline
                              </p>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-red-800">Recommended Actions:</p>
                                {action.recommendedActions.map((actionItem, index) => (
                                  <p key={index} className="text-xs text-red-600">• {actionItem}</p>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                disabled={sendingAction === action.teamId}
                                onClick={() => sendSupportAction(
                                  'Support Request',
                                  action.teamId,
                                  `Your protocol team has shown a declining growth trend (${action.growthTrend?.toFixed(1)}% decline). I'd like to schedule a meeting to discuss strategies for improvement and provide additional support.`,
                                  action.priority
                                )}
                              >
                                {sendingAction === action.teamId ? (
                                  <Clock className="h-4 w-4" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                                <span className="ml-1">Send Support</span>
                              </Button>
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

          {/* 2. BEST PRACTICES FROM HIGH-PERFORMING TEAMS */}
          {activeTab === 'practices' && (
            <div className="animate-fade-in">
              <Card className="bg-green-50 border border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Best Practices from High-Performing Teams ({data.actionItems.bestPractices.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[500px] overflow-y-auto">
                  <div className="space-y-4">
                    {data.actionItems.bestPractices.map((practice) => (
                      <div key={practice.teamId} className="bg-white p-3 sm:p-4 md:p-5 rounded-lg border border-green-200 shadow-sm">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          
                          {/* Team Information */}
                          <div className="flex-1 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-green-800 text-sm sm:text-base truncate">{practice.teamName}</h4>
                                <p className="text-xs sm:text-sm text-green-600">
                                  Leader: {practice.leaderName}
                                </p>
                              </div>
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex-shrink-0">
                                {practice.conversionRate}% Conversion Rate
                              </span>
                            </div>
                            
                            {/* Success Factors and Insights */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                              <div className="bg-green-50/50 p-3 rounded border border-green-200">
                                <p className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                                  <Star className="h-4 w-4" />
                                  Success Factors:
                                </p>
                                <div className="space-y-1">
                                  {practice.successFactors.map((factor, index) => (
                                    <p key={index} className="text-xs text-green-600 flex items-start gap-1">
                                      <span className="text-green-500 flex-shrink-0">•</span>
                                      <span className="flex-1">{factor}</span>
                                    </p>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="bg-green-50/50 p-3 rounded border border-green-200">
                                <p className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                                  <Target className="h-4 w-4" />
                                  Key Insights:
                                </p>
                                <div className="space-y-1">
                                  {practice.shareableInsights.map((insight, index) => (
                                    <p key={index} className="text-xs text-green-600 flex items-start gap-1">
                                      <span className="text-green-500 flex-shrink-0">•</span>
                                      <span className="flex-1">{insight}</span>
                                    </p>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Request Share Button */}
                          <div className="flex-shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto lg:w-full px-3 py-2 text-xs sm:text-sm"
                              disabled={sendingAction === practice.teamId}
                              onClick={() => sendSupportAction(
                                'Best Practice Share',
                                practice.teamId,
                                `Your protocol team has been identified as a high-performing team with excellent results. Would you be willing to share your successful strategies with other teams during our next protocol leaders meeting?`,
                                'Medium'
                              )}
                            >
                              {sendingAction === practice.teamId ? (
                                <div className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border border-white border-t-transparent rounded-full mr-1 sm:mr-2" />
                              ) : (
                                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              )}
                              <span className="truncate">Request Share</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 3. TRAINING NEEDS (Low Conversion Rates) */}
          {activeTab === 'training' && (
            <div className="animate-fade-in">
              <Card className="bg-orange-50 border border-orange-200">
                <CardHeader>
                  <CardTitle className="text-orange-800 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Teams Needing Additional Training ({data.actionItems.trainingNeeds.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.actionItems.trainingNeeds.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-green-700 font-medium">Great! All teams have adequate conversion rates.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.actionItems.trainingNeeds.map((training) => (
                        <div key={training.teamId} className="bg-white p-4 rounded-lg border border-orange-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-medium text-orange-800">{training.teamName}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(training.priority!)}`}>
                                  {training.priority} Priority
                                </span>
                              </div>
                              <p className="text-sm text-orange-600 mb-2">
                                Leader: {training.leaderName} ({training.leaderEmail})
                              </p>
                              <p className="text-sm text-orange-700 mb-3">
                                Conversion Rate: {training.conversionRate}% ({training.joiningVisitors} joining visitors)
                              </p>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-orange-800">Training Areas:</p>
                                {training.recommendedActions.map((area, index) => (
                                  <p key={index} className="text-xs text-orange-600">• {area}</p>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                                disabled={sendingAction === training.teamId}
                                onClick={() => sendSupportAction(
                                  'Training Recommendation',
                                  training.teamId,
                                  `Based on your team's current conversion rate of ${training.conversionRate}%, I'd like to offer additional training in visitor conversion techniques and relationship building. Let's schedule a training session to help improve your team's effectiveness.`,
                                  training.priority!
                                )}
                              >
                                <BookOpen className="h-4 w-4 mr-1" />
                                Schedule Training
                              </Button>
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

          {/* 4. VISITOR MONITORING ALERTS */}
          {activeTab === 'monitoring' && (
            <div className="animate-fade-in">
              <Card className="bg-purple-50 border border-purple-200">
                <CardHeader>
                  <CardTitle className="text-purple-800 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Active Visitor Monitoring Alerts ({data.actionItems.monitoringAlerts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.actionItems.monitoringAlerts.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-green-700 font-medium">Excellent! No visitors are currently at risk of dropping off.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.actionItems.monitoringAlerts.map((alert) => (
                        <div key={alert.teamId} className="bg-white p-4 rounded-lg border border-purple-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-medium text-purple-800">{alert.teamName}</h4>
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                  {alert.visitorsAtRisk} Visitors At Risk
                                </span>
                              </div>
                              <p className="text-sm text-purple-600 mb-3">
                                Leader: {alert.leaderName} ({alert.leaderEmail})
                              </p>
                              <div className="space-y-1 mb-3">
                                <p className="text-sm font-medium text-purple-800">Recommended Actions:</p>
                                {alert.recommendedActions.map((action, index) => (
                                  <p key={index} className="text-xs text-purple-600">• {action}</p>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                disabled={sendingAction === alert.teamId}
                                onClick={() => sendSupportAction(
                                  'Visitor Monitoring Alert',
                                  alert.teamId,
                                  `Urgent: Your team has ${alert.visitorsAtRisk} visitors approaching their 3-month monitoring deadline. Please prioritize follow-up meetings and conversion discussions with these visitors to prevent drop-offs.`,
                                  'High'
                                )}
                              >
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                Send Alert
                              </Button>
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

          {/* 5. RECOGNITION FOR TOP PERFORMERS */}
          {activeTab === 'recognition' && (
            <div className="animate-fade-in">
              <Card className="bg-blue-50 border border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    Top Performing Teams Recognition ({data.actionItems.recognition.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[500px] overflow-y-auto">
                  <div className="space-y-4">
                    {data.actionItems.recognition.map((recognition) => (
                      <div key={recognition.teamId} className="bg-white p-3 sm:p-4 md:p-5 rounded-lg border border-blue-200 shadow-sm">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          
                          {/* Team Header */}
                          <div className="flex-1 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-bold text-sm ${
                                  recognition.rank === 1 ? 'bg-blue-100 text-blue-800' :
                                  recognition.rank === 2 ? 'bg-blue-100 text-blue-700' :
                                  'bg-blue-100 text-blue-600'
                                }`}>
                                  {recognition.rank === 1 && <Crown className="h-4 w-4 sm:h-5 sm:w-5" />}
                                  {recognition.rank !== 1 && recognition.rank}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-medium text-blue-800 text-sm sm:text-base truncate">{recognition.teamName}</h4>
                                  <p className="text-xs sm:text-sm text-blue-600">
                                    Leader: {recognition.leaderName}
                                  </p>
                                </div>
                              </div>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex-shrink-0">
                                {recognition.recognitionType}
                              </span>
                            </div>
                            
                            {/* Performance Metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                              <div className="bg-blue-50 p-2 sm:p-3 rounded border border-yellow-200 text-center">
                                <div className="text-sm sm:text-lg font-bold text-blue-800">{recognition.achievements.conversionRate}%</div>
                                <div className="text-xs text-blue-600">Conversion Rate</div>
                              </div>
                              <div className="bg-blue-50 p-2 sm:p-3 rounded border border-yellow-200 text-center">
                                <div className="text-sm sm:text-lg font-bold text-blue-800">{recognition.achievements.totalVisitors}</div>
                                <div className="text-xs text-blue-600">Total Visitors</div>
                              </div>
                              <div className="bg-blue-50 p-2 sm:p-3 rounded border border-yellow-200 text-center">
                                <div className="text-sm sm:text-lg font-bold text-blue-800">{recognition.achievements.activeVisitors}</div>
                                <div className="text-xs text-blue-600">Active Visitors</div>
                              </div>
                              <div className="bg-blue-50 p-2 sm:p-3 rounded border border-yellow-200 text-center">
                                <div className="text-sm sm:text-lg font-bold text-blue-800">{recognition.achievements.growthTrend.toFixed(1)}%</div>
                                <div className="text-xs text-blue-600">Growth Trend</div>
                              </div>
                            </div>
                            
                            {/* Suggested Rewards */}
                            <div className="bg-blue-50/50 p-3 rounded border border-yellow-200">
                              <p className="text-sm font-medium text-blue-800 mb-2">Suggested Rewards:</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                {recognition.suggestedRewards.map((reward, index) => (
                                  <p key={index} className="text-xs text-blue-600 flex items-start gap-1">
                                    <span className="text-yellow-500 flex-shrink-0">•</span>
                                    <span className="flex-1">{reward}</span>
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Send Recognition Button */}
                          <div className="flex-shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2">
                            <Button
                              size="sm"
                              className="bg-yellow-600 hover:bg-yellow-700 text-white w-full sm:w-auto lg:w-full px-3 py-2 text-xs sm:text-sm"
                              disabled={sendingAction === recognition.teamId}
                              onClick={() => sendSupportAction(
                                'Recognition Award',
                                recognition.teamId,
                                `Congratulations! Your protocol team has been selected for the ${recognition.recognitionType} award based on your outstanding performance with ${recognition.achievements.conversionRate}% conversion rate and ${recognition.achievements.growthTrend.toFixed(1)}% growth. Your dedication and excellent work are truly appreciated!`,
                                'Medium'
                              )}
                            >
                              {sendingAction === recognition.teamId ? (
                                <div className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border border-white border-t-transparent rounded-full mr-1 sm:mr-2" />
                              ) : (
                                <Award className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              )}
                              <span className="truncate">Send Recognition</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
