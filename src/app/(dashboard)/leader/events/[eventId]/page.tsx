"use client"

import React, { useState, useEffect } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';
import { useAlerts } from "@/components/ui/alert-system"
import { ProfessionalHeader } from "@/components/ProfessionalHeader"
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
  User,
  MessageSquare,
  TrendingUp,
  UserCheck,
  UserX
} from "lucide-react"

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

export default function EventDetailsPage() {
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

  useEffect(() => {
    if (eventId) {
      fetchEventResponses()
    }
  }, [eventId])

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-300">
        <ProfessionalHeader
          title="Event Details"
          subtitle="Loading event information..."
        />
        
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
      <div className="min-h-screen bg-blue-300">
        <ProfessionalHeader
          title="Event Details"
          subtitle="View event information and member responses"
          backHref="/leader/events"
        />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          <Card className="bg-red-200/90 backdrop-blur-md border border-red-300">
            <CardContent className="p-6 text-center">
              <strong className="text-red-800">Error:</strong> {error}
              <Button 
                onClick={fetchEventResponses}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-blue-300">
        <ProfessionalHeader
          title="Event Details"
          subtitle="View event information and member responses"
          backHref="/leader/events"
        />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardContent className="p-6 text-center">
              <p className="text-blue-800">No event data available.</p>
              <Link href="/leader/events">
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                  Back to Events
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isUpcoming = new Date(data.event.date) > new Date()

  return (
    <div className="min-h-screen bg-blue-300">
      <ProfessionalHeader
        title={data.event.title}
        subtitle="Event Details & Member Responses"
        backHref="/leader/events"
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-6">
        
        {/* Event Information */}
        <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-blue-800 flex items-center gap-2 text-lg sm:text-xl">
              <Calendar className="h-5 w-5" />
              Event Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">Event Details</h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800">{format(new Date(data.event.date), "PPPp")}</span>
                  </div>
                  {data.event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-800">{data.event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800">{data.event.group.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800">Created by {data.event.createdBy.name}</span>
                  </div>
                </div>
              </div>
              {data.event.description && (
                <div>
                  <h3 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">Description</h3>
                  <p className="text-xs sm:text-sm text-blue-700">{data.event.description}</p>
                </div>
              )}
            </div>
            
            {/* Response Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">Response Summary</h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-green-100 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-xl sm:text-2xl font-bold text-green-800">{data.summary.attending}</div>
                  <div className="text-xs sm:text-sm text-green-600">Attending</div>
                </div>
                <div className="bg-red-100 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-xl sm:text-2xl font-bold text-red-800">{data.summary.notAttending}</div>
                  <div className="text-xs sm:text-sm text-red-600">Not Attending</div>
                </div>
              </div>
              <div className="bg-blue-100 p-3 sm:p-4 rounded-lg text-center">
                <div className="text-lg sm:text-xl font-bold text-blue-800">{data.summary.totalResponses}</div>
                <div className="text-xs sm:text-sm text-blue-700">Total Responses</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Member Responses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Members Attending */}
          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-blue-800 flex items-center gap-2 text-sm sm:text-base">
                <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                Members Attending ({data.summary.attending})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {data.responses.attending.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <UserCheck className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-blue-400 mb-4" />
                  <p className="text-blue-700 text-sm sm:text-base">No confirmations yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data.responses.attending.map((response) => (
                    <div 
                      key={response._id}
                      className="animate-fade-in p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-green-800 text-sm sm:text-base">{response.member.name}</div>
                          <div className="text-xs sm:text-sm text-green-600">{response.member.email}</div>
                          {response.member.phone && (
                            <div className="text-xs text-green-500">{response.member.phone}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mb-1" />
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
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-blue-800 flex items-center gap-2 text-sm sm:text-base">
                <UserX className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                Members Not Attending ({data.summary.notAttending})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {data.responses.notAttending.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <UserX className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-blue-400 mb-4" />
                  <p className="text-blue-700 text-sm sm:text-base">No apologies received</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data.responses.notAttending.map((response) => (
                    <div 
                      key={response._id}
                      className="animate-fade-in p-3 bg-red-50 rounded-lg border border-red-200"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-red-800 text-sm sm:text-base">{response.member.name}</div>
                            <div className="text-xs sm:text-sm text-red-600">{response.member.email}</div>
                          </div>
                          <div className="text-right">
                            <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mb-1" />
                            <div className="text-xs text-red-500">
                              {format(new Date(response.responseDate), "MMM dd, h:mm a")}
                            </div>
                          </div>
                        </div>
                        {response.reason && (
                          <div className="mt-2 p-2 bg-red-100 rounded border-l-4 border-red-400">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-xs font-medium text-red-700 mb-1">Reason:</div>
                                <div className="text-xs sm:text-sm text-red-800">{response.reason}</div>
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
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link href="/leader/events">
            <Button variant="outline" className="border-blue-300 text-blue-800 hover:bg-blue-50 text-sm sm:text-base w-full sm:w-auto">
              Back to Events
            </Button>
          </Link>
          {isUpcoming && (
            <Link href="/leader/attendance">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base w-full sm:w-auto">
                Mark Attendance
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
