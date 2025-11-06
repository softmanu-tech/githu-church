"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';
import { useAlerts } from "@/components/ui/alert-system"
import { ProfessionalHeader } from "@/components/ProfessionalHeader"
import Link from "next/link"
import { useParams } from "next/navigation"

import { format } from "date-fns"
import {
  ArrowLeft,
  Target,
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
  Award,
  LogOut,
  MessageSquare,
  Star,
  Users,
  BookOpen,
  Home,
  UserCheck,
  Heart,
  X
} from "lucide-react"

interface Milestone {
  week: number
  completed: boolean
  notes?: string
  protocolMemberNotes?: string
  completedDate?: string
}

interface Visitor {
  _id: string
  name: string
  email: string
  status: string
  monitoringStatus?: string
  monitoringStartDate?: string
  monitoringEndDate?: string
  daysRemaining?: number
  milestones: Milestone[]
  integrationChecklist?: {
    welcomePackage: boolean
    homeVisit: boolean
    smallGroupIntro: boolean
    ministryOpportunities: boolean
    mentorAssigned: boolean
    regularCheckIns: boolean
  }
}

const milestoneTitles = {
  1: "Welcome & Orientation",
  2: "First Follow-up Call",
  3: "Church Tour",
  4: "Meet Small Group Leader",
  5: "Attend Small Group",
  6: "Ministry Introduction",
  7: "Volunteer Opportunity",
  8: "Mentor Assignment",
  9: "Regular Check-ins",
  10: "Integration Assessment",
  11: "Final Review",
  12: "Conversion Decision"
}

const milestoneDescriptions = {
  1: "Welcome visitor and provide orientation materials",
  2: "Make first follow-up phone call within 48 hours",
  3: "Schedule and conduct church facility tour",
  4: "Introduce visitor to small group leader",
  5: "Encourage attendance at small group meeting",
  6: "Introduce visitor to ministry opportunities",
  7: "Invite visitor to volunteer in a ministry",
  8: "Assign a mentor for ongoing support",
  9: "Conduct regular check-in meetings",
  10: "Assess visitor's integration progress",
  11: "Conduct final review of 3-month journey",
  12: "Support visitor in making conversion decision"
}

export default function MilestoneTrackingPage() {
  const params = useParams()
  const alerts = useAlerts()
  const [visitor, setVisitor] = useState<Visitor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null)
  const [milestoneNotes, setMilestoneNotes] = useState('')

  const fetchVisitorMilestones = async () => {
    try {
      setLoading(true)
      const visitorId = params.visitorId as string
      if (!visitorId) {
        throw new Error("Visitor ID not found")
      }
      const response = await fetch(`/api/protocol/visitors/${visitorId}/milestones`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch visitor milestones")
      }

      const result = await response.json()
      if (result.success) {
        setVisitor(result.data)
      } else {
        throw new Error(result.error || "Failed to fetch visitor milestones")
      }
    } catch (err) {
      console.error("Error fetching visitor milestones:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch visitor milestones")
    } finally {
      setLoading(false)
    }
  }

  const updateMilestone = async (week: number, completed: boolean, notes?: string) => {
    try {
      setUpdating(true)
      const visitorId = params.visitorId as string
      if (!visitorId) {
        throw new Error("Visitor ID not found")
      }
      const response = await fetch(`/api/protocol/visitors/${visitorId}/milestones`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({
          week,
          completed,
          notes: notes || '',
          protocolMemberNotes: notes || ''
        })
      })

      const result = await response.json()
      if (result.success) {
        // Update local state
        setVisitor(prev => {
          if (!prev) return prev
          const updatedMilestones = prev.milestones.map(m => 
            m.week === week ? { ...m, completed, notes, completedDate: completed ? new Date().toISOString() : undefined } : m
          )
          return { ...prev, milestones: updatedMilestones }
        })
        setSelectedMilestone(null)
        setMilestoneNotes('')
        alerts.success("Milestone Updated", `Week ${week} milestone ${completed ? 'completed' : 'marked as incomplete'}`)
      } else {
        alerts.error("Update Failed", result.error || "Failed to update milestone")
      }
    } catch (err) {
      alerts.error("Update Failed", "Failed to update milestone")
    } finally {
      setUpdating(false)
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
    if (params.visitorId) {
      fetchVisitorMilestones()
    }
  }, [params.visitorId])

  if (loading || !params.visitorId) {
    return (
      <div className="min-h-screen bg-blue-300">
        <ProfessionalHeader
          title="Milestone Tracking"
          subtitle="Loading visitor milestones..."
        />
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <UltraFastCardSkeleton key={i} />
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <UltraFastCardSkeleton />
            <UltraFastCardSkeleton />
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
            onClick={fetchVisitorMilestones}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!visitor) {
    return (
      <div className="min-h-screen bg-blue-300 flex items-center justify-center px-4">
        <div className="bg-blue-200/90 backdrop-blur-md rounded-lg p-6 border border-blue-300 text-center">
          <p className="text-blue-800">No visitor data available.</p>
          <Link href="/protocol">
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const completedMilestones = visitor.milestones.filter(m => m.completed).length
  const totalMilestones = visitor.milestones.length
  const progressPercentage = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

  const getMilestoneIcon = (week: number, completed: boolean) => {
    const icons = {
      1: <Users className="h-5 w-5" />,
      2: <MessageSquare className="h-5 w-5" />,
      3: <BookOpen className="h-5 w-5" />,
      4: <Users className="h-5 w-5" />,
      5: <Users className="h-5 w-5" />,
      6: <Award className="h-5 w-5" />,
      7: <Heart className="h-5 w-5" />,
      8: <UserCheck className="h-5 w-5" />,
      9: <MessageSquare className="h-5 w-5" />,
      10: <TrendingUp className="h-5 w-5" />,
      11: <CheckCircle className="h-5 w-5" />,
      12: <Star className="h-5 w-5" />
    }
    return icons[week as keyof typeof icons] || <Target className="h-5 w-5" />
  }

  return (
    <div className="min-h-screen bg-blue-300">
      <ProfessionalHeader
        title={`${visitor.name} - Milestone Tracking`}
        subtitle={`3-Month Integration Journey • ${progressPercentage}% Complete`}
        backHref={`/protocol/visitors/${visitor._id}`}
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

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-6">
        
        {/* Progress Overview */}
        <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Integration Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-800">{completedMilestones}</div>
                <div className="text-sm text-blue-600">Completed Milestones</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-800">{totalMilestones - completedMilestones}</div>
                <div className="text-sm text-blue-600">Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-800">{progressPercentage}%</div>
                <div className="text-sm text-blue-600">Overall Progress</div>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="w-full bg-blue-100 rounded-full h-4">
                <div 
                  className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {visitor.daysRemaining !== undefined && (
              <div className="mt-4 text-center">
                <div className="text-lg font-medium text-blue-800">
                  {visitor.daysRemaining} days remaining in monitoring period
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Milestones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visitor.milestones.map((milestone) => (
            <div 
              key={milestone.week}
              className="animate-fade-in"
            >
              <Card className={`${
                milestone.completed 
                  ? 'bg-green-50 border-green-300' 
                  : 'bg-white/80 border-blue-300'
              } hover:shadow-md transition-all duration-200`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        milestone.completed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {milestone.completed ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          getMilestoneIcon(milestone.week, milestone.completed)
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-blue-800">
                          Week {milestone.week}
                        </div>
                        <div className="text-sm text-blue-600">
                          {milestoneTitles[milestone.week as keyof typeof milestoneTitles]}
                        </div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      milestone.completed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {milestone.completed ? 'Completed' : 'Pending'}
                    </div>
                  </div>

                  <div className="text-sm text-blue-700 mb-4">
                    {milestoneDescriptions[milestone.week as keyof typeof milestoneDescriptions]}
                  </div>

                  {milestone.completed && milestone.completedDate && (
                    <div className="text-xs text-green-600 mb-3">
                      Completed: {format(new Date(milestone.completedDate), "MMM dd, yyyy")}
                    </div>
                  )}

                  {milestone.notes && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mb-3">
                      <strong>Notes:</strong> {milestone.notes}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!milestone.completed ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedMilestone(milestone.week)
                          setMilestoneNotes(milestone.notes || '')
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        disabled={updating}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedMilestone(milestone.week)
                          setMilestoneNotes(milestone.notes || '')
                        }}
                        className="border-blue-300 text-blue-800 hover:bg-blue-100 text-xs"
                        disabled={updating}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Add Notes
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Integration Checklist */}
        {visitor.integrationChecklist && (
          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Integration Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(visitor.integrationChecklist).map(([key, completed]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-white/80 rounded-lg border border-blue-200">
                    <span className="text-blue-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {completed ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Milestone Update Modal */}
      {selectedMilestone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-800">
                  Week {selectedMilestone} - {milestoneTitles[selectedMilestone as keyof typeof milestoneTitles]}
                </h3>
                <Button
                  onClick={() => {
                    setSelectedMilestone(null)
                    setMilestoneNotes('')
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-blue-800 hover:bg-blue-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={milestoneNotes}
                    onChange={(e) => setMilestoneNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800"
                    rows={3}
                    placeholder="Add any notes about this milestone..."
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => selectedMilestone && updateMilestone(selectedMilestone, true, milestoneNotes)}
                    disabled={updating}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {updating ? 'Updating...' : 'Mark Complete'}
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedMilestone(null)
                      setMilestoneNotes('')
                    }}
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
