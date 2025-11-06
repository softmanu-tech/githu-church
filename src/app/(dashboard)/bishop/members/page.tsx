"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';
import { useAlerts } from "@/components/ui/alert-system"
import { ProfessionalHeader } from "@/components/ProfessionalHeader"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { format } from "date-fns"
import Link from "next/link"
import {
  Users,
  Search,
  Filter,
  ArrowLeft,
  Phone,
  MapPin,
  Building,
  Mail,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  BarChart3,
  Download,
  FileSpreadsheet,
  MessageSquare,
  Send,
  Plus,
  Eye,
  Clock,
  AlertCircle
} from "lucide-react"

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
  type?: string
}

interface Communication {
  _id: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'announcement' | 'meeting' | 'event' | 'prayer' | 'general';
  readBy: { userId: string; readAt: string }[];
  sentAt?: string;
  scheduledFor?: string;
  createdAt: string;
}

interface MembersData {
  members: Member[]
  summary: {
    totalMembers: number
    overallAttendanceRate: number
    excellentMembers: number
    goodMembers: number
    averageMembers: number
    poorMembers: number
    activeMembers: number
    inactiveMembers: number
  }
}

export default function BishopMembersPage() {
  const alerts = useAlerts()
  
  const [data, setData] = useState<MembersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [groupFilter, setGroupFilter] = useState<string>('all')
  const [communications, setCommunications] = useState<Communication[]>([])
  const [showCompose, setShowCompose] = useState(false)
  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState<'members' | 'communications'>('members')
  
  // Communication form state
  const [commForm, setCommForm] = useState({
    subject: '',
    message: '',
    priority: 'medium' as const,
    category: 'general' as const,
    scheduledFor: ''
  })

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/bishop/members', {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch members data")
      }

      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || "Failed to fetch members data")
      }
    } catch (err) {
      console.error("Error fetching members:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch members")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
    fetchCommunications()
  }, [])

  const fetchCommunications = async () => {
    try {
      const response = await fetch('/api/bishop/communications?recipients=all_members');
      const result = await response.json();
      if (result.success) {
        setCommunications(result.data.communications);
      }
    } catch (error) {
      console.error('Error fetching communications:', error);
    }
  }

  const handleSendMessage = async () => {
    if (!commForm.subject || !commForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSending(true);
      
      const response = await fetch('/api/bishop/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...commForm,
          recipients: { type: 'all_members' },
          scheduledFor: commForm.scheduledFor || undefined
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setShowCompose(false);
        setCommForm({
          subject: '',
          message: '',
          priority: 'medium',
          category: 'general',
          scheduledFor: ''
        });
        fetchCommunications();
      } else {
        toast.error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  // Filter members based on search and filters
  const filteredMembers = data?.members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.phone && member.phone.includes(searchTerm))
    
    const matchesRating = ratingFilter === 'all' || member.rating === ratingFilter
    
    const matchesGroup = groupFilter === 'all' || 
                        (member.group && member.group.name === groupFilter)
    
    return matchesSearch && matchesRating && matchesGroup
  }) || []

  // Get unique groups for filter
  const uniqueGroups = [...new Set(data?.members.map(m => m.group?.name).filter(Boolean))]

  // Export functionality
  const exportToCSV = () => {
    try {
      if (!filteredMembers.length) {
        alerts.error("Export Failed", "No members to export. Please check your filters.")
        return
      }

      const headers = [
        'Name',
        'Email', 
        'Phone',
        'Residence',
        'Department',
        'Group',
        'Attendance Rate (%)',
        'Rating',
        'Events Attended',
        'Total Events',
        'Last Attendance Date',
        'Status'
      ]

      const csvData = filteredMembers.map(member => [
        member.name || '',
        member.email || '',
        member.phone || '',
        member.residence || '',
        member.department || '',
        member.group?.name || 'No Group',
        member.attendanceRate || 0,
        member.rating || 'Not Rated',
        member.attendanceCount || 0,
        member.totalEvents || 0,
        member.lastAttendanceDate ? format(new Date(member.lastAttendanceDate), "yyyy-MM-dd") : 'Never',
        member.attendanceRate && member.attendanceRate >= 80 ? 'Active' : 
        member.attendanceRate && member.attendanceRate >= 40 ? 'Moderate' : 'Inactive'
      ])

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          row.map(cell => 
            typeof cell === 'string' && (cell.includes(',') || cell.includes('"')) 
              ? `"${cell.replace(/"/g, '""')}"` 
              : cell
          ).join(',')
        )
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `church-members-${format(new Date(), 'yyyy-MM-dd')}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        alerts.success(
          "Export Successful", 
          `Successfully exported ${filteredMembers.length} members to CSV file.`
        )
      } else {
        throw new Error('CSV download not supported in this browser')
      }
    } catch (error) {
      console.error('Export error:', error)
      alerts.error(
        "Export Failed", 
        error instanceof Error ? error.message : "Failed to export members data"
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-300">
        <ProfessionalHeader
          title="All Members Management"
          subtitle="Loading members data..."
        />
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Summary Stats Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <UltraFastCardSkeleton key={i} />
            ))}
          </div>

          {/* Search and Filters Skeleton */}
          <UltraFastCardSkeleton />

          {/* Members Table Skeleton */}
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
            onClick={fetchMembers}
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
          <p className="text-blue-800">No members data available.</p>
          <Link href="/bishop">
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-300">
      <ProfessionalHeader
        title="All Members Management"
        subtitle={`${data.summary.totalMembers} members across all groups`}
        backHref="/bishop"
        actions={[
          {
            label: "Export CSV",
            onClick: exportToCSV,
            variant: "outline",
            className: "border-green-300 text-green-100 bg-green-600/20 hover:bg-green-600/30",
            icon: <Download className="h-3 w-3 sm:h-4 sm:w-4" />
          },
          {
            label: "Add Member",
            onClick: () => {
              alerts.info("Coming Soon", "Add member functionality will be implemented soon.")
            },
            variant: "default",
            icon: <Users className="h-3 w-3 sm:h-4 sm:w-4" />
          }
        ]}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-6">
        {/* Tabs */}
        <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-3 sm:p-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'members'
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-700 hover:bg-blue-100'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Members
            </button>
            <button
              onClick={() => setActiveTab('communications')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'communications'
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-700 hover:bg-blue-100'
              }`}
            >
              <MessageSquare className="h-4 w-4 inline mr-2" />
              Communications
            </button>
          </div>
        </div>

        {activeTab === 'members' && (
          <>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-blue-800">{data.summary.totalMembers}</div>
              <div className="text-xs sm:text-sm text-blue-600">Total Members</div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-100 border border-green-300">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-green-800">{data.summary.excellentMembers}</div>
              <div className="text-xs sm:text-sm text-green-600">Excellent</div>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-100 border border-blue-300">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-blue-800">{data.summary.goodMembers}</div>
              <div className="text-xs sm:text-sm text-blue-600">Good</div>
            </CardContent>
          </Card>
          
          <Card className="bg-yellow-100 border border-yellow-300">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-yellow-800">{data.summary.averageMembers}</div>
              <div className="text-xs sm:text-sm text-yellow-600">Average</div>
            </CardContent>
          </Card>
          
          <Card className="bg-red-100 border border-red-300">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-red-800">{data.summary.poorMembers}</div>
              <div className="text-xs sm:text-sm text-red-600">Poor</div>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-100 border border-purple-300">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-purple-800">{data.summary.overallAttendanceRate}%</div>
              <div className="text-xs sm:text-sm text-purple-600">Church Avg</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/90 text-sm"
                >
                  <option value="all">All Ratings</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
                
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/90 text-sm"
                >
                  <option value="all">All Groups</option>
                  {uniqueGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Members ({filteredMembers.length})
              </CardTitle>
              {filteredMembers.length > 0 && (
                <Button
                  onClick={exportToCSV}
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-700 bg-green-50 hover:bg-green-100 w-full sm:w-auto"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export {filteredMembers.length} Members
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                <p className="text-blue-600">
                  {searchTerm || ratingFilter !== 'all' || groupFilter !== 'all' 
                    ? 'No members match your filters' 
                    : 'No members found'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card Layout */}
                <div className="block lg:hidden space-y-4">
                  {filteredMembers.map((member) => (
                    <div
                      key={member._id}
                      className="bg-white/80 rounded-lg border border-blue-200 p-4 animate-fade-in"
                    >
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-blue-800">{member.name}</h3>
                            <p className="text-sm text-blue-600">{member.email}</p>
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                              {member.group?.name || 'No Group'}
                            </span>
                          </div>
                          {member.attendanceRate !== undefined && (
                            <div className={`px-3 py-1 rounded-lg text-center ${ 
                              member.attendanceRate >= 80 ? 'bg-green-100 text-green-800' :
                              member.attendanceRate >= 60 ? 'bg-blue-100 text-blue-800' :
                              member.attendanceRate >= 40 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              <div className="text-lg font-bold">{member.attendanceRate}%</div>
                              <div className="text-xs">{member.rating}</div>
                            </div>
                          )}
                        </div>
                        
                        {/* Contact Information */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {member.phone && (
                            <div className="flex items-center gap-2 text-blue-600">
                              <Phone className="h-4 w-4" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                          {member.residence && (
                            <div className="flex items-center gap-2 text-blue-600">
                              <MapPin className="h-4 w-4" />
                              <span>{member.residence}</span>
                            </div>
                          )}
                          {member.department && (
                            <div className="flex items-center gap-2 text-blue-600">
                              <Building className="h-4 w-4" />
                              <span>{member.department}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Performance Stats */}
                        {member.attendanceCount !== undefined && (
                          <div className="flex justify-between items-center pt-2 border-t border-blue-200 text-sm">
                            <span className="text-blue-600">
                              Present: {member.attendanceCount}/{member.totalEvents || 0} events
                            </span>
                            {member.lastAttendanceDate && (
                              <span className="text-blue-500">
                                Last: {format(new Date(member.lastAttendanceDate), "MMM dd, yyyy")}
                              </span>
                            )}
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
                        <th className="text-left p-3 text-sm font-medium text-blue-800">Member</th>
                        <th className="text-left p-3 text-sm font-medium text-blue-800">Contact Info</th>
                        <th className="text-left p-3 text-sm font-medium text-blue-800">Performance</th>
                        <th className="text-left p-3 text-sm font-medium text-blue-800">Group</th>
                        <th className="text-left p-3 text-sm font-medium text-blue-800">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member) => (
                        <tr
                          key={member._id}
                          className="border-b border-blue-200 hover:bg-white/50 transition-colors animate-fade-in"
                        >
                          <td className="p-3">
                            <div>
                              <div className="font-medium text-blue-800">{member.name}</div>
                              <div className="text-sm text-blue-600">{member.email}</div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="space-y-1 text-sm">
                              {member.phone && (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <Phone className="h-3 w-3" />
                                  <span>{member.phone}</span>
                                </div>
                              )}
                              {member.residence && (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <MapPin className="h-3 w-3" />
                                  <span>{member.residence}</span>
                                </div>
                              )}
                              {member.department && (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <Building className="h-3 w-3" />
                                  <span>{member.department}</span>
                                </div>
                              )}
                              {!member.phone && !member.residence && !member.department && (
                                <span className="text-blue-500 text-sm">No contact info</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            {member.attendanceRate !== undefined ? (
                              <div className="space-y-1">
                                <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${ 
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
                              <span className="text-blue-500 text-sm">No data</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {member.group?.name || 'No Group'}
                            </span>
                          </td>
                          <td className="p-3">
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
                            {member.lastAttendanceDate && (
                              <div className="text-xs text-blue-500 mt-1">
                                Last: {format(new Date(member.lastAttendanceDate), "MMM dd")}
                              </div>
                            )}
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
          </>
        )}

        {activeTab === 'communications' && (
          <div className="space-y-6">
            {/* Compose Message */}
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-blue-800">Send Message to All Members</CardTitle>
                  <Dialog open={showCompose} onOpenChange={setShowCompose}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Compose
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-blue-200/90 backdrop-blur-md border border-blue-300 max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-blue-800 text-lg sm:text-xl">Compose Message</DialogTitle>
                        <DialogDescription className="text-blue-600 text-sm sm:text-base">
                          Send a message to all members
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-blue-200">
                        <div>
                          <Label htmlFor="subject" className="text-blue-800 font-medium text-sm sm:text-base">Subject *</Label>
                          <Input
                            id="subject"
                            value={commForm.subject}
                            onChange={(e) => setCommForm({...commForm, subject: e.target.value})}
                            placeholder="Enter message subject"
                            className="bg-white/90 border-blue-300 text-blue-800 placeholder-blue-500 focus:border-blue-600 focus:ring-blue-600 text-sm sm:text-base"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <Label htmlFor="priority" className="text-blue-800 font-medium text-sm sm:text-base">Priority</Label>
                            <Select value={commForm.priority} onValueChange={(value: any) => setCommForm({...commForm, priority: value})}>
                              <SelectTrigger className="bg-white/90 border-blue-300 text-blue-800 focus:border-blue-600 focus:ring-blue-600 text-sm sm:text-base">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white/95 backdrop-blur-sm border-blue-300">
                                <SelectItem value="low" className="text-blue-800 hover:bg-blue-100 text-sm sm:text-base">Low</SelectItem>
                                <SelectItem value="medium" className="text-blue-800 hover:bg-blue-100 text-sm sm:text-base">Medium</SelectItem>
                                <SelectItem value="high" className="text-blue-800 hover:bg-blue-100 text-sm sm:text-base">High</SelectItem>
                                <SelectItem value="urgent" className="text-blue-800 hover:bg-blue-100 text-sm sm:text-base">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="category" className="text-blue-800 font-medium text-sm sm:text-base">Category</Label>
                            <Select value={commForm.category} onValueChange={(value: any) => setCommForm({...commForm, category: value})}>
                              <SelectTrigger className="bg-white/90 border-blue-300 text-blue-800 focus:border-blue-600 focus:ring-blue-600 text-sm sm:text-base">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white/95 backdrop-blur-sm border-blue-300">
                                <SelectItem value="announcement" className="text-blue-800 hover:bg-blue-100 text-sm sm:text-base">Announcement</SelectItem>
                                <SelectItem value="meeting" className="text-blue-800 hover:bg-blue-100 text-sm sm:text-base">Meeting</SelectItem>
                                <SelectItem value="event" className="text-blue-800 hover:bg-blue-100 text-sm sm:text-base">Event</SelectItem>
                                <SelectItem value="prayer" className="text-blue-800 hover:bg-blue-100 text-sm sm:text-base">Prayer</SelectItem>
                                <SelectItem value="general" className="text-blue-800 hover:bg-blue-100 text-sm sm:text-base">General</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="scheduledFor" className="text-blue-800 font-medium text-sm sm:text-base">Schedule (Optional)</Label>
                          <Input
                            id="scheduledFor"
                            type="datetime-local"
                            value={commForm.scheduledFor}
                            onChange={(e) => setCommForm({...commForm, scheduledFor: e.target.value})}
                            className="bg-white/90 border-blue-300 text-blue-800 focus:border-blue-600 focus:ring-blue-600 text-sm sm:text-base"
                          />
                        </div>

                        <div>
                          <Label htmlFor="message" className="text-blue-800 font-medium text-sm sm:text-base">Message *</Label>
                          <Textarea
                            id="message"
                            value={commForm.message}
                            onChange={(e) => setCommForm({...commForm, message: e.target.value})}
                            placeholder="Enter your message"
                            rows={4}
                            className="bg-white/90 border-blue-300 text-blue-800 placeholder-blue-500 focus:border-blue-600 focus:ring-blue-600 resize-none text-sm sm:text-base"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2 sm:pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowCompose(false)}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-white/90 text-sm sm:text-base"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleSendMessage} 
                            disabled={sending}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base"
                          >
                            {sending ? 'Sending...' : 'Send Message'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
            </Card>

            {/* Communications List */}
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader>
                <CardTitle className="text-blue-800">Sent Messages</CardTitle>
              </CardHeader>
              <CardContent>
                {communications.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-blue-800 mb-2">No messages sent</h3>
                    <p className="text-blue-600">Start by composing your first message to members</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {communications.map((comm) => (
                      <div key={comm._id} className="bg-white/90 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{comm.subject}</h3>
                              <Badge className={priorityColors[comm.priority]}>
                                {comm.priority}
                              </Badge>
                              {comm.scheduledFor && !comm.sentAt && (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Scheduled
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-gray-600 mb-3 line-clamp-2">{comm.message}</p>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>To: All Members</span>
                              <span>•</span>
                              <span>
                                {comm.sentAt 
                                  ? `Sent: ${new Date(comm.sentAt).toLocaleDateString()}`
                                  : `Scheduled: ${new Date(comm.scheduledFor!).toLocaleDateString()}`
                                }
                              </span>
                              <span>•</span>
                              <span>{comm.readBy.length} read</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
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

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/bishop">
            <Button variant="outline" className="border-blue-300 text-blue-800 hover:bg-blue-50">
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/bishop/groups">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Manage Groups
            </Button>
          </Link>
          <Link href="/bishop/leaders">
            <Button variant="outline" className="border-blue-300 text-blue-800 hover:bg-blue-50">
              View Leaders
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
