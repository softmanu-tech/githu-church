import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import Event from '@/lib/models/Event';
import { Attendance } from '@/lib/models/Attendance';

// GET a specific event
export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop', 'leader', 'member']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = params;
    await dbConnect();

    const event = await Event.findById(eventId)
      .populate('group', 'name')
      .populate('createdBy', 'name email');

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get attendance for this event
    const attendance = await Attendance.findOne({ event: eventId })
      .populate('presentMembers', 'name email')
      .populate('absentMembers', 'name email');

    return NextResponse.json({
      success: true,
      data: {
        event,
        attendance
      }
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
    const { user } = await requireSessionAndRoles(request, ['bishop', 'leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = params;
    const { title, date, location, description } = await request.json();
    await dbConnect();

    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Update the event
    if (title) event.title = title;
    if (date) event.date = new Date(date);
    if (location !== undefined) event.location = location;
    if (description !== undefined) event.description = description;

    await event.save();

    return NextResponse.json({
      success: true,
      data: event
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
    const { user } = await requireSessionAndRoles(request, ['bishop', 'leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = params;
    await dbConnect();

    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Delete associated attendance records first
    await Attendance.deleteMany({ event: eventId });

    // Delete the event
    await Event.findByIdAndDelete(eventId);

    return NextResponse.json({
      success: true,
      message: 'Event and associated attendance records deleted successfully'
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
