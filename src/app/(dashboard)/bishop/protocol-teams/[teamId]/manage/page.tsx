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
  Users,
  Shield,
  ArrowLeft,
  Settings,
  Award,
  UserPlus,
  UserMinus,
  Edit,
  Save,
  X,
  Mail,
  Phone,
  CheckCircle,
  BarChart3,
  TrendingUp,
  Star,
  LogOut
} from "lucide-react"

interface TeamMember {
  _id: string
  name: string
  email: string
  phone?: string
}

interface TeamData {
  _id: string
  name: string
  description: string
  leader: TeamMember
  members: TeamMember[]
  responsibilities: string[]
  createdAt: string
  stats?: {
    totalVisitors: number
    joiningVisitors: number
    activeMonitoring: number
    convertedMembers: number
    conversionRate: number
  }
}

export default function ProtocolTeamManagePage() {
  const params = useParams()
  const teamId = params.teamId as string
  const alerts = useAlerts()

  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'members' | 'settings' | 'performance'>('members')

  // Member management states
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [addingMember, setAddingMember] = useState(false)

  // Settings states
  const [editingSettings, setEditingSettings] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [teamResponsibilities, setTeamResponsibilities] = useState<string[]>([])
  const [savingSettings, setSavingSettings] = useState(false)

  const fetchTeamData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/bishop/protocol-teams/${teamId}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch team data")
      }

      const result = await response.json()
      if (result.success) {
        setTeamData(result.data)
        setTeamName(result.data.name)
        setTeamDescription(result.data.description || '')
        setTeamResponsibilities(result.data.responsibilities || [])
      } else {
        throw new Error(result.error || "Failed to fetch team data")
      }
    } catch (err) {
      console.error("Error fetching team data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch team data")
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!newMemberName || !newMemberEmail) {
      alerts.error("Please provide both name and email", "Validation Error")
      return
    }

    try {
      setAddingMember(true)
      const response = await fetch(`/api/bishop/protocol-teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({
          memberName: newMemberName,
          memberEmail: newMemberEmail
        })
      })

      const result = await response.json()
      if (result.success) {
        setTeamData(result.data)
        setNewMemberName('')
        setNewMemberEmail('')
        setShowAddMember(false)
        alerts.success(result.message, "Success")
      } else {
        alerts.error(result.error || "Failed to add member", "Error")
      }
    } catch (err) {
      alerts.error("Failed to add member", "Error")
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      return
    }

    try {
      const response = await fetch(`/api/bishop/protocol-teams/${teamId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ memberId })
      })

      const result = await response.json()
      if (result.success) {
        setTeamData(result.data)
        alerts.success(result.message, "Success")
      } else {
        alerts.error(result.error || "Failed to remove member", "Error")
      }
    } catch (err) {
      alerts.error("Failed to remove member", "Error")
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true)
      const response = await fetch(`/api/bishop/protocol-teams/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({
          name: teamName,
          description: teamDescription,
          responsibilities: teamResponsibilities
        })
      })

      const result = await response.json()
      if (result.success) {
        setTeamData(prev => prev ? { ...prev, name: teamName, description: teamDescription, responsibilities: teamResponsibilities } : null)
        setEditingSettings(false)
        alerts.success("Team settings updated successfully", "Success")
      } else {
        alerts.error(result.error || "Failed to update settings", "Error")
      }
    } catch (err) {
      alerts.error("Failed to update settings", "Error")
    } finally {
      setSavingSettings(false)
    }
  }

  const addResponsibility = () => {
    setTeamResponsibilities([...teamResponsibilities, ''])
  }

  const updateResponsibility = (index: number, value: string) => {
    const updated = [...teamResponsibilities]
    updated[index] = value
    setTeamResponsibilities(updated)
  }

  const removeResponsibility = (index: number) => {
    setTeamResponsibilities(teamResponsibilities.filter((_, i) => i !== index))
  }

  useEffect(() => {
    fetchTeamData()
  }, [teamId])

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-300">
        <ProfessionalHeader
          title="Team Management"
          subtitle="Team Management"
        />
        
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Tabs Skeleton */}
          <div className="flex flex-col sm:flex-row gap-2 bg-blue-200/90 backdrop-blur-md rounded-lg p-2 border border-blue-300 mb-6">
            <div className="flex-1 h-10 bg-gray-200 animate-pulse rounded"></div>
            <div className="flex-1 h-10 bg-gray-200 animate-pulse rounded"></div>
            <div className="flex-1 h-10 bg-gray-200 animate-pulse rounded"></div>
          </div>

          {/* Content Skeleton */}
          <div className="space-y-6">
            <UltraFastCardSkeleton />
            <UltraFastCardSkeleton />
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
            onClick={fetchTeamData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!teamData) {
    return (
      <div className="min-h-screen bg-blue-300 flex items-center justify-center px-4">
        <div className="bg-blue-200/90 backdrop-blur-md rounded-lg p-6 border border-blue-300 text-center">
          <p className="text-blue-800">Team not found.</p>
          <Link href="/bishop/protocol-teams">
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
              Back to Teams
            </Button>
          </Link>
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
    <div className="min-h-screen bg-blue-300 overflow-x-hidden">
      <ProfessionalHeader
        title={`${teamData.name} - Management`}
        subtitle={`Leader: ${teamData.leader.name} • ${teamData.members.length} members`}
        backHref="/bishop/protocol-teams"
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

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row gap-2 bg-blue-200/90 backdrop-blur-md rounded-lg p-2 border border-blue-300">
          <Button
            variant={activeTab === 'members' ? 'default' : 'ghost'}
            className={`flex-1 ${activeTab === 'members' ? 'bg-blue-600 text-white' : 'text-blue-800 hover:bg-blue-100'}`}
            onClick={() => setActiveTab('members')}
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Members
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'default' : 'ghost'}
            className={`flex-1 ${activeTab === 'settings' ? 'bg-green-600 text-white' : 'text-blue-800 hover:bg-blue-100'}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Team Settings
          </Button>
          <Button
            variant={activeTab === 'performance' ? 'default' : 'ghost'}
            className={`flex-1 ${activeTab === 'performance' ? 'bg-purple-600 text-white' : 'text-blue-800 hover:bg-blue-100'}`}
            onClick={() => setActiveTab('performance')}
          >
            <Award className="h-4 w-4 mr-2" />
            Performance Report
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pb-8 space-y-4 sm:space-y-6">
        {activeTab === 'members' && (
          <div className="animate-fade-in space-y-6">
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Add New Member
                  </span>
                  <Button
                    onClick={() => setShowAddMember(!showAddMember)}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-800 hover:bg-blue-100"
                  >
                    {showAddMember ? 'Cancel' : 'Add Member'}
                  </Button>
                </CardTitle>
              </CardHeader>
              {showAddMember && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-2">Member Name</label>
                      <input
                        type="text"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800"
                        placeholder="Enter member name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800"
                        placeholder="member@example.com"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleAddMember}
                      disabled={addingMember || !newMemberName || !newMemberEmail}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {addingMember ? 'Adding...' : 'Add Member'}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members ({teamData.members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {teamData.members.map((member) => (
                    <div key={member._id} className="bg-white/80 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-blue-800">{member.name}</h4>
                            {member._id === teamData.leader._id && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                Leader
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-blue-600 flex items-center gap-1 mt-1">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{member.email}</span>
                          </div>
                          {member.phone && (
                            <div className="text-sm text-blue-600 flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{member.phone}</span>
                            </div>
                          )}
                        </div>
                        {member._id !== teamData.leader._id && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => handleRemoveMember(member._id, member.name)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-fade-in space-y-6">
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Team Settings
                  </span>
                  <div className="flex gap-2">
                    {editingSettings ? (
                      <>
                        <Button
                          onClick={handleSaveSettings}
                          disabled={savingSettings}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          {savingSettings ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingSettings(false)
                            setTeamName(teamData.name)
                            setTeamDescription(teamData.description || '')
                            setTeamResponsibilities(teamData.responsibilities || [])
                          }}
                          variant="outline"
                          size="sm"
                          className="border-blue-300 text-blue-800 hover:bg-blue-100"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => setEditingSettings(true)}
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-800 hover:bg-blue-100"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Team Name</label>
                  {editingSettings ? (
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800"
                    />
                  ) : (
                    <p className="text-blue-700 font-medium">{teamData.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Description</label>
                  {editingSettings ? (
                    <textarea
                      value={teamDescription}
                      onChange={(e) => setTeamDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800"
                      rows={3}
                    />
                  ) : (
                    <p className="text-blue-700">{teamData.description || 'No description provided'}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-blue-800">Team Responsibilities</label>
                    {editingSettings && (
                      <Button
                        onClick={addResponsibility}
                        size="sm"
                        variant="outline"
                        className="border-blue-300 text-blue-800 hover:bg-blue-100"
                      >
                        Add Responsibility
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {teamResponsibilities.map((responsibility, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {editingSettings ? (
                          <>
                            <input
                              type="text"
                              value={responsibility}
                              onChange={(e) => updateResponsibility(index, e.target.value)}
                              className="flex-1 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800"
                            />
                            <Button
                              onClick={() => removeResponsibility(index)}
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-blue-700">{responsibility}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Team Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                    <div>
                      <span className="text-blue-600">Created:</span>
                      <span className="text-blue-800 ml-2">{format(new Date(teamData.createdAt), "MMM dd, yyyy")}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Total Visitors:</span>
                      <span className="text-blue-800 ml-2">{teamData.stats?.totalVisitors || 0}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Conversion Rate:</span>
                      <span className="text-blue-800 ml-2">{teamData.stats?.conversionRate || 0}%</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Active Monitoring:</span>
                      <span className="text-blue-800 ml-2">{teamData.stats?.activeMonitoring || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="animate-fade-in space-y-6">
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Performance Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white/80 p-4 rounded-lg border border-blue-200 text-center">
                    <div className="text-2xl font-bold text-blue-800">{teamData.stats?.totalVisitors || 0}</div>
                    <div className="text-sm text-blue-600">Total Visitors</div>
                  </div>
                  <div className="bg-white/80 p-4 rounded-lg border border-blue-200 text-center">
                    <div className="text-2xl font-bold text-green-800">{teamData.stats?.convertedMembers || 0}</div>
                    <div className="text-sm text-green-600">Converted</div>
                  </div>
                  <div className="bg-white/80 p-4 rounded-lg border border-blue-200 text-center">
                    <div className="text-2xl font-bold text-purple-800">{teamData.stats?.conversionRate || 0}%</div>
                    <div className="text-sm text-purple-600">Conversion Rate</div>
                  </div>
                  <div className="bg-white/80 p-4 rounded-lg border border-blue-200 text-center">
                    <div className="text-2xl font-bold text-orange-800">{teamData.stats?.activeMonitoring || 0}</div>
                    <div className="text-sm text-orange-600">Active Monitoring</div>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-blue-600">Detailed performance analytics will be available soon.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
