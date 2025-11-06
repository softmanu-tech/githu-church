import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import { User } from '@/lib/models/User';
import { Communication } from '@/lib/models/Communication';
import { Group } from '@/lib/models/Group';

export const dynamic = 'force-dynamic';

// GET - Fetch communications sent by group leader
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const communications = await Communication.find({ sender: user.id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('recipients.groupId', 'name')
      .populate('recipients.userIds', 'name email');

    const total = await Communication.countDocuments({ sender: user.id });

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

// POST - Send communication to group members
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { 
      subject, 
      message, 
      priority = 'medium', 
      category = 'general',
      scheduledFor 
    } = body;

    // Validate required fields
    if (!subject || !message) {
      return NextResponse.json({ 
        error: 'Subject and message are required' 
      }, { status: 400 });
    }

    // Get leader details and their group
    const leader = await User.findById(user.id).populate('group');
    if (!leader) {
      return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
    }

    if (!(leader as any).group) {
      return NextResponse.json({ error: 'Leader is not assigned to any group' }, { status: 400 });
    }

    // Create communication record for group members
    const communication = new Communication({
      sender: user.id,
      senderName: leader.name,
      senderRole: 'leader',
      recipients: {
        type: 'group_members',
        groupId: (leader as any).group._id
      },
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
