import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import { PrayerRequest } from '@/lib/models/PrayerRequest';
import { User } from '@/lib/models/User';

// GET member's prayer requests
export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['member']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get member data
    const member = await User.findById(user.id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Get member's prayer requests
    const prayerRequests = await PrayerRequest.find({ 
      member: user.id,
      isActive: true 
    })
    .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: {
        memberData: {
          name: member.name,
          email: member.email,
          phone: member.phone
        },
        prayerRequests: prayerRequests.map(request => ({
          _id: request._id,
          title: request.title,
          description: request.description,
          category: request.category,
          priority: request.priority,
          status: request.status,
          isPrivate: request.isPrivate,
          createdAt: request.createdAt,
          bishopNotes: request.bishopNotes,
          answeredDate: request.answeredDate,
          tags: request.tags
        }))
      }
    });
  } catch (error: unknown) {
    console.error('Get member prayer requests error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prayer requests' },
      { status: 500 }
    );
  }
}

// POST submit new prayer request
export async function POST(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['member']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, category, priority, isPrivate, tags } = await request.json();

    // Validation
    if (!title || !description || !category) {
      return NextResponse.json({ 
        error: 'Title, description, and category are required' 
      }, { status: 400 });
    }

    if (title.length > 200) {
      return NextResponse.json({ 
        error: 'Title must be 200 characters or less' 
      }, { status: 400 });
    }

    if (description.length > 2000) {
      return NextResponse.json({ 
        error: 'Description must be 2000 characters or less' 
      }, { status: 400 });
    }

    await dbConnect();

    // Get member data
    const member = await User.findById(user.id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Create prayer request
    const prayerRequest = new PrayerRequest({
      member: user.id,
      memberName: member.name,
      memberEmail: member.email,
      memberPhone: member.phone,
      title: title.trim(),
      description: description.trim(),
      category,
      priority: priority || 'medium',
      isPrivate: isPrivate || false,
      tags: tags || [],
      status: 'pending'
    });

    await prayerRequest.save();

    return NextResponse.json({
      success: true,
      message: 'Prayer request submitted successfully',
      data: {
        _id: prayerRequest._id,
        title: prayerRequest.title,
        status: prayerRequest.status,
        createdAt: prayerRequest.createdAt
      }
    });
  } catch (error: unknown) {
    console.error('Submit prayer request error:', error);
    return NextResponse.json(
      { error: 'Failed to submit prayer request' },
      { status: 500 }
    );
  }
}
