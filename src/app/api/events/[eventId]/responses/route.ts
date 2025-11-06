import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import Event from '@/lib/models/Event';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import mongoose from 'mongoose';

// Event Response Schema (matching the one in member/event-response/route.ts)
const EventResponseSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  willAttend: { type: Boolean, required: true },
  reason: { type: String }, // Reason for not attending
  responseDate: { type: Date, default: Date.now }
}, { timestamps: true });

const EventResponse = mongoose.models.EventResponse || 
  mongoose.model('EventResponse', EventResponseSchema);

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    // Allow both bishops and leaders to view event responses
    const { user } = await requireSessionAndRoles(request, ['bishop', 'leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = params;
    await dbConnect();

    // Get the user's details
    const currentUser = await User.findById(user.id);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the event exists and user has permission to view it
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check permissions based on role
    if (currentUser.role === 'leader') {
      // Leaders can only see events from their group
      if (!currentUser.group || event.group.toString() !== currentUser.group.toString()) {
        return NextResponse.json({ 
          error: 'You can only view responses for events in your group' 
        }, { status: 403 });
      }
    }
    // Bishops can see all events (no additional check needed)

    // Get all responses for this event
    const responses = await EventResponse.find({ event: eventId })
      .populate('member', 'name email phone residence department')
      .populate('event', 'title date location')
      .sort({ responseDate: -1 });

    // Separate responses by type
    const attending = responses.filter(r => r.willAttend);
    const notAttending = responses.filter(r => !r.willAttend);

    // Get event details
    const eventDetails = await Event.findById(eventId)
      .populate('createdBy', 'name email')
      .populate('group', 'name');

    return NextResponse.json({
      success: true,
      data: {
        event: eventDetails,
        responses: {
          attending: attending.map(r => ({
            _id: r._id,
            member: r.member,
            responseDate: r.responseDate,
            willAttend: r.willAttend
          })),
          notAttending: notAttending.map(r => ({
            _id: r._id,
            member: r.member,
            reason: r.reason,
            responseDate: r.responseDate,
            willAttend: r.willAttend
          }))
        },
        summary: {
          totalResponses: responses.length,
          attending: attending.length,
          notAttending: notAttending.length,
          responseRate: responses.length > 0 ? Math.round((responses.length / (attending.length + notAttending.length)) * 100) : 0
        }
      }
    });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    }
    console.error('Event responses fetch error:', error);
    return NextResponse.json(
      { error: `Failed to fetch event responses: ${errorMsg}` },
      { status: 500 }
    );
  }
}
