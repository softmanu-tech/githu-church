import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import { User } from '@/lib/models/User';
import { Communication } from '@/lib/models/Communication';
import { Group } from '@/lib/models/Group';

export const dynamic = 'force-dynamic';

// GET - Fetch communications for the current user
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop', 'leader', 'member', 'protocol']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Get user details to determine their role and group
    const currentUser = await User.findById(user.id).populate('group');
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build query based on user role and group
    const query: any = {
      isActive: true,
      $or: []
    };

    // Add conditions based on user role
    if (currentUser.role === 'member') {
      // Members receive messages sent to all members or to their specific group
      query.$or.push(
        { 'recipients.type': 'all_members' },
        { 
          'recipients.type': 'group_members',
          'recipients.groupId': (currentUser as any).group?._id 
        },
        { 'recipients.userIds': user.id }
      );
    } else if (currentUser.role === 'leader') {
      // Leaders receive messages sent to all leaders or to their specific group
      query.$or.push(
        { 'recipients.type': 'all_leaders' },
        { 
          'recipients.type': 'group_members',
          'recipients.groupId': (currentUser as any).group?._id 
        },
        { 'recipients.userIds': user.id }
      );
    } else if (currentUser.role === 'protocol') {
      // Protocol leaders receive messages sent to all protocol leaders
      query.$or.push(
        { 'recipients.type': 'all_protocol' },
        { 'recipients.userIds': user.id }
      );
    } else if (currentUser.role === 'bishop') {
      // Bishop receives all communications (for oversight)
      query.$or.push(
        { 'recipients.type': { $in: ['all_members', 'all_leaders', 'all_protocol'] } },
        { 'recipients.userIds': user.id }
      );
    }

    // Add unread filter if requested
    if (unreadOnly) {
      query['readBy.userId'] = { $ne: user.id };
    }

    const communications = await Communication.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('sender', 'name email')
      .populate('recipients.groupId', 'name');

    const total = await Communication.countDocuments(query);

    // Mark which messages are read by current user
    const communicationsWithReadStatus = communications.map(comm => {
      const isRead = comm.readBy.some((read: any) => read.userId.toString() === user.id);
      return {
        ...comm.toObject(),
        isRead,
        readAt: comm.readBy.find((read: any) => read.userId.toString() === user.id)?.readAt
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        communications: communicationsWithReadStatus,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching inbox:', error);
    return NextResponse.json({ error: 'Failed to fetch inbox' }, { status: 500 });
  }
}

// POST - Mark communication as read
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop', 'leader', 'member', 'protocol']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { communicationId } = body;

    if (!communicationId) {
      return NextResponse.json({ error: 'Communication ID is required' }, { status: 400 });
    }

    // Check if already read
    const communication = await Communication.findById(communicationId);
    if (!communication) {
      return NextResponse.json({ error: 'Communication not found' }, { status: 404 });
    }

    const alreadyRead = communication.readBy.some((read: any) => read.userId.toString() === user.id);
    
    if (!alreadyRead) {
      communication.readBy.push({
        userId: user.id,
        readAt: new Date()
      });
      await communication.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Communication marked as read'
    });
  } catch (error) {
    console.error('Error marking communication as read:', error);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
