import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { Attendance } from '@/lib/models/Attendance';
import Event from '@/lib/models/Event';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

export async function GET(request: Request) {
  try {
    // 1. Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get URL parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Get the leader's group
    const leader = await User.findById(user.id).populate('group');
    if (!leader || !leader.group) {
      return NextResponse.json({ 
        error: 'Leader does not have an assigned group' 
      }, { status: 400 });
    }

    const groupId = leader.group._id;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    // Get attendance records for the group
    const attendanceRecords = await Attendance.find({
      group: groupId,
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
    }).populate('event').sort({ date: -1 });

    // Get events for the group
    const events = await Event.find({
      group: groupId,
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
    }).sort({ date: -1 });

    // Get all members in the group
    const groupMembers = await User.find({
      group: groupId,
      role: 'member'
    });

    // Calculate analytics
    const totalEvents = events.length;
    const totalAttendance = attendanceRecords.reduce((sum, record) => sum + record.presentMembers.length, 0);
    const averageAttendance = totalEvents > 0 ? totalAttendance / totalEvents : 0;
    const totalPossibleAttendance = totalEvents * groupMembers.length;
    const attendanceRate = totalPossibleAttendance > 0 ? (totalAttendance / totalPossibleAttendance) * 100 : 0;

    // Monthly trend (simplified)
    const monthlyTrend = attendanceRecords.reduce((acc: any[], record) => {
      const month = new Date(record.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const existing = acc.find(item => item.month === month);
      if (existing) {
        existing.attendance += record.presentMembers.length;
        existing.events += 1;
      } else {
        acc.push({
          month,
          attendance: record.presentMembers.length,
          events: 1
        });
      }
      return acc;
    }, []).slice(0, 6).reverse();

    // Member performance
    const memberPerformance = groupMembers.map(member => {
      const memberAttendance = attendanceRecords.filter(record => 
        record.presentMembers.some(id => id.toString() === member._id.toString())
      );
      
      const attendanceCount = memberAttendance.length;
      const memberRate = totalEvents > 0 ? (attendanceCount / totalEvents) * 100 : 0;
      const lastAttended = memberAttendance.length > 0 ? memberAttendance[0].date : null;

      return {
        memberId: member._id.toString(),
        memberName: member.name,
        attendanceCount,
        attendanceRate: memberRate,
        lastAttended
      };
    });

    // Event performance
    const eventPerformance = events.map(event => {
      const eventAttendance = attendanceRecords.find(record => 
        record.event && record.event._id.toString() === event._id.toString()
      );
      
      const attendanceCount = eventAttendance ? eventAttendance.presentMembers.length : 0;
      const eventRate = groupMembers.length > 0 ? (attendanceCount / groupMembers.length) * 100 : 0;

      return {
        eventId: event._id.toString(),
        eventTitle: event.title,
        date: event.date,
        attendanceCount,
        attendanceRate: eventRate
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        totalEvents,
        totalAttendance,
        averageAttendance,
        attendanceRate,
        monthlyTrend,
        memberPerformance,
        eventPerformance
      }
    });

  } catch (error) {
    console.error('Leader analytics error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal Server Error' 
      }, 
      { status: 500 }
    );
  }
}