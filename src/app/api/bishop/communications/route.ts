import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import { User } from '@/lib/models/User';
import { Communication } from '@/lib/models/Communication';
import { Group } from '@/lib/models/Group';

export const dynamic = 'force-dynamic';

// GET - Fetch all communications sent by bishop
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const recipients = searchParams.get('recipients');

    const query: any = { sender: user.id };
    
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (recipients) {
      if (recipients === 'all_leaders') {
        query['recipients.type'] = 'all_leaders';
      } else if (recipients === 'all_members') {
        query['recipients.type'] = 'all_members';
      } else if (recipients === 'all_protocol') {
        query['recipients.type'] = 'all_protocol';
      } else if (recipients === 'group_members') {
        query['recipients.type'] = 'group_members';
      }
    }

    const communications = await Communication.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('recipients.groupId', 'name')
      .populate('recipients.userIds', 'name email');

    const total = await Communication.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        communications,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching communications:', error);
    return NextResponse.json({ error: 'Failed to fetch communications' }, { status: 500 });
  }
}

// POST - Send new communication
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { 
      recipients, 
      subject, 
      message, 
      priority = 'medium', 
      category = 'general',
      scheduledFor 
    } = body;

    // Validate required fields
    if (!recipients || !subject || !message) {
      return NextResponse.json({ 
        error: 'Recipients, subject, and message are required' 
      }, { status: 400 });
    }

    // Get sender details
    const sender = await User.findById(user.id);
    if (!sender) {
      return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
    }

    // Create communication record
    const communication = new Communication({
      sender: user.id,
      senderName: sender.name,
      senderRole: 'bishop',
      recipients,
      subject,
      message,
      priority,
      category,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      sentAt: scheduledFor ? undefined : new Date()
    });

    await communication.save();

    // If not scheduled, mark as sent
    if (!scheduledFor) {
      communication.sentAt = new Date();
      await communication.save();
    }

    return NextResponse.json({
      success: true,
      message: scheduledFor ? 'Communication scheduled successfully' : 'Communication sent successfully',
      data: communication
    });
  } catch (error) {
    console.error('Error sending communication:', error);
    return NextResponse.json({ error: 'Failed to send communication' }, { status: 500 });
  }
}
