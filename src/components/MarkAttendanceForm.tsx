"use client"

import React, { useState, useEffect } from "react"

import { Calendar, Users, CheckCircle, XCircle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';
import { useAlerts } from "@/components/ui/alert-system"
import { ProfessionalHeader } from "@/components/ProfessionalHeader"
import { format } from "date-fns"
import Link from "next/link"

interface Member {
  _id: string
  name: string
  email: string
  phone?: string
}

interface Event {
  _id: string
  title: string
  date: string
  location?: string
}

interface AttendanceRecord {
  _id: string
  date: string
  event?: Event
  presentMembers: string[]
  absentMembers: string[]
  group: {
    _id: string
    name: string
  }
}

export default function MarkAttendanceForm() {
  const alerts = useAlerts()
  const [members, setMembers] = useState<Member[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<string>("")
  const [presentMembers, setPresentMembers] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError("")
      
      // Fetch leader data including members
      const leaderResponse = await fetch("/api/leader", {
        credentials: "include"
      })
      if (!leaderResponse.ok) throw new Error("Failed to fetch leader data")
      const leaderData = await leaderResponse.json()
      
      setMembers(leaderData.members || [])
      
      // Fetch events
      const eventsResponse = await fetch("/api/leader/events", {
        credentials: "include"
      })
      if (!eventsResponse.ok) throw new Error("Failed to fetch events")
      const eventsData = await eventsResponse.json()
      
      setEvents(eventsData.data || [])
      
      // Fetch attendance records
      const attendanceResponse = await fetch("/api/leader/mark-attendance", {
        credentials: "include"
      })
      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json()
        setAttendanceRecords(attendanceData.data || [])
      }
      
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setSelectedDate(new Date())
    fetchData()
  }, [])

  const handleMemberToggle = (memberId: string) => {
    const newPresentMembers = new Set(presentMembers)
    if (newPresentMembers.has(memberId)) {
      newPresentMembers.delete(memberId)
    } else {
      newPresentMembers.add(memberId)
    }
    setPresentMembers(newPresentMembers)
  }

  const handleSelectAll = () => {
    const allMemberIds = new Set(members.map(m => m._id))
    setPresentMembers(allMemberIds)
  }

  const handleSelectNone = () => {
    setPresentMembers(new Set())
  }

  const handleSubmit = async () => {
    if (presentMembers.size === 0) {
      alerts.warning(
        "No Members Selected",
        "Please mark at least one member as present before recording attendance.",
        [
          {
            label: "OK",
            action: () => {},
            variant: "primary"
          }
        ]
      )
      return
    }

    try {
      setSubmitting(true)
      
      const presentIds = Array.from(presentMembers)
      const absentIds = members
        .filter(m => !presentMembers.has(m._id))
        .map(m => m._id)

      if (!selectedDate) {
        alerts.error("Please select a date", "You must choose a date before recording attendance")
        return
      }

      const payload = {
        date: selectedDate.toISOString(),
        presentMemberIds: presentIds,
        absentMemberIds: absentIds,
        ...(selectedEvent && { eventId: selectedEvent })
      }

      const response = await fetch("/api/leader/mark-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to record attendance")
      }

      alerts.success(
        "Attendance Recorded Successfully!",
        `Recorded attendance for ${presentIds.length} members on ${selectedDate?.toLocaleDateString()}`,
        [
          {
            label: "View Analytics",
            action: () => window.location.href = "/leader/analytics",
            variant: "primary"
          },
          {
            label: "Mark Another",
            action: () => {
              setPresentMembers(new Set())
              setSelectedEvent("")
            },
            variant: "secondary"
          }
        ]
      )
      setPresentMembers(new Set())
      setSelectedEvent("")
      await fetchData() // Refresh data
      
    } catch (err) {
      console.error("Error recording attendance:", err)
      alerts.error(
        "Failed to Record Attendance",
        err instanceof Error ? err.message : "An error occurred while recording attendance.",
        [
          {
            label: "Try Again",
            action: () => handleSubmit(),
            variant: "primary"
          }
        ]
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-300">
        <ProfessionalHeader
          title="Mark Attendance"
          subtitle="Loading attendance system..."
        />
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Form Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className="lg:col-span-2">
              <UltraFastCardSkeleton />
            </div>
            <div>
              <UltraFastCardSkeleton />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-300">
        <ProfessionalHeader
          title="Mark Attendance"
          subtitle="Record member attendance for your group"
          backHref="/leader"
        />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          <Card className="bg-red-200/90 backdrop-blur-md border border-red-300">
            <CardContent className="p-6 text-center">
              <strong className="text-red-800">Error:</strong> {error}
              <Button 
                onClick={fetchData}
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

  return (
    <div className="min-h-screen bg-blue-300">
      <ProfessionalHeader
        title="Mark Attendance"
        subtitle="Record member attendance for your group"
        backHref="/leader"
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          
          {/* Attendance Form */}
          <div className="lg:col-span-2">
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-blue-800 flex items-center gap-2 text-base sm:text-lg">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  Mark Attendance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                
                {/* Date and Event Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-blue-800 mb-2">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                      Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                      max={format(new Date(), "yyyy-MM-dd")}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 bg-white/90 text-blue-800 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-blue-800 mb-2">
                      Event (Optional)
                    </label>
                    <select
                      value={selectedEvent}
                      onChange={(e) => setSelectedEvent(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 bg-white/90 text-blue-800 text-sm"
                    >
                      <option value="">General Attendance</option>
                      {events.map((event) => (
                        <option key={event._id} value={event._id}>
                          {event.title} - {format(new Date(event.date), "MMM dd")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSelectAll}
                    className="border-blue-300 text-blue-800 bg-white/80 hover:bg-white/90 text-xs sm:text-sm"
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSelectNone}
                    className="border-blue-300 text-blue-800 bg-white/80 hover:bg-white/90 text-xs sm:text-sm"
                  >
                    Select None
                  </Button>
                </div>

                {/* Members List */}
                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-medium text-blue-800">
                    Members ({presentMembers.size} of {members.length} present)
                  </h3>
                  
                  {members.length === 0 ? (
                    <div className="text-center py-6 sm:py-8">
                      <Users className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-blue-400 mb-4" />
                      <p className="text-blue-600 text-sm">No members in your group yet.</p>
                      <Link href="/leader" className="text-blue-800 underline text-sm">
                        Add members to your group
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:gap-3 max-h-80 overflow-y-auto">
                      {members.map((member) => (
                        <div 
                          key={member._id}
                          className={`animate-fade-in p-3 sm:p-4 rounded-lg border cursor-pointer transition-all ${
                            presentMembers.has(member._id)
                              ? "bg-blue-100 border-blue-300 shadow-sm"
                              : "bg-white/80 border-blue-200 hover:bg-white/90"
                          }`}
                          onClick={() => handleMemberToggle(member._id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-blue-800 text-sm sm:text-base truncate">{member.name}</h4>
                              <p className="text-xs sm:text-sm text-blue-600 truncate">{member.email}</p>
                            </div>
                            <div className="flex items-center ml-3">
                              {presentMembers.has(member._id) ? (
                                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                              ) : (
                                <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-center sm:justify-end pt-4 border-t border-blue-300">
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || presentMembers.size === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 md:px-8 py-2 text-sm sm:text-base w-full sm:w-auto"
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Recording...</span>
                      </div>
                    ) : (
                      `Record Attendance (${presentMembers.size} present)`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance History */}
          <div>
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-blue-800 flex items-center gap-2 text-base sm:text-lg">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  Recent Records
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {attendanceRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-8 w-8 text-blue-400 mb-2" />
                    <p className="text-blue-600 text-sm">No attendance records yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
                    {attendanceRecords.slice(0, 10).map((record) => (
                      <div
                        key={record._id}
                        className="p-3 bg-white/80 rounded-lg border border-blue-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-blue-800 text-sm sm:text-base">
                              {format(new Date(record.date), "MMM dd, yyyy")}
                            </p>
                            {record.event && (
                              <p className="text-xs sm:text-sm text-blue-600 truncate">{record.event.title}</p>
                            )}
                          </div>
                          <div className="flex justify-between sm:block sm:text-right">
                            <p className="text-xs sm:text-sm font-medium text-blue-600">
                              {record.presentMembers.length} present
                            </p>
                            <p className="text-xs sm:text-sm text-blue-500">
                              {record.absentMembers.length} absent
                            </p>
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
    </div>
  )
}