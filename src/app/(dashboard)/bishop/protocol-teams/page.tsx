"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';
import { useAlerts } from "@/components/ui/alert-system"
import { ProfessionalHeader } from "@/components/ProfessionalHeader"
import { format } from "date-fns"
import Link from "next/link"
import '@/styles/mobile-protocol-teams.css'
import {
  Users,
  UserPlus,
  Shield,
  ArrowLeft,
  Phone,
  Mail,
  Award,
  TrendingUp,
  Target,
  CheckCircle,
  AlertTriangle,
  Plus,
  LogOut,
  Eye,
  Settings,
  BarChart3,
  Calendar,
  Star,
  Activity,
  Zap,
  Clock,
  Globe
} from "lucide-react"

interface ProtocolTeam {
  _id: string
  name: string
  description?: string
  leader: {
    _id: string
    name: string
    email: string
    phone?: string
  }
  members: {
    _id: string
    name: string
    email: string
    phone?: string
  }[]
  responsibilities: string[]
  stats: {
    totalVisitors: number
    joiningVisitors: number
    activeMonitoring: number
    convertedMembers: number
    conversionRate: number
  }
  createdAt: string
}

export default function ProtocolTeamsPage() {
  const alerts = useAlerts()
  
  const [teams, setTeams] = useState<ProtocolTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)
  const [newLeaderCredentials, setNewLeaderCredentials] = useState<{email: string, password: string} | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<ProtocolTeam | null>(null)
  const [showTeamDetails, setShowTeamDetails] = useState(false)
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    leaderName: '',
    leaderEmail: '',
    responsibilities: [
      'Welcome and register visitors',
      'Monitor joining visitors progress',
      'Collect visitor feedback and experiences',
      'Report to bishop on visitor engagement',
      'Assist visitors with church integration'
    ]
  })

  const fetchTeams = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/bishop/protocol-teams', {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch protocol teams")
      }

      const result = await response.json()
      if (result.success) {
        setTeams(result.data)
      } else {
        throw new Error(result.error || "Failed to fetch protocol teams")
      }
    } catch (err) {
      console.error("Error fetching protocol teams:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch protocol teams")
    } finally {
      setLoading(false)
    }
  }

  const createTeam = async () => {
    try {
      const response = await fetch('/api/bishop/protocol-teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newTeam)
      })

      if (response.ok) {
        const result = await response.json()
        
        // Store credentials for display
        setNewLeaderCredentials({
          email: result.data.leader.email,
          password: result.data.leader.temporaryPassword
        })
        
        setShowCreateTeam(false)
        setShowCredentials(true)
        
        // Reset form
        setNewTeam({
          name: '',
          description: '',
          leaderName: '',
          leaderEmail: '',
          responsibilities: [
            'Welcome and register visitors',
            'Monitor joining visitors progress',
            'Collect visitor feedback and experiences',
            'Report to bishop on visitor engagement',
            'Assist visitors with church integration'
          ]
        })
        
        fetchTeams()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create team')
      }
    } catch (error) {
      alerts.error("Failed to Create Team", error instanceof Error ? error.message : "Please try again.")
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-300">
        <ProfessionalHeader
          title="Protocol Teams Management"
          subtitle="Loading protocol teams..."
        />
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <UltraFastCardSkeleton key={i} />
            ))}
          </div>

          {/* Teams Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <UltraFastCardSkeleton key={i} />
            ))}
          </div>
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
            onClick={fetchTeams}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" })
      window.location.href = "/"
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <div className="min-h-screen bg-blue-300">
      <ProfessionalHeader
        title="Protocol Teams Management"
        subtitle="Manage visitor protocol teams and their performance"
        backHref="/bishop"
        actions={[
          {
            label: "Create Team",
            onClick: () => setShowCreateTeam(true),
            variant: "default",
            className: "bg-blue-600 hover:bg-blue-700 text-white",
            icon: <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
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
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4 md:py-6 space-y-4 sm:space-y-6 overflow-x-hidden">
        
        {/* Stats Overview */}
        {teams.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200/80 backdrop-blur-md rounded-xl shadow-lg border border-blue-300/50 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 uppercase tracking-wide truncate">Total Teams</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-800 mt-1">{teams.length}</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-500/20 rounded-full flex-shrink-0">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-100 to-green-200/80 backdrop-blur-md rounded-xl shadow-lg border border-green-300/50 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-green-700 uppercase tracking-wide truncate">Total Visitors</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-800 mt-1">
                    {teams.reduce((sum, team) => sum + team.stats.totalVisitors, 0)}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-green-500/20 rounded-full flex-shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-100 to-purple-200/80 backdrop-blur-md rounded-xl shadow-lg border border-purple-300/50 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-purple-700 uppercase tracking-wide truncate">Active Monitoring</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-800 mt-1">
                    {teams.reduce((sum, team) => sum + team.stats.activeMonitoring, 0)}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-purple-500/20 rounded-full flex-shrink-0">
                  <Activity className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-100 to-emerald-200/80 backdrop-blur-md rounded-xl shadow-lg border border-emerald-300/50 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-emerald-700 uppercase tracking-wide truncate">Avg Conversion</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-800 mt-1">
                    {teams.length > 0 ? Math.round(teams.reduce((sum, team) => sum + team.stats.conversionRate, 0) / teams.length) : 0}%
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-emerald-500/20 rounded-full flex-shrink-0">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-emerald-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Teams Overview */}
        {teams.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <div className="bg-gradient-to-br from-blue-100/50 to-blue-200/30 backdrop-blur-md rounded-3xl border border-blue-300/50 p-8 sm:p-12 max-w-2xl mx-auto">
              <div className="p-4 bg-blue-500/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Shield className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-3">No Protocol Teams Yet</h3>
              <p className="text-blue-600 mb-8 text-lg leading-relaxed">
                Create your first protocol team to start managing visitors and tracking their journey
              </p>
              <Button
                onClick={() => setShowCreateTeam(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create First Team
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-blue-800">Protocol Teams</h2>
                <p className="text-blue-600 mt-1">Manage and monitor your visitor protocol teams</p>
              </div>
              <Button
                onClick={() => setShowCreateTeam(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {teams.map((team, index) => (
                <div
                  key={team._id}
                  className="animate-fade-in w-full"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Card className="bg-gradient-to-br from-blue-50/90 to-blue-100/80 backdrop-blur-md border border-blue-300/50 h-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] group">
                    <CardHeader className="pb-3 sm:pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-blue-800 flex items-center gap-2 sm:gap-3 mb-2">
                            <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors flex-shrink-0">
                              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                            </div>
                            <span className="truncate text-base sm:text-lg font-bold">{team.name}</span>
                          </CardTitle>
                          {team.description && (
                            <p className="text-xs sm:text-sm text-blue-600 break-words leading-relaxed">{team.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600 font-medium">Active</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3 sm:space-y-4">
                      {/* Team Leader */}
                      <div className="bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-blue-200/50 shadow-sm">
                        <h4 className="font-semibold text-blue-800 mb-2 sm:mb-3 flex items-center gap-2">
                          <Award className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                          Team Leader
                        </h4>
                        <div className="space-y-1 sm:space-y-2">
                          <div className="font-semibold text-blue-700 text-sm sm:text-lg truncate">{team.leader.name}</div>
                          <div className="text-xs sm:text-sm text-blue-600 flex items-center gap-1 sm:gap-2">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{team.leader.email}</span>
                          </div>
                          {team.leader.phone && (
                            <div className="text-xs sm:text-sm text-blue-600 flex items-center gap-1 sm:gap-2">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{team.leader.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Performance Stats */}
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div className="bg-gradient-to-br from-green-50 to-green-100/80 p-2 sm:p-3 rounded-lg border border-green-200/50 text-center shadow-sm">
                          <div className="text-lg sm:text-xl font-bold text-green-800">{team.stats.totalVisitors}</div>
                          <div className="text-xs text-green-600 font-medium">Total Visitors</div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/80 p-2 sm:p-3 rounded-lg border border-blue-200/50 text-center shadow-sm">
                          <div className="text-lg sm:text-xl font-bold text-blue-800">{team.stats.joiningVisitors}</div>
                          <div className="text-xs text-blue-600 font-medium">Joining</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100/80 p-2 sm:p-3 rounded-lg border border-purple-200/50 text-center shadow-sm">
                          <div className="text-lg sm:text-xl font-bold text-purple-800">{team.stats.activeMonitoring}</div>
                          <div className="text-xs text-purple-600 font-medium">Monitoring</div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/80 p-2 sm:p-3 rounded-lg border border-emerald-200/50 text-center shadow-sm">
                          <div className="text-lg sm:text-xl font-bold text-emerald-800">{team.stats.conversionRate}%</div>
                          <div className="text-xs text-emerald-600 font-medium">Conversion</div>
                        </div>
                      </div>

                      {/* Team Members */}
                      <div className="bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-blue-200/50 shadow-sm">
                        <h4 className="font-semibold text-blue-800 mb-2 sm:mb-3 flex items-center gap-2">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                          Team Members ({team.members.length})
                        </h4>
                        <div className="space-y-1 sm:space-y-2 max-h-24 sm:max-h-32 overflow-y-auto scrollbar-thin">
                          {team.members.map((member) => (
                            <div key={member._id} className="flex items-center gap-2 p-1.5 sm:p-2 bg-blue-50/50 rounded-lg">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-blue-600">
                                  {member.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-xs sm:text-sm text-blue-700 font-medium truncate">{member.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-1 sm:pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-blue-300 text-blue-800 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 text-xs sm:text-sm"
                          onClick={() => {
                            setSelectedTeam(team)
                            setShowTeamDetails(true)
                          }}
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          View Details
                        </Button>
                        <Link href={`/bishop/protocol-teams/${team._id}/manage`} className="flex-1">
                          <Button
                            size="sm"
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-sm"
                          >
                            <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Manage
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-gradient-to-br from-blue-50/95 to-blue-100/90 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto border border-blue-300/50">
            <div className="p-4 sm:p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-800">Create New Protocol Team</h3>
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-blue-800 mb-2 sm:mb-3">Team Name</label>
                    <input
                      type="text"
                      value={newTeam.name}
                      onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                      placeholder="e.g., Main Protocol Team"
                      className="w-full p-3 sm:p-4 border border-blue-300/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90 text-blue-800 placeholder-blue-500 shadow-sm transition-all duration-200 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-800 mb-2 sm:mb-3">Leader Name</label>
                    <input
                      type="text"
                      value={newTeam.leaderName}
                      onChange={(e) => setNewTeam({...newTeam, leaderName: e.target.value})}
                      placeholder="Protocol team leader name"
                      className="w-full p-3 sm:p-4 border border-blue-300/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90 text-blue-800 placeholder-blue-500 shadow-sm transition-all duration-200 text-sm sm:text-base"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-blue-800 mb-2 sm:mb-3">Leader Email</label>
                  <input
                    type="email"
                    value={newTeam.leaderEmail}
                    onChange={(e) => setNewTeam({...newTeam, leaderEmail: e.target.value})}
                    placeholder="leader@church.com"
                    className="w-full p-3 sm:p-4 border border-blue-300/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90 text-blue-800 placeholder-blue-500 shadow-sm transition-all duration-200 text-sm sm:text-base"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-blue-800 mb-2 sm:mb-3">Description</label>
                  <textarea
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
                    placeholder="Brief description of the team's focus..."
                    className="w-full p-3 sm:p-4 border border-blue-300/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90 text-blue-800 placeholder-blue-500 shadow-sm transition-all duration-200 resize-none text-sm sm:text-base"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-800 mb-2 sm:mb-3">Team Responsibilities</label>
                  <div className="bg-white/90 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-blue-300/50 shadow-sm">
                    <div className="space-y-2 sm:space-y-3">
                      {newTeam.responsibilities.map((responsibility, index) => (
                        <div key={index} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-blue-50/50 rounded-lg">
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-blue-700 font-medium">{responsibility}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
                <Button
                  onClick={() => setShowCreateTeam(false)}
                  variant="outline"
                  className="flex-1 border-blue-300/50 text-blue-800 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 py-2 sm:py-3 text-sm sm:text-base"
                >
                  Cancel
                </Button>
                <Button
                  onClick={createTeam}
                  disabled={!newTeam.name.trim() || !newTeam.leaderName.trim() || !newTeam.leaderEmail.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-2 sm:py-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentials && newLeaderCredentials && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-green-50/95 to-green-100/90 backdrop-blur-md rounded-2xl shadow-2xl max-w-lg w-full border border-green-300/50">
            <div className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="p-4 bg-green-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-green-800 mb-2">🎉 Team Created Successfully!</h3>
                <p className="text-green-600">Protocol team leader credentials generated</p>
              </div>
              
              <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-green-200/50 p-6 mb-6">
                <h4 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Protocol Leader Login Credentials
                </h4>
                
                <div className="space-y-4">
                  <div className="bg-green-50/50 p-4 rounded-lg border border-green-200/50">
                    <div className="text-xs text-green-800 font-semibold mb-2">Email Address:</div>
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-mono text-green-800 bg-white/50 px-3 py-2 rounded border flex-1 mr-3">{newLeaderCredentials.email}</code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(newLeaderCredentials.email)
                          alerts.success("Copied!", "Email copied to clipboard")
                        }}
                        className="text-xs px-3 py-2 border-green-300 text-green-800 hover:bg-green-50 transition-all duration-200"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-green-50/50 p-4 rounded-lg border border-green-200/50">
                    <div className="text-xs text-green-800 font-semibold mb-2">Temporary Password:</div>
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-mono text-green-800 bg-white/50 px-3 py-2 rounded border flex-1 mr-3">{newLeaderCredentials.password}</code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(newLeaderCredentials.password)
                          alerts.success("Copied!", "Password copied to clipboard")
                        }}
                        className="text-xs px-3 py-2 border-green-300 text-green-800 hover:bg-green-50 transition-all duration-200"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-200/50">
                    <div className="text-xs text-blue-800 font-semibold mb-3">Complete Login Information:</div>
                    <div className="text-sm text-blue-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <span>Email: {newLeaderCredentials.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span>Password: {newLeaderCredentials.password}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-600" />
                        <span>Login URL: http://localhost:3000</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-blue-600" />
                        <span>Role: Protocol Team Leader</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
                      onClick={() => {
                        const loginDetails = `Protocol Leader Login Credentials:\n\nEmail: ${newLeaderCredentials.email}\nPassword: ${newLeaderCredentials.password}\nLogin URL: http://localhost:3000\nRole: Protocol Team Leader\n\nPlease save these credentials securely and share them with the protocol leader.`
                        navigator.clipboard.writeText(loginDetails)
                        alerts.success("Copied!", "Complete login details copied to clipboard")
                      }}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Copy All Details
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <Button
                  onClick={() => {
                    setShowCredentials(false)
                    setNewLeaderCredentials(null)
                  }}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Details Modal */}
      {showTeamDetails && selectedTeam && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-blue-50/95 to-blue-100/90 backdrop-blur-md rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-blue-300/50">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-blue-800">{selectedTeam.name}</h3>
                    <p className="text-blue-600 text-sm">Protocol Team Details</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowTeamDetails(false)
                    setSelectedTeam(null)
                  }}
                  className="border-blue-300/50 text-blue-800 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200"
                >
                  ✕
                </Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Team Information */}
                  <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl border border-blue-200/50 shadow-sm">
                    <h4 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      Team Information
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <div className="text-blue-800 font-semibold text-sm mb-1">Team Name:</div>
                        <div className="font-bold text-blue-700 text-lg">{selectedTeam.name}</div>
                      </div>
                      <div>
                        <div className="text-blue-800 font-semibold text-sm mb-1">Created:</div>
                        <div className="font-medium text-blue-700 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {format(new Date(selectedTeam.createdAt), "MMM dd, yyyy")}
                        </div>
                      </div>
                      {selectedTeam.description && (
                        <div>
                          <div className="text-blue-800 font-semibold text-sm mb-1">Description:</div>
                          <div className="font-medium text-blue-700 leading-relaxed">{selectedTeam.description}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Leader Details */}
                  <div className="bg-gradient-to-br from-green-50/90 to-green-100/80 backdrop-blur-sm p-6 rounded-xl border border-green-200/50 shadow-sm">
                    <h4 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      Team Leader
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-green-800 text-lg">{selectedTeam.leader.name}</div>
                          <div className="text-sm text-green-600 flex items-center gap-2 mt-1">
                            <Mail className="h-4 w-4" />
                            {selectedTeam.leader.email}
                          </div>
                          {selectedTeam.leader.phone && (
                            <div className="text-sm text-green-600 flex items-center gap-2 mt-1">
                              <Phone className="h-4 w-4" />
                              {selectedTeam.leader.phone}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedTeam.leader.email)
                            alerts.success("Copied!", "Leader email copied to clipboard")
                          }}
                          className="border-green-300 text-green-800 hover:bg-green-50 hover:border-green-400 transition-all duration-200"
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Copy Email
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div className="bg-gradient-to-br from-indigo-50/90 to-indigo-100/80 backdrop-blur-sm p-6 rounded-xl border border-indigo-200/50 shadow-sm">
                    <h4 className="font-semibold text-indigo-800 mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-500" />
                      Team Members ({selectedTeam.members.length})
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
                      {selectedTeam.members.map((member) => (
                        <div key={member._id} className="flex items-center justify-between bg-white/80 p-4 rounded-lg border border-indigo-200/50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-indigo-600">
                                {member.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold text-indigo-700">{member.name}</div>
                              <div className="text-sm text-indigo-600">{member.email}</div>
                            </div>
                          </div>
                          {member.phone && (
                            <div className="text-sm text-indigo-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Performance Stats */}
                  <div className="bg-gradient-to-br from-purple-50/90 to-purple-100/80 backdrop-blur-sm p-6 rounded-xl border border-purple-200/50 shadow-sm">
                    <h4 className="font-semibold text-purple-800 mb-4 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-500" />
                      Team Performance
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/80 p-4 rounded-lg border border-purple-200/50 text-center">
                        <div className="text-2xl font-bold text-purple-800">{selectedTeam.stats.totalVisitors}</div>
                        <div className="text-xs text-purple-600 font-medium">Total Visitors</div>
                      </div>
                      <div className="bg-white/80 p-4 rounded-lg border border-blue-200/50 text-center">
                        <div className="text-2xl font-bold text-blue-800">{selectedTeam.stats.joiningVisitors}</div>
                        <div className="text-xs text-blue-600 font-medium">Joining</div>
                      </div>
                      <div className="bg-white/80 p-4 rounded-lg border border-green-200/50 text-center">
                        <div className="text-2xl font-bold text-green-800">{selectedTeam.stats.convertedMembers}</div>
                        <div className="text-xs text-green-600 font-medium">Converted</div>
                      </div>
                      <div className="bg-white/80 p-4 rounded-lg border border-indigo-200/50 text-center">
                        <div className="text-2xl font-bold text-indigo-800">{selectedTeam.stats.conversionRate}%</div>
                        <div className="text-xs text-indigo-600 font-medium">Success Rate</div>
                      </div>
                    </div>
                  </div>

                  {/* Responsibilities */}
                  <div className="bg-gradient-to-br from-blue-50/90 to-blue-100/80 backdrop-blur-sm p-6 rounded-xl border border-blue-200/50 shadow-sm">
                    <h4 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-500" />
                      Team Responsibilities
                    </h4>
                    <div className="space-y-3">
                      {selectedTeam.responsibilities.map((responsibility, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-white/80 rounded-lg border border-blue-200/50">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-blue-700 font-medium leading-relaxed">{responsibility}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button
                  onClick={() => {
                    setShowTeamDetails(false)
                    setSelectedTeam(null)
                  }}
                  variant="outline"
                  className="flex-1 border-blue-300/50 text-blue-800 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 py-3"
                >
                  Close
                </Button>
                <Link href={`/bishop/protocol-teams/${selectedTeam._id}/manage`} className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-3">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Team
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
