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
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  Star,
  MessageSquare,
  LogOut,
  Users,
  Award,
  AlertTriangle,
  BarChart3
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
  monitoringStatus?: string
  monitoringStartDate?: string
  monitoringEndDate?: string
  attendanceRate?: number
  monitoringProgress?: number
  daysRemaining?: number
  createdAt: string
  visitHistory?: Array<{
    date: string
    eventType: string
    notes?: string
    attendanceStatus: string
  }>
  suggestions?: Array<{
    date: string
    message: string
    category: string
  }>
  experiences?: Array<{
    date: string
    rating: number
    message: string
    eventType?: string
  }>
  milestones?: Array<{
    week: number
    completed: boolean
    notes?: string
    completedDate?: string
  }>
  integrationChecklist?: {
    welcomePackage: boolean
    homeVisit: boolean
    smallGroupIntro: boolean
    ministryOpportunities: boolean
    mentorAssigned: boolean
    regularCheckIns: boolean
  }
}

export default function VisitorDetailPage() {
  const params = useParams()
  const alerts = useAlerts()
  const [visitor, setVisitor] = useState<Visitor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVisitorDetails = async () => {
    try {
      setLoading(true)
      const visitorId = params.visitorId as string
      if (!visitorId) {
        throw new Error("Visitor ID not found")
      }
      const response = await fetch(`/api/protocol/visitors/${visitorId}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch visitor details")
      }

      const result = await response.json()
      if (result.success) {
        setVisitor(result.data)
      } else {
        throw new Error(result.error || "Failed to fetch visitor details")
      }
    } catch (err) {
      console.error("Error fetching visitor details:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch visitor details")
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
    if (params.visitorId) {
      fetchVisitorDetails()
    }
  }, [params.visitorId])

  if (loading || !params.visitorId) {
    return (
      <div className="min-h-screen bg-blue-300">
        <ProfessionalHeader
          title="Visitor Details"
          subtitle="Loading visitor information..."
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
            onClick={fetchVisitorDetails}
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'joining': return 'bg-blue-100 text-blue-800'
      case 'visiting': return 'bg-gray-100 text-gray-800'
      case 'converted': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMonitoringStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'converted-to-member': return 'bg-purple-100 text-purple-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-blue-300">
      <ProfessionalHeader
        title={`${visitor.name} - Visitor Details`}
        subtitle={`${visitor.type} • ${visitor.status} • Since ${format(new Date(visitor.createdAt), "MMM dd, yyyy")}`}
        backHref="/protocol"
        actions={[
          {
            label: "Back to Dashboard",
            href: "/protocol",
            variant: "outline",
            icon: <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
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

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-6">
        
        {/* Visitor Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Basic Information */}
          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700">{visitor.email}</span>
                </div>
                {visitor.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-700">{visitor.phone}</span>
                  </div>
                )}
                {visitor.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-700">{visitor.address}</span>
                  </div>
                )}
                {visitor.age && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-700">{visitor.age} years old</span>
                  </div>
                )}
                {visitor.occupation && (
                  <div className="text-blue-700">
                    <strong>Occupation:</strong> {visitor.occupation}
                  </div>
                )}
                {visitor.maritalStatus && (
                  <div className="text-blue-700">
                    <strong>Marital Status:</strong> {visitor.maritalStatus}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status & Progress */}
          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Status & Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <span className="text-blue-600 text-sm">Visitor Status:</span>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(visitor.status)}`}>
                      {visitor.status}
                    </span>
                  </div>
                </div>
                
                {visitor.monitoringStatus && (
                  <div>
                    <span className="text-blue-600 text-sm">Monitoring Status:</span>
                    <div className="mt-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getMonitoringStatusColor(visitor.monitoringStatus)}`}>
                        {visitor.monitoringStatus}
                      </span>
                    </div>
                  </div>
                )}

                {visitor.status === 'joining' && (
                  <>
                    <div>
                      <span className="text-blue-600 text-sm">Progress:</span>
                      <div className="mt-1">
                        <div className="text-lg font-bold text-blue-800">{visitor.monitoringProgress || 0}%</div>
                        <div className="w-full bg-blue-100 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${visitor.monitoringProgress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    {visitor.daysRemaining !== undefined && (
                      <div>
                        <span className="text-blue-600 text-sm">Days Remaining:</span>
                        <div className="text-lg font-bold text-blue-800">{visitor.daysRemaining}</div>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <span className="text-blue-600 text-sm">Attendance Rate:</span>
                  <div className="text-lg font-bold text-blue-800">{visitor.attendanceRate || 0}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <Award className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {visitor.status === 'joining' && (
                <Link href={`/protocol/visitors/${visitor._id}/milestones`}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <Target className="h-4 w-4 mr-2" />
                    Track Milestones
                  </Button>
                </Link>
              )}
              
              <Link href="/protocol/responsibilities">
                <Button variant="outline" className="w-full border-blue-300 text-blue-800 hover:bg-blue-100">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Manage Responsibilities
                </Button>
              </Link>
              
              <Button variant="outline" className="w-full border-green-300 text-green-800 hover:bg-green-100">
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Notes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Visit History */}
          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Visit History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {visitor.visitHistory && visitor.visitHistory.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
                  {visitor.visitHistory.map((visit, index) => (
                    <div key={index} className="bg-white/80 p-3 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-blue-800">{visit.eventType}</div>
                          <div className="text-sm text-blue-600">{format(new Date(visit.date), "MMM dd, yyyy")}</div>
                          {visit.notes && (
                            <div className="text-xs text-blue-500 mt-1">{visit.notes}</div>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          visit.attendanceStatus === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {visit.attendanceStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                  <p className="text-blue-600">No visit history recorded</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Integration Checklist */}
          {visitor.status === 'joining' && visitor.integrationChecklist && (
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Integration Checklist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(visitor.integrationChecklist).map(([key, completed]) => (
                    <div key={key} className="flex items-center justify-between">
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

        {/* Feedback & Experiences */}
        {(visitor.suggestions && visitor.suggestions.length > 0) || (visitor.experiences && visitor.experiences.length > 0) ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Suggestions */}
            {visitor.suggestions && visitor.suggestions.length > 0 && (
              <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Suggestions ({visitor.suggestions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
                    {visitor.suggestions.map((suggestion, index) => (
                      <div key={index} className="bg-white/80 p-3 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            {suggestion.category}
                          </span>
                          <span className="text-xs text-blue-500">
                            {format(new Date(suggestion.date), "MMM dd")}
                          </span>
                        </div>
                        <p className="text-sm text-blue-800">{suggestion.message}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Experiences */}
            {visitor.experiences && visitor.experiences.length > 0 && (
              <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Experiences ({visitor.experiences.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
                    {visitor.experiences.map((experience, index) => (
                      <div key={index} className="bg-white/80 p-3 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-3 w-3 ${
                                  i < experience.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                          <span className="text-xs text-blue-500">
                            {format(new Date(experience.date), "MMM dd")}
                          </span>
                        </div>
                        <p className="text-sm text-blue-800">{experience.message}</p>
                        {experience.eventType && (
                          <div className="text-xs text-blue-600 mt-1">
                            Event: {experience.eventType}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
