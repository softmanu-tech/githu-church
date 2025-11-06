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
  Plus,
  Edit,
  Save,
  X,
  Star,
  TrendingUp,
  Users,
  Target,
  Clock,
  Award,
  CheckCircle,
  ArrowLeft,
  Lightbulb,
  FileText,
  BarChart3
} from "lucide-react"

interface Strategy {
  _id: string
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
  createdAt: string
}

export default function ProtocolStrategiesPage() {
  const alerts = useAlerts()
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingStrategy, setEditingStrategy] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'conversion-techniques',
    specificSteps: [''],
    beforeConversionRate: 0,
    beforeVisitorCount: 0,
    beforeTimeframe: '',
    afterConversionRate: 0,
    afterVisitorCount: 0,
    afterTimeframe: '',
    successStories: [{
      visitorName: '',
      situation: '',
      strategy: '',
      outcome: '',
      timeToConversion: 0
    }],
    difficulty: 'beginner',
    tags: '',
    resourcesNeeded: '',
    estimatedTime: ''
  })

  const categories = [
    { value: 'visitor-outreach', label: 'Visitor Outreach' },
    { value: 'conversion-techniques', label: 'Conversion Techniques' },
    { value: 'follow-up-methods', label: 'Follow-up Methods' },
    { value: 'integration-strategies', label: 'Integration Strategies' },
    { value: 'team-collaboration', label: 'Team Collaboration' },
    { value: 'other', label: 'Other' }
  ]

  const difficulties = [
    { value: 'beginner', label: 'Beginner', color: 'text-blue-600 bg-green-50' },
    { value: 'intermediate', label: 'Intermediate', color: 'text-orange-600 bg-orange-50' },
    { value: 'advanced', label: 'Advanced', color: 'text-red-600 bg-red-50' }
  ]

  const fetchStrategies = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/protocol/strategies', {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch strategies")
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

  const handleSubmitStrategy = async () => {
    if (!formData.title || !formData.description) {
      alerts.error("Validation Error", "Please provide title and description")
      return
    }

    try {
      setSubmitting(true)
      
      // Calculate improvement percentage
      const improvementPercentage = formData.beforeConversionRate > 0 ? 
        ((formData.afterConversionRate - formData.beforeConversionRate) / formData.beforeConversionRate) * 100 : 0

      const strategyData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        specificSteps: formData.specificSteps.filter(step => step.trim() !== ''),
        measuredResults: {
          beforeImplementation: {
            conversionRate: formData.beforeConversionRate,
            visitorCount: formData.beforeVisitorCount,
            timeframe: formData.beforeTimeframe
          },
          afterImplementation: {
            conversionRate: formData.afterConversionRate,
            visitorCount: formData.afterVisitorCount,
            timeframe: formData.afterTimeframe
          },
          improvementPercentage
        },
        successStories: formData.successStories.filter(story => story.visitorName.trim() !== ''),
        difficulty: formData.difficulty,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        resourcesNeeded: formData.resourcesNeeded.split(',').map(resource => resource.trim()).filter(resource => resource !== ''),
        estimatedTimeToImplement: formData.estimatedTime
      }

      const response = await fetch('/api/protocol/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify(strategyData)
      })

      const result = await response.json()
      if (result.success) {
        setStrategies([result.data, ...strategies])
        resetForm()
        setShowCreateForm(false)
        alerts.success("Strategy Submitted", "Strategy submitted successfully! It will be reviewed by the bishop.")
      } else {
        alerts.error("Submission Error", result.error || "Failed to submit strategy")
      }
    } catch (err) {
      alerts.error("Submission Error", "Failed to submit strategy")
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'conversion-techniques',
      specificSteps: [''],
      beforeConversionRate: 0,
      beforeVisitorCount: 0,
      beforeTimeframe: '',
      afterConversionRate: 0,
      afterVisitorCount: 0,
      afterTimeframe: '',
      successStories: [{
        visitorName: '',
        situation: '',
        strategy: '',
        outcome: '',
        timeToConversion: 0
      }],
      difficulty: 'beginner',
      tags: '',
      resourcesNeeded: '',
      estimatedTime: ''
    })
  }

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      specificSteps: [...prev.specificSteps, '']
    }))
  }

  const updateStep = (index: number, value: string) => {
    const updated = [...formData.specificSteps]
    updated[index] = value
    setFormData(prev => ({ ...prev, specificSteps: updated }))
  }

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specificSteps: prev.specificSteps.filter((_, i) => i !== index)
    }))
  }

  const addSuccessStory = () => {
    setFormData(prev => ({
      ...prev,
      successStories: [...prev.successStories, {
        visitorName: '',
        situation: '',
        strategy: '',
        outcome: '',
        timeToConversion: 0
      }]
    }))
  }

  const updateSuccessStory = (index: number, field: string, value: string | number) => {
    const updated = [...formData.successStories]
    updated[index] = { ...updated[index], [field]: value }
    setFormData(prev => ({ ...prev, successStories: updated }))
  }

  const removeSuccessStory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      successStories: prev.successStories.filter((_, i) => i !== index)
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-blue-600 bg-green-50 border-blue-200'
      case 'featured': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'submitted': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'draft': return 'text-gray-600 bg-gray-50 border-gray-200'
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
          title="Protocol Strategies"
          subtitle="Loading protocol strategies..."
        />
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <UltraFastCardSkeleton key={i} />
            ))}
          </div>

          {/* Strategies Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <UltraFastCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-300">
      <ProfessionalHeader
        title="Success Strategies Documentation"
        subtitle="Document and share your team's proven visitor conversion strategies"
        backHref="/protocol"
        actions={[
          {
            label: "Add Strategy",
            onClick: () => setShowCreateForm(true),
            variant: "default",
            icon: <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
          },
          {
            label: "View Analytics",
            onClick: () => setShowAnalytics(!showAnalytics),
            variant: "outline",
            className: "border-blue-300 text-blue-100 bg-blue-600/20 hover:bg-blue-600/30",
            icon: <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
          }
        ]}
      />

      <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 md:py-6 lg:py-8 space-y-4 sm:space-y-6">
        
        {/* Analytics Section */}
        {showAnalytics && (
          <div className="animate-fade-in">
            <Card className="bg-blue-50 border border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Strategy Analytics
                  </span>
                  <Button
                    onClick={() => setShowAnalytics(false)}
                    variant="ghost"
                    size="sm"
                    className="text-blue-800 hover:bg-blue-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
                
                {/* Strategy Statistics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white p-3 rounded border border-blue-200 text-center">
                    <div className="text-lg sm:text-xl font-bold text-blue-800">{strategies.length}</div>
                    <div className="text-xs sm:text-sm text-blue-600">Total Strategies</div>
                  </div>
                  <div className="bg-white p-3 rounded border border-blue-200 text-center">
                    <div className="text-lg sm:text-xl font-bold text-blue-800">
                      {strategies.filter(s => s.status === 'approved' || s.status === 'featured').length}
                    </div>
                    <div className="text-xs sm:text-sm text-blue-600">Approved</div>
                  </div>
                  <div className="bg-white p-3 rounded border border-blue-200 text-center">
                    <div className="text-lg sm:text-xl font-bold text-orange-800">
                      {strategies.filter(s => s.status === 'submitted').length}
                    </div>
                    <div className="text-xs sm:text-sm text-orange-600">Pending</div>
                  </div>
                  <div className="bg-white p-3 rounded border border-blue-200 text-center">
                    <div className="text-lg sm:text-xl font-bold text-purple-800">
                      {strategies.filter(s => s.status === 'featured').length}
                    </div>
                    <div className="text-xs sm:text-sm text-purple-600">Featured</div>
                  </div>
                </div>

                {/* Category Breakdown */}
                <div>
                  <h4 className="font-medium text-blue-800 mb-3">Strategy Categories</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categories.map(category => {
                      const count = strategies.filter(s => s.category === category.value).length
                      return (
                        <div key={category.value} className="bg-white p-3 rounded border border-blue-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-800">{category.label}</span>
                            <span className="text-lg font-bold text-blue-700">{count}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Effectiveness Overview */}
                {strategies.length > 0 && (
                  <div>
                    <h4 className="font-medium text-blue-800 mb-3">Effectiveness Overview</h4>
                    <div className="bg-white p-4 rounded border border-blue-200">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-800">
                            {(strategies.reduce((sum, s) => sum + s.measuredResults.improvementPercentage, 0) / strategies.length).toFixed(1)}%
                          </div>
                          <div className="text-sm text-blue-600">Average Improvement</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-800">
                            {Math.max(...strategies.map(s => s.measuredResults.improvementPercentage)).toFixed(1)}%
                          </div>
                          <div className="text-sm text-blue-600">Best Performance</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-800">
                              {strategies.filter(s => s.measuredResults.improvementPercentage > 20).length}
                          </div>
                          <div className="text-sm text-purple-600">High Impact (&gt;20%)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Performance Insights */}
                <div>
                  <h4 className="font-medium text-blue-800 mb-3">Performance Insights</h4>
                  <div className="space-y-3">
                    {strategies.length === 0 ? (
                      <div className="bg-white p-4 rounded border border-blue-200 text-center">
                        <p className="text-blue-600">No strategies documented yet. Create your first strategy to see analytics.</p>
                      </div>
                    ) : (
                      <>
                        {strategies.filter(s => s.measuredResults.improvementPercentage > 30).length > 0 && (
                          <div className="bg-blue-100 p-3 rounded border border-blue-300">
                            <h5 className="font-medium text-blue-800 mb-1">🎯 Top Performing Strategies</h5>
                            <p className="text-sm text-blue-700">
                              {strategies.filter(s => s.measuredResults.improvementPercentage > 30).length} strategies 
                              show exceptional results (&gt;30% improvement)
                            </p>
                          </div>
                        )}
                        
                        {strategies.filter(s => s.status === 'featured').length > 0 && (
                          <div className="bg-purple-100 p-3 rounded border border-purple-300">
                            <h5 className="font-medium text-purple-800 mb-1">⭐ Featured Strategies</h5>
                            <p className="text-sm text-purple-700">
                              {strategies.filter(s => s.status === 'featured').length} strategies 
                              have been featured as best practices
                            </p>
                          </div>
                        )}
                        
                        {strategies.filter(s => s.difficulty === 'beginner').length > 0 && (
                          <div className="bg-blue-100 p-3 rounded border border-blue-300">
                            <h5 className="font-medium text-blue-800 mb-1">🚀 Easy to Implement</h5>
                            <p className="text-sm text-blue-700">
                              {strategies.filter(s => s.difficulty === 'beginner').length} strategies 
                              are beginner-friendly and easy to start with
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Create Strategy Form */}
        {showCreateForm && (
          <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Document New Success Strategy
                </span>
                <Button
                  onClick={() => {
                    setShowCreateForm(false)
                    resetForm()
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-blue-800 hover:bg-blue-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Strategy Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-2 sm:px-3 py-2 sm:py-3 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 text-sm sm:text-base"
                    placeholder="e.g., Personal Follow-up Phone Calls"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-2 sm:px-3 py-2 sm:py-3 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 text-sm sm:text-base"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">Strategy Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-2 sm:px-3 py-2 sm:py-3 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 text-sm sm:text-base"
                  rows={3}
                  placeholder="Describe your strategy in detail..."
                  maxLength={1000}
                />
                <div className="text-xs text-blue-600 mt-1">{formData.description.length}/1000 characters</div>
              </div>

              {/* Specific Steps */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-blue-800">Specific Implementation Steps</label>
                  <Button
                    onClick={addStep}
                    size="sm"
                    variant="outline"
                    className="border-blue-300 text-blue-800 hover:bg-blue-100"
                  >
                    Add Step
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.specificSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm text-blue-600 font-medium">{index + 1}.</span>
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => updateStep(index, e.target.value)}
                        className="flex-1 px-2 sm:px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 text-sm sm:text-base"
                        placeholder="Describe this step..."
                        maxLength={500}
                      />
                      {formData.specificSteps.length > 1 && (
                        <Button
                          onClick={() => removeStep(index)}
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Measured Results */}
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-3">Measured Results (Before vs After)</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h5 className="text-sm font-medium text-blue-700 mb-2">Before Implementation</h5>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-blue-600 mb-1">Conversion Rate (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.beforeConversionRate}
                          onChange={(e) => setFormData(prev => ({ ...prev, beforeConversionRate: Number(e.target.value) }))}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-blue-300 rounded text-blue-800 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-blue-600 mb-1">Visitor Count</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.beforeVisitorCount}
                          onChange={(e) => setFormData(prev => ({ ...prev, beforeVisitorCount: Number(e.target.value) }))}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-blue-300 rounded text-blue-800 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-blue-600 mb-1">Timeframe</label>
                        <input
                          type="text"
                          value={formData.beforeTimeframe}
                          onChange={(e) => setFormData(prev => ({ ...prev, beforeTimeframe: e.target.value }))}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-blue-300 rounded text-blue-800 text-xs sm:text-sm"
                          placeholder="e.g., 3 months"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-blue-700 mb-2">After Implementation</h5>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-blue-600 mb-1">Conversion Rate (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.afterConversionRate}
                          onChange={(e) => setFormData(prev => ({ ...prev, afterConversionRate: Number(e.target.value) }))}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-blue-300 rounded text-blue-800 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-blue-600 mb-1">Visitor Count</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.afterVisitorCount}
                          onChange={(e) => setFormData(prev => ({ ...prev, afterVisitorCount: Number(e.target.value) }))}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-blue-300 rounded text-blue-800 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-blue-600 mb-1">Timeframe</label>
                        <input
                          type="text"
                          value={formData.afterTimeframe}
                          onChange={(e) => setFormData(prev => ({ ...prev, afterTimeframe: e.target.value }))}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-blue-300 rounded text-blue-800 text-xs sm:text-sm"
                          placeholder="e.g., 3 months"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {formData.beforeConversionRate > 0 && formData.afterConversionRate > 0 && (
                  <div className="mt-3 p-2 bg-green-50 rounded border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <strong>Improvement:</strong> {((formData.afterConversionRate - formData.beforeConversionRate) / formData.beforeConversionRate * 100).toFixed(1)}% increase
                    </p>
                  </div>
                )}
              </div>

              {/* Success Stories */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-blue-800">Success Stories (Real Examples)</label>
                  <Button
                    onClick={addSuccessStory}
                    size="sm"
                    variant="outline"
                    className="border-blue-300 text-blue-800 hover:bg-blue-100"
                  >
                    Add Story
                  </Button>
                </div>
                <div className="space-y-4">
                  {formData.successStories.map((story, index) => (
                    <div key={index} className="bg-white/80 p-3 rounded-lg border border-blue-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-blue-600 mb-1">Visitor Name (First name only)</label>
                          <input
                            type="text"
                            value={story.visitorName}
                            onChange={(e) => updateSuccessStory(index, 'visitorName', e.target.value)}
                            className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-blue-300 rounded text-blue-800 text-xs sm:text-sm"
                            placeholder="e.g., John"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-blue-600 mb-1">Time to Conversion (days)</label>
                          <input
                            type="number"
                            min="1"
                            value={story.timeToConversion}
                            onChange={(e) => updateSuccessStory(index, 'timeToConversion', Number(e.target.value))}
                            className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-blue-300 rounded text-blue-800 text-xs sm:text-sm"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-blue-600 mb-1">Situation</label>
                          <textarea
                            value={story.situation}
                            onChange={(e) => updateSuccessStory(index, 'situation', e.target.value)}
                            className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-blue-300 rounded text-blue-800 text-xs sm:text-sm"
                            rows={2}
                            placeholder="Describe the visitor's initial situation..."
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-blue-600 mb-1">Strategy Used</label>
                          <textarea
                            value={story.strategy}
                            onChange={(e) => updateSuccessStory(index, 'strategy', e.target.value)}
                            className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-blue-300 rounded text-blue-800 text-xs sm:text-sm"
                            rows={2}
                            placeholder="What specific strategy did you use?"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-blue-600 mb-1">Outcome</label>
                          <textarea
                            value={story.outcome}
                            onChange={(e) => updateSuccessStory(index, 'outcome', e.target.value)}
                            className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-blue-300 rounded text-blue-800 text-xs sm:text-sm"
                            rows={2}
                            placeholder="What was the result?"
                          />
                        </div>
                      </div>
                      {formData.successStories.length > 1 && (
                        <div className="mt-2 flex justify-end">
                          <Button
                            onClick={() => removeSuccessStory(index)}
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            Remove Story
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Difficulty Level</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full px-2 sm:px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 text-sm sm:text-base"
                  >
                    {difficulties.map(diff => (
                      <option key={diff.value} value={diff.value}>{diff.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-2 sm:px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 text-sm sm:text-base"
                    placeholder="e.g., follow-up, phone-calls, personal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Time to Implement</label>
                  <input
                    type="text"
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: e.target.value }))}
                    className="w-full px-2 sm:px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800 text-sm sm:text-base"
                    placeholder="e.g., 2 weeks"
                  />
                </div>
              </div>

              {/* Resources Needed */}
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">Resources Needed (comma-separated)</label>
                <input
                  type="text"
                  value={formData.resourcesNeeded}
                  onChange={(e) => setFormData(prev => ({ ...prev, resourcesNeeded: e.target.value }))}
                  className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800"
                  placeholder="e.g., phone, contact list, follow-up schedule"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitStrategy}
                  disabled={submitting || !formData.title || !formData.description}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {submitting ? 'Submitting...' : 'Submit Strategy for Review'}
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateForm(false)
                    resetForm()
                  }}
                  variant="outline"
                  className="border-blue-300 text-blue-800 hover:bg-blue-100"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Strategies */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-blue-800">Your Team's Documented Strategies</h2>
          
          {strategies.length === 0 ? (
            <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-blue-800 mb-2">No Strategies Documented Yet</h3>
                <p className="text-blue-600 mb-4">
                  Start documenting your successful visitor conversion strategies to share with other protocol teams.
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Document Your First Strategy
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {strategies.map((strategy) => (
                <Card key={strategy._id} className="bg-white/90 border border-blue-200 overflow-hidden">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        {getCategoryIcon(strategy.category)}
                        {strategy.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(strategy.status)}`}>
                          {strategy.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${difficulties.find(d => d.value === strategy.difficulty)?.color}`}>
                          {strategy.difficulty}
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
                    <p className="text-sm text-blue-700">{strategy.description}</p>
                    
                    {strategy.specificSteps.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-blue-800 mb-2">Implementation Steps:</h5>
                        <ol className="space-y-1">
                          {strategy.specificSteps.map((step, index) => (
                            <li key={index} className="text-xs text-blue-600">
                              {index + 1}. {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {strategy.measuredResults.improvementPercentage > 0 && (
                      <div className="bg-green-50 p-2 sm:p-3 rounded border border-blue-200">
                        <h5 className="text-sm font-medium text-blue-800 mb-1">Measured Improvement</h5>
                        <p className="text-xs sm:text-sm text-blue-700">
                          Conversion rate improved from {strategy.measuredResults.beforeImplementation.conversionRate}% 
                          to {strategy.measuredResults.afterImplementation.conversionRate}% 
                          ({strategy.measuredResults.improvementPercentage.toFixed(1)}% increase)
                        </p>
                      </div>
                    )}

                    {strategy.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {strategy.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-blue-500">
                      Submitted: {format(new Date(strategy.createdAt), "MMM dd, yyyy")}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
