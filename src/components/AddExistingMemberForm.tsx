"use client"

import React, { useState, useEffect } from "react"
import { X, User, Mail, Phone, MapPin, Building, Search, Users, Plus } from "lucide-react"
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';
import { useAlerts } from "@/components/ui/alert-system"

interface AvailableMember {
  _id: string
  name: string
  email: string
  phone: string
  residence: string
  department: string
  currentGroups: string
}

interface AddExistingMemberFormProps {
  groupId: string
  onMemberAdded: () => void
}

export function AddExistingMemberForm({ groupId, onMemberAdded }: AddExistingMemberFormProps) {
  const alerts = useAlerts()
  const [members, setMembers] = useState<AvailableMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<AvailableMember[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetchingMembers, setFetchingMembers] = useState(true)
  const [error, setError] = useState("")
  const [selectedMember, setSelectedMember] = useState<AvailableMember | null>(null)

  // Fetch available members
  const fetchAvailableMembers = async () => {
    try {
      setFetchingMembers(true)
      setError("")
      
      const response = await fetch("/api/leader/available-members", {
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error("Failed to fetch available members")
      }

      const result = await response.json()
      if (result.success) {
        setMembers(result.data.members)
        setFilteredMembers(result.data.members)
      } else {
        throw new Error(result.error || "Failed to fetch available members")
      }
    } catch (err) {
      console.error("Error fetching available members:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch available members")
    } finally {
      setFetchingMembers(false)
    }
  }

  // Filter members based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMembers(members)
    } else {
      const filtered = members.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.department.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredMembers(filtered)
    }
  }, [searchTerm, members])

  useEffect(() => {
    fetchAvailableMembers()
  }, [])

  const handleAddMember = async (member: AvailableMember) => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch("/api/leader/add-existing-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          memberId: member._id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to add member to group")
      }

      alerts.success(
        "Member Added Successfully!",
        `${member.name} has been added to your group.`,
        []
      )

      onMemberAdded()
    } catch (error) {
      console.error("Error adding member:", error)
      setError(error instanceof Error ? error.message : "Failed to add member to group")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSearchTerm("")
    setSelectedMember(null)
    setError("")
    onMemberAdded() // This will close the modal
  }

  return (
    <div className="fixed inset-0 bg-blue-900/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-blue-200/95 backdrop-blur-md rounded-lg shadow-xl max-w-4xl w-full mx-4 border border-blue-300 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-300">
          <h2 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Add Existing Member
          </h2>
          <button
            onClick={handleClose}
            className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-blue-800 mb-2">
              <Search className="h-4 w-4 inline mr-1" />
              Search Members
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 text-blue-800 placeholder-blue-600 bg-white/90"
              placeholder="Search by name, email, phone, or department..."
              disabled={fetchingMembers}
            />
          </div>

          {/* Members List */}
          {fetchingMembers ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading available members...</span>
                </div>
              </div>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-blue-400 mb-4" />
              <p className="text-blue-600">
                {searchTerm ? "No members found matching your search." : "No available members to add."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-blue-600 mb-4">
                Found {filteredMembers.length} available member{filteredMembers.length !== 1 ? 's' : ''}
              </div>
              
              {filteredMembers.map((member) => (
                <div
                  key={member._id}
                  className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-lg p-4 hover:bg-white/90 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-blue-800">{member.name}</h3>
                          <p className="text-sm text-blue-600">{member.email}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-600 ml-13">
                        {member.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                        {member.residence && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{member.residence}</span>
                          </div>
                        )}
                        {member.department && (
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            <span>{member.department}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-13 mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Current: {member.currentGroups}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleAddMember(member)}
                      disabled={loading}
                      className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Adding...</span>
                        </div>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Add to Group
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-blue-300 bg-blue-100/50">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-800 bg-white/80 backdrop-blur-sm hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
