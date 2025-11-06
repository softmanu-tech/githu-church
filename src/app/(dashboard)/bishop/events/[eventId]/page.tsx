"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';
import { useAlerts } from "@/components/ui/alert-system"
import { format } from "date-fns"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  User,
  MessageSquare,
  TrendingUp,
  UserCheck,
  UserX,
  Crown,
  Shield,
  LogOut
} from "lucide-react"
import { ProfessionalHeader } from "@/components/ProfessionalHeader"

interface Member {
  _id: string
  name: string
  email: string
  phone?: string
  residence?: string
  department?: string
}

interface EventResponse {
  _id: string
  member: Member
  willAttend: boolean
  reason?: string
  responseDate: string
}

interface EventDetails {
  _id: string
  title: string
  description?: string
  date: string
  location?: string
  group: {
    _id: string
    name: string
  }
  createdBy: {
    _id: string
    name: string
    email: string
  }
}

interface EventResponsesData {
  event: EventDetails
  responses: {
    attending: EventResponse[]
    notAttending: EventResponse[]
  }
  summary: {
    totalResponses: number
    attending: number
    notAttending: number
    responseRate: number
  }
}

export default function BishopEventDetailsPage() {
  const params = useParams()
  const eventId = params.eventId as string
  const alerts = useAlerts()
  
  const [data, setData] = useState<EventResponsesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEventResponses = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${eventId}/responses`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch event responses")
      }

      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || "Failed to fetch event responses")
      }
    } catch (err) {
      console.error("Error fetching event responses:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch event responses")
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
    if (eventId) {
      fetchEventResponses()
    }
  }, [eventId])

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-300">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold">Event Details</h1>
            <p className="text-blue-100 text-sm sm:text-base">Loading event information...</p>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Event Details Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <UltraFastCardSkeleton />
            <UltraFastCardSkeleton />
          </div>

          {/* Responses Table Skeleton */}
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
            onClick={fetchEventResponses}
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
          <p className="text-blue-800">No event data available.</p>
          <Link href="/bishop">
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const isUpcoming = new Date(data.event.date) > new Date()

  return (
    <div className="min-h-screen bg-blue-300">
      <ProfessionalHeader
        title={data.event.title}
        subtitle={`Bishop View - Event Details & Member Responses`}
        backHref="/bishop"
        actions={[
          {
            label: "View Events",
            href: "/bishop",
            variant: "outline",
            icon: <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
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
      <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-2 sm:py-4 md:py-6 space-y-4 sm:space-y-6">
        
        {/* Event Information */}
        <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg text-blue-800 flex items-center gap-2">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              Event Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">Event Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-700">{format(new Date(data.event.date), "PPPp")}</span>
                  </div>
                  {data.event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-700">{data.event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-700">{data.event.group.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-700">Created by {data.event.createdBy.name}</span>
                  </div>
                </div>
              </div>
              {data.event.description && (
                <div>
                  <h3 className="font-semibold text-blue-800 mb-2">Description</h3>
                  <p className="text-sm text-blue-700">{data.event.description}</p>
                </div>
              )}
            </div>
            
            {/* Response Summary */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-sm sm:text-base font-semibold text-blue-800 mb-2">Response Summary</h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="bg-green-100 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-xl sm:text-2xl font-bold text-green-800">{data.summary.attending}</div>
                  <div className="text-xs sm:text-sm text-green-600">Will Attend</div>
                </div>
                <div className="bg-red-100 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-xl sm:text-2xl font-bold text-red-800">{data.summary.notAttending}</div>
                  <div className="text-xs sm:text-sm text-red-600">Won't Attend</div>
                </div>
                <div className="bg-blue-100 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-lg sm:text-xl font-bold text-blue-800">{data.summary.totalResponses}</div>
                  <div className="text-xs sm:text-sm text-blue-600">Total Responses</div>
                </div>
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-sm sm:text-base font-semibold text-blue-800 mb-2">Engagement Metrics</h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="bg-purple-100 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-xl sm:text-2xl font-bold text-purple-800">
                    {data.summary.totalResponses > 0 
                      ? Math.round((data.summary.attending / data.summary.totalResponses) * 100)
                      : 0}%
                  </div>
                  <div className="text-xs sm:text-sm text-purple-600">Attendance Rate</div>
                </div>
                <div className="bg-indigo-100 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-lg sm:text-xl font-bold text-indigo-800">{data.summary.responseRate}%</div>
                  <div className="text-xs sm:text-sm text-indigo-600">Response Rate</div>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg text-center text-xs sm:text-sm ${
                  data.summary.attending >= data.summary.notAttending 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {data.summary.attending >= data.summary.notAttending 
                    ? '✅ Good Engagement' 
                    : '⚠️ Low Engagement'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Member Responses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Members Attending */}
          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-sm sm:text-base md:text-lg text-blue-800 flex items-center gap-2">
                <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                Confirmed Attendance ({data.summary.attending})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              {data.responses.attending.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                  <p className="text-blue-600">No confirmations yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
                  {data.responses.attending.map((response) => (
                    <div
                      key={response._id}
                      className="p-3 bg-green-50 rounded-lg border border-green-200 animate-fade-in"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-green-800">{response.member.name}</div>
                          <div className="text-sm text-green-600">{response.member.email}</div>
                          {response.member.phone && (
                            <div className="text-xs text-green-500">{response.member.phone}</div>
                          )}
                          {response.member.department && (
                            <div className="text-xs text-green-500">{response.member.department}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <CheckCircle className="h-5 w-5 text-green-600 mb-1" />
                          <div className="text-xs text-green-500">
                            {format(new Date(response.responseDate), "MMM dd, h:mm a")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Members Not Attending */}
          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-sm sm:text-base md:text-lg text-blue-800 flex items-center gap-2">
                <UserX className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                Apologies Received ({data.summary.notAttending})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              {data.responses.notAttending.length === 0 ? (
                <div className="text-center py-8">
                  <UserX className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                  <p className="text-blue-600">No apologies received</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
                  {data.responses.notAttending.map((response) => (
                    <div
                      key={response._id}
                      className="p-3 bg-red-50 rounded-lg border border-red-200 animate-fade-in"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-red-800">{response.member.name}</div>
                            <div className="text-sm text-red-600">{response.member.email}</div>
                            {response.member.department && (
                              <div className="text-xs text-red-500">{response.member.department}</div>
                            )}
                          </div>
                          <div className="text-right">
                            <XCircle className="h-5 w-5 text-red-600 mb-1" />
                            <div className="text-xs text-red-500">
                              {format(new Date(response.responseDate), "MMM dd, h:mm a")}
                            </div>
                          </div>
                        </div>
                        {response.reason && (
                          <div className="mt-2 p-3 bg-red-100 rounded border-l-4 border-red-400">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-xs font-medium text-red-700 mb-1">Reason:</div>
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
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 justify-center">
          <Link href="/bishop">
            <Button variant="outline" className="w-full sm:w-auto border-blue-300 text-blue-800 hover:bg-blue-50 px-3 sm:px-4 py-2 text-sm sm:text-base">
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/bishop/leaders">
            <Button variant="outline" className="w-full sm:w-auto border-blue-300 text-blue-800 hover:bg-blue-50 px-3 sm:px-4 py-2 text-sm sm:text-base">
              View Leaders
            </Button>
          </Link>
          <Link href="/bishop/groups">
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 text-sm sm:text-base">
              Manage Groups
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
