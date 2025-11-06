import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

// Get leader profile
export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const leader = await User.findById(user.id)
      .populate('group', 'name')
      .select('-password');

    if (!leader) {
      return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { user: leader }
    });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Leader profile fetch error:', error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

// Update leader profile
export async function PUT(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, phone, residence } = await request.json();
    await dbConnect();

    // Validate required fields
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ 
        error: 'Name and email are required' 
      }, { status: 400 });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email: email.trim(), 
      _id: { $ne: user.id } 
    });
    
    if (existingUser) {
      return NextResponse.json({ 
        error: 'Email address is already in use' 
      }, { status: 400 });
    }

    // Update the leader
    const updatedLeader = await User.findByIdAndUpdate(
      user.id,
      {
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || undefined,
        residence: residence?.trim() || undefined,
      },
      { new: true }
    ).populate('group', 'name').select('-password');

    if (!updatedLeader) {
      return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { user: updatedLeader }
    });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Leader profile update error:', error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

