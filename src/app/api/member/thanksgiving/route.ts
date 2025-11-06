import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import { Thanksgiving } from '@/lib/models/Thanksgiving';
import { User } from '@/lib/models/User';

// GET member's thanksgiving messages
export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['member']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get member data
    const member = await User.findById(user.id).select('name email phone');
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Get member's thanksgiving messages
    const thanksgivingMessages = await Thanksgiving.find({ 
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
          phone: member.phone,
        },
        thanksgivingMessages,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching member thanksgiving messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thanksgiving messages' },
      { status: 500 }
    );
  }
}

// POST submit a new thanksgiving message
export async function POST(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['member']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { title, description, category, priority, isPrivate, tags } = await request.json();

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const newThanksgiving = new Thanksgiving({
      member: user.id,
      title,
      description,
      category: category || 'blessing',
      priority: priority || 'medium',
      isPrivate: isPrivate || false,
      tags: tags || [],
    });

    await newThanksgiving.save();

    return NextResponse.json({
      success: true,
      message: 'Thanksgiving message submitted successfully',
      data: newThanksgiving,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error submitting thanksgiving message:', error);
    return NextResponse.json(
      { error: 'Failed to submit thanksgiving message' },
      { status: 500 }
    );
  }
}
