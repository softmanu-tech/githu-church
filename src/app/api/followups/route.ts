import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import FollowUp from '@/lib/models/FollowUp';

// GET all follow-ups
export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop', 'leader', 'member']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Parse query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build query based on user role
    let query: any = {};
    
    if (user.role === 'member') {
      // Members can only see their own follow-ups
      query.member = user.id;
    } else if (user.role === 'leader') {
      // Leaders can see follow-ups for their group members
      const { User } = await import('@/lib/models/User');
      const leader = await User.findById(user.id);
      if (leader?.group) {
        const { Group } = await import('@/lib/models/Group');
        const group = await Group.findById(leader.group);
        if (group) {
          query.member = { $in: group.members };
        }
      }
    }
    // Bishops can see all follow-ups (no additional query restrictions)

    const followUps = await FollowUp.find(query)
      .populate('member', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await FollowUp.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        followUps,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Follow-ups retrieval error:', error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

// CREATE a new follow-up
export async function POST(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop', 'leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memberId, type, description, priority, dueDate } = await request.json();
    await dbConnect();

    if (!memberId || !type || !description) {
      return NextResponse.json({
        error: 'Member ID, type, and description are required'
      }, { status: 400 });
    }

    const followUp = new FollowUp({
      member: memberId,
      type,
      description,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      assignedTo: user.id,
      status: 'pending',
      createdAt: new Date()
    });

    await followUp.save();

    return NextResponse.json({
      success: true,
      data: followUp
    }, { status: 201 });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Follow-up creation error:', error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
