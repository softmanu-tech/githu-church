import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

// Get bishop profile
export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const bishop = await User.findById(user.id).select('-password');

    if (!bishop) {
      return NextResponse.json({ error: 'Bishop not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { user: bishop }
    });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Bishop profile fetch error:', error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

// Update bishop profile
export async function PUT(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, phone } = await request.json();
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

    // Update the bishop
    const updatedBishop = await User.findByIdAndUpdate(
      user.id,
      {
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || undefined,
      },
      { new: true }
    ).select('-password');

    if (!updatedBishop) {
      return NextResponse.json({ error: 'Bishop not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { user: updatedBishop }
    });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Bishop profile update error:', error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

