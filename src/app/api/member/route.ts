import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { Group } from '@/lib/models/Group';
import Event from '@/lib/models/Event';
import Attendance from '@/lib/models/Attendance';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

export async function GET(request: Request) {
  try {
    // 1. Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['member']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Ensure Group model is registered
    const { Group } = await import('@/lib/models/Group');

    // Get the member's details with groups info
    const member = await User.findById(user.id)
      .populate('group', 'name') // Keep for backward compatibility
      .populate('groups', 'name') // New: multiple groups
      .select('name email phone residence department group groups');

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Get all groups the member belongs to (combine old and new group fields)
    const memberGroups = [];
    if (member.group) {
      memberGroups.push(member.group);
    }
    if (member.groups && member.groups.length > 0) {
      memberGroups.push(...member.groups);
    }

    // Remove duplicates
    const uniqueGroups = memberGroups.filter((group, index, self) => 
      index === self.findIndex(g => g._id.toString() === group._id.toString())
    );

    // Get upcoming events for all member's groups
    const upcomingEvents = await Event.find({
      group: { $in: uniqueGroups.map(g => g._id) },
      date: { $gte: new Date() }
    })
      .sort({ date: 1 })
      .populate('createdBy', 'name')
      .populate('group', 'name')
      .limit(20);

    // Get member's attendance history
    const attendanceHistory = await Attendance.find({
      $or: [
        { presentMembers: member._id },
        { absentMembers: member._id }
      ]
    })
      .sort({ date: -1 })
      .populate('event', 'title date location')
      .limit(20);

    // Calculate attendance statistics
    const totalRecords = attendanceHistory.length;
    const presentCount = attendanceHistory.filter(record => 
      record.presentMembers.includes(member._id)
    ).length;
    const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

    // Get recent attendance (last 10 records)
    const recentAttendance = attendanceHistory.slice(0, 10).map(record => ({
      _id: record._id,
      date: record.date,
      event: record.event,
      status: record.presentMembers.includes(member._id) ? 'present' : 'absent'
    }));

    return NextResponse.json({
      success: true,
      data: {
        member: {
          _id: member._id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          residence: member.residence,
          department: member.department,
          group: member.group, // Keep for backward compatibility
          groups: uniqueGroups // New: all groups member belongs to
        },
        upcomingEvents,
        attendanceStats: {
          totalRecords,
          presentCount,
          absentCount: totalRecords - presentCount,
          attendanceRate
        },
        recentAttendance
      }
    });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Member dashboard error:', error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

