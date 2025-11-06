"use client"

import React, { useState, useEffect } from "react"
import { X, Save, User, Mail, Users } from "lucide-react"
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';
import { useAlerts } from "@/components/ui/alert-system"

interface Group {
  _id: string
  name: string
}

interface Leader {
  _id: string
  name: string
  email: string
  group?: {
    _id: string
    name: string
  }
}

interface EditLeaderModalProps {
  leader: Leader
  groups: Group[]
  isOpen: boolean
  onClose: () => void
  onLeaderUpdated: () => void
}

export function EditLeaderModal({ 
  leader, 
  groups, 
  isOpen, 
  onClose, 
  onLeaderUpdated 
}: EditLeaderModalProps) {
  const alerts = useAlerts()
  const [name, setName] = useState(leader.name)
  const [email, setEmail] = useState(leader.email)
  const [groupId, setGroupId] = useState(leader.group?._id || "")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Reset form when leader changes
  useEffect(() => {
    setName(leader.name)
    setEmail(leader.email)
    setGroupId(leader.group?._id || "")
    setPassword("")
    setError("")
  }, [leader])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!name.trim() || !email.trim()) {
        throw new Error("Name and email are required")
      }

      const response = await fetch(`/api/bishop/leaders/${leader._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          group: groupId || null,
          ...(password.trim() && { password: password.trim() }),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update leader")
      }

      // Show beautiful success alert
      alerts.success(
        "Leader Updated Successfully!",
        `${name}'s information has been updated and saved to the system.`,
        [
          {
            label: "View Leaders",
            action: () => window.location.reload(),
            variant: "primary"
          }
        ]
      )

      onLeaderUpdated()
      onClose()
    } catch (err) {
      console.error("Error updating leader:", err)
      setError(err instanceof Error ? err.message : "Failed to update leader")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-blue-900/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-blue-200/95 backdrop-blur-md rounded-lg shadow-xl max-w-md w-full mx-4 border border-blue-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-300">
          <h2 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Leader
          </h2>
          <button
            onClick={onClose}
            className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-1">
                <User className="h-4 w-4 inline mr-1" />
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 text-blue-800 placeholder-blue-600 bg-white/90"
                placeholder="Enter leader's full name"
                required
                disabled={loading}
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-1">
                <Mail className="h-4 w-4 inline mr-1" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 text-blue-800 placeholder-blue-600 bg-white/90"
                placeholder="Enter email address"
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-1">
                New Password (optional)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 text-blue-800 placeholder-blue-600 bg-white/90"
                placeholder="Leave blank to keep current password"
                disabled={loading}
              />
              <p className="text-xs text-blue-600 mt-1">
                Only enter a new password if you want to change it
              </p>
            </div>

            {/* Group Assignment */}
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-1">
                <Users className="h-4 w-4 inline mr-1" />
                Assigned Group
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 text-blue-800 bg-white/90"
                disabled={loading}
              >
                <option value="">No group assigned</option>
                {groups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-blue-600 mt-1">
                Change group assignment to reassign this leader
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-blue-300">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-800 bg-white/80 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
