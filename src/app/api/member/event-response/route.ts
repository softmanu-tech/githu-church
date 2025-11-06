import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import Event from '@/lib/models/Event';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import mongoose from 'mongoose';

// Event Response Schema for storing member responses
const EventResponseSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  willAttend: { type: Boolean, required: true },
  reason: { type: String }, // Reason for not attending
  responseDate: { type: Date, default: Date.now }
}, { timestamps: true });

const EventResponse = mongoose.models.EventResponse || 
  mongoose.model('EventResponse', EventResponseSchema);

export async function POST(request: Request) {
  try {
    // 1. Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['member']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, willAttend, reason } = await request.json();
    await dbConnect();

    // Get the member's details
    const member = await User.findById(user.id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Verify the event exists and belongs to the member's group
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.group.toString() !== member.group.toString()) {
      return NextResponse.json({ 
        error: 'You can only respond to events in your group' 
      }, { status: 403 });
    }

    // Check if member already responded to this event
    const existingResponse = await EventResponse.findOne({
      event: eventId,
      member: member._id
    });

    if (existingResponse) {
      // Update existing response
      existingResponse.willAttend = willAttend;
      existingResponse.reason = reason;
      existingResponse.responseDate = new Date();
      await existingResponse.save();
    } else {
      // Create new response
      const response = new EventResponse({
        event: eventId,
        member: member._id,
        willAttend,
        reason,
        responseDate: new Date()
      });
      await response.save();
    }

    return NextResponse.json({
      success: true,
      message: willAttend ? 'Attendance confirmed' : 'Absence recorded with reason'
    });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Event response error:', error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

// Get member's event responses
export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['member']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const responses = await EventResponse.find({ member: user.id })
      .populate('event', 'title date location')
      .sort({ responseDate: -1 });

    return NextResponse.json({ success: true, responses });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

