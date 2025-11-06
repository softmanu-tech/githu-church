"use client"

import React, { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Users, Layers } from "lucide-react"
import { format } from "date-fns"

interface Event {
    _id: string
    title: string
    date: string
    location?: string
    description?: string
    group?: {
        _id: string
        name: string
    }
    createdBy?: {
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
    email: string
    phone?: string
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

interface ResponsiveDashboardProps {
    attendance: AttendanceRecord[]
    events: Event[]
    members: Member[]
    formatDate: (dateStr: string) => string
}

export function ResponsiveDashboard({ attendance, events, members, formatDate }: ResponsiveDashboardProps) {
    return (
        <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300">
            <Tabs defaultValue="attendance" className="w-full">
                <div className="border-b border-blue-300">
                    <TabsList className="bg-transparent border-0 w-full justify-start p-0 overflow-x-auto">
                        <TabsTrigger 
                            value="attendance" 
                            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 border-b-2 border-transparent data-[state=active]:border-blue-800 data-[state=active]:text-blue-800 data-[state=active]:bg-white/20 bg-transparent hover:bg-white/10 rounded-none text-blue-700 text-xs sm:text-sm whitespace-nowrap"
                        >
                            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden xs:inline">Attendance</span>
                            <span className="xs:hidden">Att.</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="events" 
                            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 border-b-2 border-transparent data-[state=active]:border-blue-800 data-[state=active]:text-blue-800 data-[state=active]:bg-white/20 bg-transparent hover:bg-white/10 rounded-none text-blue-700 text-xs sm:text-sm whitespace-nowrap"
                        >
                            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                            Events
                        </TabsTrigger>
                        <TabsTrigger 
                            value="members" 
                            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 border-b-2 border-transparent data-[state=active]:border-blue-800 data-[state=active]:text-blue-800 data-[state=active]:bg-white/20 bg-transparent hover:bg-white/10 rounded-none text-blue-700 text-xs sm:text-sm whitespace-nowrap"
                        >
                            <Layers className="h-3 w-3 sm:h-4 sm:w-4" />
                            Members
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Attendance Tab */}
                <TabsContent value="attendance" className="p-3 sm:p-4 md:p-6">
                    <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-base sm:text-lg font-medium text-blue-800">Recent Attendance</h3>
                        {attendance.length > 0 ? (
                            <>
                                {/* Mobile Card Layout */}
                                <div className="block md:hidden space-y-3">
                                    {attendance.slice(0, 10).map((record, index) => (
                                        <Card key={index} className="bg-white/80 backdrop-blur-sm border border-blue-200">
                                            <CardContent className="p-3">
                                                <div className="flex justify-between items-start">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm font-medium text-blue-800">{formatDate(record.date)}</div>
                                                        <div className="text-xs text-blue-600 mt-1">
                                                            {record.group?.name || "No Group"} • {record.leader?.name || "No Leader"}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center ml-3">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                                        <span className="text-sm font-bold text-blue-800">{record.count}</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {/* Desktop Table Layout */}
                                <div className="hidden md:block mobile-table-container">
                                    <table className="mobile-table">
                                        <thead className="mobile-table-header">
                                            <tr>
                                                <th>Date</th>
                                                <th>Group</th>
                                                <th>Leader</th>
                                                <th>Count</th>
                                            </tr>
                                        </thead>
                                        <tbody className="mobile-table-body">
                                            {attendance.map((record, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <div className="truncate">{formatDate(record.date)}</div>
                                                    </td>
                                                    <td>
                                                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 max-w-full truncate">
                                                            {record.group?.name || "No Group"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="truncate">{record.leader?.name || "No Leader"}</div>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center">
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                                            <span className="font-medium">{record.count}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 sm:py-12">
                                <Users className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-blue-400" />
                                <h3 className="mt-2 text-sm font-medium text-blue-800">No attendance records</h3>
                                <p className="mt-1 text-xs sm:text-sm text-blue-600">Get started by having leaders mark attendance for events.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Events Tab */}
                <TabsContent value="events" className="p-3 sm:p-4 md:p-6">
                    <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-base sm:text-lg font-medium text-blue-800">Church Events & Attendance</h3>
                        {events.length > 0 ? (
                            <>
                                {/* Mobile Card Layout */}
                                <div className="block md:hidden space-y-3">
                                    {events.slice(0, 10).map((event, index) => (
                                        <Card key={index} className="bg-white/80 backdrop-blur-sm border border-blue-200">
                                            <CardContent className="p-3">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-sm font-medium text-blue-800 truncate">{event.title}</div>
                                                            {event.location && (
                                                                <div className="text-xs text-blue-600 truncate">{event.location}</div>
                                                            )}
                                                        </div>
                                                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2 whitespace-nowrap">
                                                            {event.group?.name || "No Group"}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs text-blue-600">
                                                        <div>{formatDate(event.date)}</div>
                                                        <div className="flex items-center">
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                                                            {event.attendanceCount || 0}
                                                            {event.totalMembers && event.totalMembers > 0 && (
                                                                <span className="ml-1">({event.attendanceRate || 0}%)</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 pt-2 border-t border-blue-200">
                                                        <a
                                                            href={`/bishop/events/${event._id}`}
                                                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors w-full justify-center"
                                                        >
                                                            View Responses
                                                        </a>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {/* Desktop Table Layout */}
                                <div className="hidden md:block mobile-table-container">
                                    <table className="mobile-table">
                                        <thead className="mobile-table-header">
                                            <tr>
                                                <th>Event</th>
                                                <th>Date</th>
                                                <th>Group</th>
                                                <th>Created By</th>
                                                <th>Attendance</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="mobile-table-body">
                                            {events.map((event, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <div className="min-w-0">
                                                            <div className="font-medium truncate">{event.title}</div>
                                                            {event.location && (
                                                                <div className="text-xs opacity-75 truncate">{event.location}</div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="min-w-0">
                                                            <div className="truncate">{formatDate(event.date)}</div>
                                                            <div className="text-xs opacity-75">{new Date(event.date).toLocaleTimeString()}</div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 max-w-full truncate">
                                                            {event.group?.name || "No Group"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="truncate">{event.createdBy?.name || "System"}</div>
                                                    </td>
                                                    <td>
                                                        <div className="flex flex-col space-y-1">
                                                            <div className="flex items-center">
                                                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                                                <span className="font-medium">{event.attendanceCount || 0}</span>
                                                            </div>
                                                            {event.totalMembers && event.totalMembers > 0 && (
                                                                <div className="text-xs opacity-75">
                                                                    {event.attendanceRate || 0}%
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <a
                                                            href={`/bishop/events/${event._id}`}
                                                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                                                        >
                                                            View Responses
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 sm:py-12">
                                <CalendarIcon className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-blue-400" />
                                <h3 className="mt-2 text-sm font-medium text-blue-800">No events scheduled</h3>
                                <p className="mt-1 text-xs sm:text-sm text-blue-600">Leaders can create events for their groups.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Members Tab */}
                <TabsContent value="members" className="p-3 sm:p-4 md:p-6">
                    <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-base sm:text-lg font-medium text-blue-800">All Members</h3>
                        {members.length > 0 ? (
                            <>
                                {/* Mobile Card Layout */}
                                <div className="block md:hidden space-y-3">
                                    {members.slice(0, 20).map((member, index) => (
                                        <Card key={index} className="bg-white/80 backdrop-blur-sm border border-blue-200">
                                            <CardContent className="p-3">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-start">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-sm font-medium text-blue-800 truncate">{member.name}</div>
                                                            <div className="text-xs text-blue-600 truncate">{member.email}</div>
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                {member.phone && (
                                                                    <div className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded">📞 {member.phone}</div>
                                                                )}
                                                                {member.residence && (
                                                                    <div className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded">🏠 {member.residence}</div>
                                                                )}
                                                                {member.department && (
                                                                    <div className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded">🏢 {member.department}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right space-y-1">
                                                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                                                                {member.group?.name || "No Group"}
                                                            </span>
                                                            {member.attendanceRate !== undefined && (
                                                                <div className={`text-xs font-medium px-2 py-1 rounded block ${
                                                                    member.attendanceRate >= 80 ? 'bg-green-100 text-green-800' :
                                                                    member.attendanceRate >= 60 ? 'bg-blue-100 text-blue-800' :
                                                                    member.attendanceRate >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {member.attendanceRate}%
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {member.attendanceCount !== undefined && (
                                                        <div className="flex justify-between text-xs text-blue-600 pt-2 border-t border-blue-200">
                                                            <span>Present: {member.attendanceCount}/{member.totalEvents || 0}</span>
                                                            <span className={`font-medium ${
                                                                member.rating === 'Excellent' ? 'text-green-600' :
                                                                member.rating === 'Good' ? 'text-blue-600' :
                                                                member.rating === 'Average' ? 'text-yellow-600' :
                                                                'text-red-600'
                                                            }`}>
                                                                {member.rating || 'N/A'}
                                                            </span>
                                                            {member.lastAttendanceDate && (
                                                                <span>Last: {format(new Date(member.lastAttendanceDate), "MMM dd")}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {/* Desktop Table Layout */}
                                <div className="hidden md:block mobile-table-container">
                                    <table className="mobile-table">
                                        <thead className="mobile-table-header">
                                            <tr>
                                                <th>Name</th>
                                                <th>Contact</th>
                                                <th>Performance</th>
                                                <th>Group</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="mobile-table-body">
                                            {members.map((member, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <div className="space-y-1">
                                                            <div className="font-medium truncate">{member.name}</div>
                                                            <div className="text-xs text-blue-600 truncate">{member.email}</div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="space-y-1 text-xs">
                                                            {member.phone && <div className="truncate">📞 {member.phone}</div>}
                                                            {member.residence && <div className="truncate">🏠 {member.residence}</div>}
                                                            {member.department && <div className="truncate">🏢 {member.department}</div>}
                                                            {!member.phone && !member.residence && !member.department && <div className="text-blue-500">-</div>}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {member.attendanceRate !== undefined ? (
                                                            <div className="space-y-1">
                                                                <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                                                    member.attendanceRate >= 80 ? 'bg-green-100 text-green-800' :
                                                                    member.attendanceRate >= 60 ? 'bg-blue-100 text-blue-800' :
                                                                    member.attendanceRate >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {member.attendanceRate}%
                                                                </div>
                                                                <div className="text-xs text-blue-600">
                                                                    {member.attendanceCount}/{member.totalEvents || 0} events
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-blue-500">No data</div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 max-w-full truncate">
                                                            {member.group?.name || "No Group"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {member.rating && (
                                                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                                                member.rating === 'Excellent' ? 'bg-green-100 text-green-800' :
                                                                member.rating === 'Good' ? 'bg-blue-100 text-blue-800' :
                                                                member.rating === 'Average' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                            }`}>
                                                                {member.rating}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 sm:py-12">
                                <Layers className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-blue-400" />
                                <h3 className="mt-2 text-sm font-medium text-blue-800">No members yet</h3>
                                <p className="mt-1 text-xs sm:text-sm text-blue-600">Members will appear here once leaders add them to groups.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
