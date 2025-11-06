import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { Group } from '@/lib/models/Group';
import { Attendance } from '@/lib/models/Attendance';
import Event from '@/lib/models/Event';
import Member from '@/lib/models/Member';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get date range (default to last 6 months)
    const url = new URL(request.url);
    const months = parseInt(url.searchParams.get('months') || '6');
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get all groups with their leaders - handle gracefully if collections are empty
    let groups: any[] = [];
    try {
      groups = await Group.find()
        .populate('leader', 'name email')
        .lean();
    } catch (error) {
      console.log('Group collection not found or empty');
      groups = [];
    }

    // Get all attendance records within date range
    let attendanceRecords: any[] = [];
    try {
      attendanceRecords = await Attendance.find({
        date: { $gte: startDate }
      })
      .populate('group', 'name')
      .populate('event', 'title date')
      .populate('presentMembers', 'name email')
      .populate('absentMembers', 'name email')
      .sort({ date: 1 })
      .lean();
    } catch (error) {
      console.log('Attendance collection not found or empty');
      attendanceRecords = [];
    }

    // Get all events within date range
    let events: any[] = [];
    try {
      events = await Event.find({
        date: { $gte: startDate }
      })
      .populate('group', 'name')
      .sort({ date: 1 })
      .lean();
    } catch (error) {
      console.log('Event collection not found or empty');
      events = [];
    }

    // Get all members
    let allMembers: any[] = [];
    try {
      allMembers = await Member.find().populate('group', 'name').lean();
    } catch (error) {
      console.log('Member collection not found or empty');
      allMembers = [];
    }

    // Group performance analysis
    const groupPerformance = await Promise.all(groups.map(async (group) => {
      const groupAttendance = attendanceRecords.filter(record => 
        record.group._id.toString() === (group._id as any).toString()
      );
      
      const groupEvents = events.filter(event => 
        event.group._id.toString() === (group._id as any).toString()
      );

      const groupMembers = allMembers.filter(member => 
        member.group && member.group._id.toString() === (group._id as any).toString()
      );

      const totalPresent = groupAttendance.reduce((sum, record) => 
        sum + (record.presentMembers?.length || 0), 0
      );
      const totalAbsent = groupAttendance.reduce((sum, record) => 
        sum + (record.absentMembers?.length || 0), 0
      );
      const totalAttendees = totalPresent + totalAbsent;
      const attendanceRate = totalAttendees > 0 ? (totalPresent / totalAttendees) * 100 : 0;

      // Monthly breakdown for this group
      const monthlyData = [];
      const currentDate = new Date();
      
      for (let i = months - 1; i >= 0; i--) {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
        
        const monthAttendance = groupAttendance.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= monthStart && recordDate <= monthEnd;
        });

        const monthPresent = monthAttendance.reduce((sum, record) => 
          sum + (record.presentMembers?.length || 0), 0
        );
        const monthAbsent = monthAttendance.reduce((sum, record) => 
          sum + (record.absentMembers?.length || 0), 0
        );
        const monthTotal = monthPresent + monthAbsent;
        const monthRate = monthTotal > 0 ? (monthPresent / monthTotal) * 100 : 0;

        monthlyData.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
          attendanceRate: Math.round(monthRate * 10) / 10,
          presentCount: monthPresent,
          eventsCount: monthAttendance.length
        });
      }

      // Calculate trend
      const recentMonths = monthlyData.slice(-3);
      const previousMonths = monthlyData.slice(-6, -3);
      const recentAvg = recentMonths.length > 0 
        ? recentMonths.reduce((sum, month) => sum + month.attendanceRate, 0) / recentMonths.length 
        : 0;
      const previousAvg = previousMonths.length > 0 
        ? previousMonths.reduce((sum, month) => sum + month.attendanceRate, 0) / previousMonths.length 
        : 0;
      
      const trend = recentAvg > previousAvg ? 'improving' : recentAvg < previousAvg ? 'declining' : 'stable';
      const trendPercentage = previousAvg > 0 ? Math.round(((recentAvg - previousAvg) / previousAvg) * 100 * 10) / 10 : 0;

      return {
        groupId: (group._id as any).toString(),
        groupName: group.name,
        leaderName: group.leader?.name || 'Unassigned',
        leaderEmail: group.leader?.email || '',
        memberCount: groupMembers.length,
        eventsCount: groupEvents.length,
        attendanceRecords: groupAttendance.length,
        totalPresent,
        totalAbsent,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        averageAttendancePerEvent: groupAttendance.length > 0 
          ? Math.round((totalPresent / groupAttendance.length) * 10) / 10 
          : 0,
        monthlyData,
        trend: {
          direction: trend,
          percentage: trendPercentage
        },
        performance: attendanceRate >= 80 ? 'Excellent' : 
                    attendanceRate >= 65 ? 'Good' : 
                    attendanceRate >= 50 ? 'Average' : 'Needs Improvement'
      };
    }));

    // Sort groups by attendance rate
    const sortedGroups = groupPerformance.sort((a, b) => b.attendanceRate - a.attendanceRate);

    // Church-wide monthly comparison
    const churchWideMonthly = [];
    const currentDate = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
      
      const monthAttendance = attendanceRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= monthStart && recordDate <= monthEnd;
      });

      const monthPresent = monthAttendance.reduce((sum, record) => 
        sum + (record.presentMembers?.length || 0), 0
      );
      const monthAbsent = monthAttendance.reduce((sum, record) => 
        sum + (record.absentMembers?.length || 0), 0
      );
      const monthTotal = monthPresent + monthAbsent;
      const monthRate = monthTotal > 0 ? (monthPresent / monthTotal) * 100 : 0;

      churchWideMonthly.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        attendanceRate: Math.round(monthRate * 10) / 10,
        presentCount: monthPresent,
        totalEvents: monthAttendance.length,
        activeGroups: new Set(monthAttendance.map(record => record.group._id.toString())).size
      });
    }

    // Overall church statistics
    const totalPresent = attendanceRecords.reduce((sum, record) => 
      sum + (record.presentMembers?.length || 0), 0
    );
    const totalAbsent = attendanceRecords.reduce((sum, record) => 
      sum + (record.absentMembers?.length || 0), 0
    );
    const totalAttendees = totalPresent + totalAbsent;
    const overallAttendanceRate = totalAttendees > 0 ? (totalPresent / totalAttendees) * 100 : 0;

    // Performance insights
    const excellentGroups = sortedGroups.filter(g => g.performance === 'Excellent').length;
    const needsImprovementGroups = sortedGroups.filter(g => g.performance === 'Needs Improvement').length;
    const improvingGroups = sortedGroups.filter(g => g.trend.direction === 'improving').length;
    const decliningGroups = sortedGroups.filter(g => g.trend.direction === 'declining').length;

    return NextResponse.json({
      success: true,
      data: {
        overallStats: {
          totalGroups: groups.length,
          totalMembers: allMembers.length,
          totalEvents: events.length,
          totalAttendanceRecords: attendanceRecords.length,
          overallAttendanceRate: Math.round(overallAttendanceRate * 10) / 10,
          averageGroupSize: groups.length > 0 ? Math.round((allMembers.length / groups.length) * 10) / 10 : 0
        },
        groupPerformance: sortedGroups,
        churchWideMonthly,
        insights: {
          excellentGroups,
          needsImprovementGroups,
          improvingGroups,
          decliningGroups,
          topPerformer: sortedGroups[0] || null,
          needsAttention: sortedGroups[sortedGroups.length - 1] || null,
          averageAttendanceRate: sortedGroups.length > 0 
            ? Math.round((sortedGroups.reduce((sum, group) => sum + group.attendanceRate, 0) / sortedGroups.length) * 10) / 10
            : 0
        },
        performanceDistribution: {
          excellent: excellentGroups,
          good: sortedGroups.filter(g => g.performance === 'Good').length,
          average: sortedGroups.filter(g => g.performance === 'Average').length,
          needsImprovement: needsImprovementGroups
        }
      }
    });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    }
    console.error('Groups performance analytics error:', error);
    return NextResponse.json(
      { error: `Failed to fetch groups performance data: ${errorMsg}` },
      { status: 500 }
    );
  }
}
