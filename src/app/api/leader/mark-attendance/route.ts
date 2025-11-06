// src/app/api/leader/mark-attendance/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Attendance from '@/lib/models/Attendance';
import Event from '@/lib/models/Event';
import { User } from '@/lib/models/User';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

export async function POST(request: Request) {
  try {
    // 1. Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get the leader's group
    const leader = await User.findById(user.id);
    if (!leader || !leader.group) {
      return NextResponse.json({ 
        error: 'Leader does not have an assigned group' 
      }, { status: 400 });
    }

    const { eventId, presentMemberIds, absentMemberIds, date, notes } = await request.json();

    // Verify the event exists and belongs to the leader's group
    if (eventId) {
      const event = await Event.findById(eventId);
      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
      
      if (event.group.toString() !== leader.group.toString()) {
        return NextResponse.json({ 
          error: 'You can only mark attendance for events in your group' 
        }, { status: 403 });
      }
    }

    // Verify all members belong to the leader's group
    const allMemberIds = [...presentMemberIds, ...absentMemberIds];
    const groupMembers = await User.find({
      _id: { $in: allMemberIds },
      group: leader.group
    });

    if (groupMembers.length !== allMemberIds.length) {
      return NextResponse.json({ 
        error: 'Some members do not belong to your group' 
      }, { status: 400 });
    }

    // Create the attendance record
    const attendance = new Attendance({
      event: eventId || undefined,
      group: leader.group,
      date: date ? new Date(date) : new Date(),
      presentMembers: presentMemberIds,
      absentMembers: absentMemberIds,
      recordedBy: user.id,
      updatedBy: user.id,
      notes
    });

    await attendance.save();

    // If this is for an event, update the event's attendance
    if (eventId) {
      await Event.findByIdAndUpdate(eventId, {
        $set: { attendance: presentMemberIds }
      });
    }

    return NextResponse.json({
      success: true,
      attendance
    });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Attendance marking error:', error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

// Get attendance records for the leader's group
export async function GET(request: Request) {
  try {
    // 1. Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get the leader's group
    const leader = await User.findById(user.id);
    if (!leader || !leader.group) {
      return NextResponse.json({ 
        error: 'Leader does not have an assigned group' 
      }, { status: 400 });
    }

    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');
    
    // Find attendance records for the leader's group
    const query: any = { group: leader.group };
    if (eventId) {
      query.event = eventId;
    }
    
    const attendanceRecords = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('event', 'title date')
      .populate('presentMembers', 'name email')
      .populate('absentMembers', 'name email')
      .populate('recordedBy', 'name email');

    return NextResponse.json({ success: true, data: attendanceRecords });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
