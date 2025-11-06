"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';
import { ProfileManager } from "@/components/ProfileManager"
import { useAlerts } from "@/components/ui/alert-system"
import { ProfessionalHeader } from "@/components/ProfessionalHeader"

interface UserProfile {
  _id: string
  name: string
  email: string
  phone?: string
  residence?: string
  department?: string
  role: 'bishop' | 'leader' | 'member' | 'protocol'
  profilePicture?: string
  group?: {
    _id: string
    name: string
  }
  lastPasswordReset?: string
}

export default function LeaderProfilePage() {
  const alerts = useAlerts()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [members, setMembers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch profile and members in parallel
      const [profileResponse, membersResponse] = await Promise.all([
        fetch("/api/leader/profile", { credentials: "include" }),
        fetch("/api/leader/members", { credentials: "include" })
      ])
      
      if (!profileResponse.ok || !membersResponse.ok) {
        throw new Error("Failed to fetch data")
      }
      
      const [profileResult, membersResult] = await Promise.all([
        profileResponse.json(),
        membersResponse.json()
      ])
      
      if (profileResult.success && membersResult.success) {
        setUser(profileResult.data.user)
        setMembers(membersResult.members || [])
      } else {
        throw new Error("Failed to fetch data")
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = (updatedUser: UserProfile) => {
    setUser(updatedUser)
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-300">
        <ProfessionalHeader
          title="Profile Settings"
          subtitle="Loading your profile..."
        />
        
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <div className="space-y-6">
            <UltraFastCardSkeleton />
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
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-blue-300 flex items-center justify-center px-4">
        <div className="bg-blue-200/90 backdrop-blur-md rounded-lg p-6 border border-blue-300 text-center">
          <p className="text-blue-800">Profile not found.</p>
          <Link href="/leader">
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
        title="Profile Settings"
        subtitle="Manage your personal information and group member passwords"
        user={user ? {
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture
        } : undefined}
        backHref="/leader"
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <ProfileManager
          user={user}
          canResetPasswords={true}
          subordinateUsers={members}
          onProfileUpdate={handleProfileUpdate}
        />
      </div>
    </div>
  )
}
