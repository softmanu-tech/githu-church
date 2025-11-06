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

export async function GET(request: Request) {
  try {
    console.log('🔍 Bishop all-responses API called');
    
    // Strict Authentication - Only bishops can see all responses
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get query parameters
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');

    console.log('📊 Fetching data for last', days, 'days');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all events in the date range
    const events = await Event.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('group', 'name').lean();

    // Get all event responses
    const responses = await EventResponse.find({
      responseDate: { $gte: startDate, $lte: endDate }
    })
    .populate('event', 'title date group')
    .populate('member', 'name email')
    .lean();

    // Separate attending and not attending
    const attending = responses.filter(r => r.willAttend);
    const notAttending = responses.filter(r => !r.willAttend);

    // Group responses by event
    const responsesByEvent = events.map(event => {
      const eventResponses = responses.filter(r => 
        r.event && r.event._id.toString() === event._id.toString()
      );
      
      return {
        eventId: event._id.toString(),
        eventTitle: event.title,
        eventDate: event.date,
        groupName: (event as any).group?.name || 'Unknown',
        attendingCount: eventResponses.filter(r => r.willAttend).length,
        notAttendingCount: eventResponses.filter(r => !r.willAttend).length,
        totalResponses: eventResponses.length,
        responseRate: 100 // All responses received (since we only count actual responses)
      };
    });

    // Find events that need follow-up (no responses)
    const needsFollowUp = responsesByEvent.filter(event => 
      event.totalResponses === 0
    );

    // Calculate insights
    const mostActiveEvent = responsesByEvent.reduce((max, event) => 
      event.totalResponses > max.totalResponses ? event : max, 
      responsesByEvent[0] || null
    );

    const mostApologies = notAttending.reduce((max, response) => 
      response.reason && response.reason.length > (max?.reason?.length || 0) ? response : max,
      notAttending[0] || null
    );

    const averageResponseRate = responsesByEvent.length > 0 ?
      Math.round(responsesByEvent.reduce((sum, event) => sum + event.responseRate, 0) / responsesByEvent.length) : 0;

    return NextResponse.json({
      success: true,
      data: {
        responses: {
          attending,
          notAttending
        },
        summary: {
          totalResponses: responses.length,
          attendingCount: attending.length,
          notAttendingCount: notAttending.length,
          responseRate: averageResponseRate,
          daysAnalyzed: days
        },
        responsesByEvent,
        eventsWithResponses: responsesByEvent.filter(event => event.totalResponses > 0),
        needsFollowUp,
        insights: {
          mostActiveEvent,
          mostApologies,
          averageResponseRate
        }
      }
    });
  } catch (error: unknown) {
    console.error('❌ Bishop all responses fetch error:', error);
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    }
    return NextResponse.json(
      { error: `Failed to fetch responses data: ${errorMsg}` },
      { status: 500 }
    );
  }
}
