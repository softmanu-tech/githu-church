import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import Event from '@/lib/models/Event';
import { Attendance } from '@/lib/models/Attendance';

// GET a specific event
export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    // Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = params;
    await dbConnect();

    // Get the leader's group
    const leader = await User.findById(user.id);
    if (!leader || !leader.group) {
      return NextResponse.json(
        { error: 'Leader does not have an assigned group' },
        { status: 400 }
      );
    }

    // Find the event and verify it belongs to the leader's group
    const event = await Event.findById(eventId)
      .populate('createdBy', 'name email')
      .lean();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.group.toString() !== leader.group.toString()) {
      return NextResponse.json(
        { error: 'You do not have permission to view this event' },
        { status: 403 }
      );
    }

    // Get attendance for this event
    const attendance = await Attendance.findOne({ event: eventId })
      .populate('presentMembers', 'name email')
      .populate('absentMembers', 'name email')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        event,
        attendance,
      },
    });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Event retrieval error:', error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

// UPDATE an event
export async function PUT(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    // Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = params;
    const { title, date, location, description } = await request.json();
    await dbConnect();

    // Get the leader's group
    const leader = await User.findById(user.id);
    if (!leader || !leader.group) {
      return NextResponse.json(
        { error: 'Leader does not have an assigned group' },
        { status: 400 }
      );
    }

    // Find the event and verify it belongs to the leader's group
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.group.toString() !== leader.group.toString()) {
      return NextResponse.json(
        { error: 'You do not have permission to update this event' },
        { status: 403 }
      );
    }

    // Update the event
    event.title = title || event.title;
    event.date = date ? new Date(date) : event.date;
    event.location = location !== undefined ? location : event.location;
    event.description = description !== undefined ? description : event.description;

    await event.save();

    return NextResponse.json({
      success: true,
      data: {
        event,
      },
    });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Event update error:', error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

// DELETE an event
export async function DELETE(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    // Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = params;
    await dbConnect();

    // Get the leader's group
    const leader = await User.findById(user.id);
    if (!leader || !leader.group) {
      return NextResponse.json(
        { error: 'Leader does not have an assigned group' },
        { status: 400 }
      );
    }

    // Find the event and verify it belongs to the leader's group
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.group.toString() !== leader.group.toString()) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this event' },
        { status: 403 }
      );
    }

    // Delete associated attendance records first
    await Attendance.deleteMany({ event: eventId });

    // Delete the event
    await Event.findByIdAndDelete(eventId);

    return NextResponse.json({
      success: true,
      message: 'Event and associated attendance records deleted successfully',
    });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Event deletion error:', error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}