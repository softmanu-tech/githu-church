import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import { requireSessionAndRoles } from '@/lib/authMiddleware'
import { Attendance } from '@/lib/models/Attendance'
import Event from '@/lib/models/Event'
import { User } from '@/lib/models/User'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Strict Authentication for leaders
    const { user } = await requireSessionAndRoles(request, ['leader'])
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    // Determine leader's group
    const leader = await User.findById(user.id).populate('group', 'name') as any
    if (!leader || !leader.group) {
      return NextResponse.json({ success: false, error: 'Leader group not found' }, { status: 404 })
    }

    const groupId = leader.group._id
    const groupName = leader.group.name

    // Parse months window
    const url = new URL(request.url)
    const months = Math.max(1, Math.min(24, parseInt(url.searchParams.get('months') || '6')))
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    // Fetch data scoped to the leader's group
    const [events, attendanceRecords, members] = await Promise.all([
      Event.find({ group: groupId, date: { $gte: startDate } }).sort({ date: 1 }).lean(),
      Attendance.find({ group: groupId, date: { $gte: startDate } }).sort({ date: 1 }).lean(),
      User.find({ role: 'member', group: groupId }).select('name email').lean()
    ])

    // Overall stats
    const totalEvents = events.length
    const totalAttendanceRecords = attendanceRecords.length
    const totalPresent = attendanceRecords.reduce((acc: number, rec: any) => acc + (rec.presentMembers?.length || 0), 0)
    const totalAbsent = attendanceRecords.reduce((acc: number, rec: any) => acc + (rec.absentMembers?.length || 0), 0)
    const attendanceRate = totalAttendanceRecords > 0
      ? Math.round(((totalPresent) / (totalAttendanceRecords * Math.max(1, members.length))) * 1000) / 10
      : 0
    const averageAttendancePerEvent = totalAttendanceRecords > 0
      ? Math.round((totalPresent / totalAttendanceRecords) * 10) / 10
      : 0

    // Monthly data (labelled like '2025-01')
    const monthlyMap = new Map<string, { totalPresent: number; totalEvents: number }>()
    attendanceRecords.forEach((rec: any) => {
      const d = new Date(rec.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const bucket = monthlyMap.get(key) || { totalPresent: 0, totalEvents: 0 }
      bucket.totalPresent += (rec.presentMembers?.length || 0)
      bucket.totalEvents += 1
      monthlyMap.set(key, bucket)
    })

    const monthlyKeysSorted = Array.from(monthlyMap.keys()).sort()
    const monthlyData = monthlyKeysSorted.map((month) => {
      const { totalPresent, totalEvents } = monthlyMap.get(month) as { totalPresent: number; totalEvents: number }
      const rate = totalEvents > 0
        ? Math.round(((totalPresent) / (totalEvents * Math.max(1, members.length))) * 1000) / 10
        : 0
      return { month, attendanceRate: rate, totalPresent, totalEvents }
    })

    // Trend: compare recent half vs previous half
    let trendDirection: 'improving' | 'declining' | 'stable' = 'stable'
    let trendDescription = 'Stable performance'
    if (monthlyData.length >= 2) {
      const mid = Math.floor(monthlyData.length / 2)
      const prevAvg = monthlyData.slice(0, mid).reduce((a, b) => a + b.attendanceRate, 0) / Math.max(1, mid)
      const recentAvg = monthlyData.slice(mid).reduce((a, b) => a + b.attendanceRate, 0) / Math.max(1, monthlyData.length - mid)
      const delta = Math.round((recentAvg - prevAvg) * 10) / 10
      if (delta > 1) { trendDirection = 'improving'; trendDescription = `Improving (+${delta}%)` }
      else if (delta < -1) { trendDirection = 'declining'; trendDescription = `Declining (${delta}%)` }
    }

    // Member performance (top members by attendance rate)
    const memberIdToCounts = new Map<string, number>()
    attendanceRecords.forEach((rec: any) => {
      (rec.presentMembers || []).forEach((m: any) => {
        const key = String(m)
        memberIdToCounts.set(key, (memberIdToCounts.get(key) || 0) + 1)
      })
    })
    const memberPerformance = members.map((m: any) => {
      const present = memberIdToCounts.get(String(m._id)) || 0
      const denom = Math.max(1, totalEvents) // avoid divide by zero
      const rate = Math.round((present / denom) * 1000) / 10
      return { memberId: String(m._id), memberName: m.name, attendanceRate: rate }
    }).sort((a, b) => b.attendanceRate - a.attendanceRate)

    const excellentMembers = memberPerformance.filter(m => m.attendanceRate >= 80).length
    const needsAttention = memberPerformance.filter(m => m.attendanceRate < 40).length
    const bestMonth = monthlyData.length > 0
      ? monthlyData.reduce((best, cur) => cur.attendanceRate > best.attendanceRate ? cur : best, monthlyData[0])
      : { month: 'N/A', attendanceRate: 0, totalPresent: 0, totalEvents: 0 }

    const data = {
      groupInfo: {
        groupId: String(groupId),
        groupName,
        totalEvents,
        totalAttendanceRecords
      },
      overallStats: {
        totalPresent,
        totalAbsent,
        attendanceRate,
        averageAttendancePerEvent
      },
      trend: {
        direction: trendDirection,
        description: trendDescription
      },
      monthlyData,
      insights: {
        excellentMembers,
        needsAttention,
        bestMonth
      },
      memberPerformance
    }

    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    console.error('Leader Group Performance Error:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

 
