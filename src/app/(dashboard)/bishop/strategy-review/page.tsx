"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';
import { useAlerts } from "@/components/ui/alert-system"
import { ProfessionalHeader } from "@/components/ProfessionalHeader"
import Link from "next/link"
import { format } from "date-fns"
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Star,
  Award,
  Users,
  Target,
  Clock,
  X,
  TrendingUp,
  ArrowLeft,
  Settings,
  LogOut,
  Eye,
  MessageSquare,
  Share,
  Lightbulb
} from "lucide-react"

interface Strategy {
  _id: string
  protocolTeam: {
    _id: string
    name: string
  }
  submittedBy: {
    _id: string
    name: string
    email: string
  }
  title: string
  description: string
  category: string
  specificSteps: string[]
  measuredResults: {
    beforeImplementation: {
      conversionRate: number
      visitorCount: number
      timeframe: string
    }
    afterImplementation: {
      conversionRate: number
      visitorCount: number
      timeframe: string
    }
    improvementPercentage: number
  }
  successStories: Array<{
    visitorName: string
    situation: string
    strategy: string
    outcome: string
    timeToConversion: number
  }>
  status: string
  difficulty: string
  tags: string[]
  resourcesNeeded: string[]
  estimatedTimeToImplement: string
  effectiveness: {
    timesShared: number
    timesImplemented: number
    averageImprovement: number
  }
  createdAt: string
}

export default function StrategyReviewPage() {
  const alerts = useAlerts()
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewing, setReviewing] = useState(false)

  const fetchStrategies = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/bishop/strategies/review', {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch strategies for review")
      }

      const result = await response.json()
      if (result.success) {
        setStrategies(result.data)
      } else {
        throw new Error(result.error || "Failed to fetch strategies")
      }
    } catch (err) {
      console.error("Error fetching strategies:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch strategies")
    } finally {
      setLoading(false)
    }
  }

  const handleReviewStrategy = async (strategyId: string, action: 'approve' | 'reject' | 'feature') => {
    try {
      setReviewing(true)
      const response = await fetch('/api/bishop/strategies/review', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({
          strategyId,
          action,
          notes: reviewNotes
        })
      })

      const result = await response.json()
      if (result.success) {
        // Update the strategy in the list
        setStrategies(prev => prev.map(s => 
          s._id === strategyId ? { ...s, status: action === 'approve' ? 'approved' : 'rejected' } : s
        ))
        setShowReviewModal(false)
        setSelectedStrategy(null)
        setReviewNotes('')
        alerts.success(`Strategy ${action === 'approve' ? 'approved' : 'rejected'} successfully`, "Success")
      } else {
        alerts.error(result.error || `Failed to ${action} strategy`, "Error")
      }
    } catch (err) {
      alerts.error(`Failed to ${action} strategy`, "Error")
    } finally {
      setReviewing(false)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50 border-green-200'
      case 'featured': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'submitted': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'visitor-outreach': return <Users className="h-4 w-4" />
      case 'conversion-techniques': return <Target className="h-4 w-4" />
      case 'follow-up-methods': return <Clock className="h-4 w-4" />
      case 'integration-strategies': return <CheckCircle className="h-4 w-4" />
      case 'team-collaboration': return <Users className="h-4 w-4" />
      default: return <Lightbulb className="h-4 w-4" />
    }
  }

  useEffect(() => {
    fetchStrategies()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-300">
        <ProfessionalHeader
          title="Strategy Review"
          subtitle="Loading strategies for review..."
        />
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <UltraFastCardSkeleton key={i} />
            ))}
          </div>

          {/* Strategies Table Skeleton */}
          <UltraFastTableSkeleton />
        </div>
      </div>
    )
  }

  const pendingStrategies = strategies.filter(s => s.status === 'submitted')
  const approvedStrategies = strategies.filter(s => s.status === 'approved' || s.status === 'featured')

  return (
    <div className="min-h-screen bg-blue-300">
      <ProfessionalHeader
        title="Protocol Strategy Review"
        subtitle="Review and approve team success strategies"
        backHref="/bishop"
        actions={[
          {
            label: "Logout",
            onClick: handleLogout,
            variant: "outline",
            className: "border-red-300 text-red-100 bg-red-600/20 hover:bg-red-600/30"
          }
        ]}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-6">
        
        {/* Pending Review */}
        <Card className="bg-orange-50 border border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Strategies Pending Review ({pendingStrategies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingStrategies.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-green-700 font-medium">All strategies have been reviewed!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingStrategies.map((strategy) => (
                  <div key={strategy._id} className="bg-white p-4 rounded-lg border border-orange-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getCategoryIcon(strategy.category)}
                          <h4 className="font-medium text-orange-800">{strategy.title}</h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {strategy.protocolTeam.name}
                          </span>
                        </div>
                        <p className="text-sm text-orange-600 mb-2">
                          Submitted by: {strategy.submittedBy.name} ({strategy.submittedBy.email})
                        </p>
                        <p className="text-sm text-orange-700 mb-3">{strategy.description}</p>
                        
                        {strategy.measuredResults.improvementPercentage > 0 && (
                          <div className="bg-green-50 p-2 rounded border border-green-200 mb-3">
                            <p className="text-sm text-green-700">
                              <strong>Measured Improvement:</strong> {strategy.measuredResults.improvementPercentage.toFixed(1)}% 
                              (from {strategy.measuredResults.beforeImplementation.conversionRate}% to {strategy.measuredResults.afterImplementation.conversionRate}%)
                            </p>
                          </div>
                        )}

                        <div className="text-xs text-orange-500">
                          Submitted: {format(new Date(strategy.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-300 text-blue-800 hover:bg-blue-100"
                          onClick={() => {
                            setSelectedStrategy(strategy)
                            setShowReviewModal(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approved Strategies */}
        <Card className="bg-green-50 border border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Award className="h-5 w-5" />
              Approved Best Practices ({approvedStrategies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {approvedStrategies.map((strategy) => (
                <div key={strategy._id} className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3 mb-2">
                    {getCategoryIcon(strategy.category)}
                    <h4 className="font-medium text-green-800">{strategy.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(strategy.status)}`}>
                      {strategy.status}
                    </span>
                  </div>
                  <p className="text-sm text-green-600 mb-2">
                    Team: {strategy.protocolTeam.name} • By: {strategy.submittedBy.name}
                  </p>
                  <p className="text-sm text-green-700 mb-3">{strategy.description}</p>
                  
                  {strategy.measuredResults.improvementPercentage > 0 && (
                    <div className="bg-green-100 p-2 rounded border border-green-300 mb-3">
                      <p className="text-xs text-green-800">
                        <TrendingUp className="h-3 w-3 inline mr-1" />
                        {strategy.measuredResults.improvementPercentage.toFixed(1)}% improvement achieved
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <Share className="h-3 w-3" />
                      Shared {strategy.effectiveness.timesShared} times
                    </div>
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      Implemented {strategy.effectiveness.timesImplemented} times
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedStrategy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                  {getCategoryIcon(selectedStrategy.category)}
                  Review Strategy: {selectedStrategy.title}
                </h3>
                <Button
                  onClick={() => {
                    setShowReviewModal(false)
                    setSelectedStrategy(null)
                    setReviewNotes('')
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-blue-800 hover:bg-blue-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Strategy Details */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Strategy Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600">Team:</span>
                      <span className="text-blue-800 ml-2">{selectedStrategy.protocolTeam.name}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Submitted by:</span>
                      <span className="text-blue-800 ml-2">{selectedStrategy.submittedBy.name}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Category:</span>
                      <span className="text-blue-800 ml-2">{selectedStrategy.category.replace('-', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Difficulty:</span>
                      <span className="text-blue-800 ml-2">{selectedStrategy.difficulty}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-blue-600">Description:</span>
                    <p className="text-blue-800 mt-1">{selectedStrategy.description}</p>
                  </div>
                </div>

                {/* Implementation Steps */}
                {selectedStrategy.specificSteps.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">Implementation Steps</h4>
                    <ol className="space-y-1">
                      {selectedStrategy.specificSteps.map((step, index) => (
                        <li key={index} className="text-sm text-green-700">
                          {index + 1}. {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Measured Results */}
                {selectedStrategy.measuredResults.improvementPercentage > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-800 mb-2">Measured Results</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-800">
                          {selectedStrategy.measuredResults.beforeImplementation.conversionRate}%
                        </div>
                        <div className="text-xs text-purple-600">Before</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-800">
                          {selectedStrategy.measuredResults.afterImplementation.conversionRate}%
                        </div>
                        <div className="text-xs text-green-600">After</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-800">
                          +{selectedStrategy.measuredResults.improvementPercentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-blue-600">Improvement</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Stories */}
                {selectedStrategy.successStories.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-3">Real Success Stories</h4>
                    <div className="space-y-3">
                      {selectedStrategy.successStories.map((story, index) => (
                        <div key={index} className="bg-white p-3 rounded border border-yellow-300">
                          <div className="flex items-center gap-2 mb-2">
                            <Star className="h-4 w-4 text-yellow-600" />
                            <span className="font-medium text-yellow-800">{story.visitorName}</span>
                            <span className="text-xs text-yellow-600">({story.timeToConversion} days to conversion)</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-yellow-600 font-medium">Situation:</span>
                              <p className="text-yellow-700">{story.situation}</p>
                            </div>
                            <div>
                              <span className="text-yellow-600 font-medium">Strategy:</span>
                              <p className="text-yellow-700">{story.strategy}</p>
                            </div>
                            <div>
                              <span className="text-yellow-600 font-medium">Outcome:</span>
                              <p className="text-yellow-700">{story.outcome}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Notes */}
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Review Notes</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800"
                    rows={3}
                    placeholder="Add any notes about this strategy..."
                  />
                </div>

                {/* Review Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleReviewStrategy(selectedStrategy._id, 'approve')}
                    disabled={reviewing}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {reviewing ? 'Processing...' : 'Approve Strategy'}
                  </Button>
                  <Button
                    onClick={() => handleReviewStrategy(selectedStrategy._id, 'feature')}
                    disabled={reviewing}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Feature as Best Practice
                  </Button>
                  <Button
                    onClick={() => handleReviewStrategy(selectedStrategy._id, 'reject')}
                    disabled={reviewing}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject Strategy
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
