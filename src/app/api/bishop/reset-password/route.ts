import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import bcrypt from 'bcryptjs';

// Bishop can reset leader passwords
export async function POST(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, newPassword } = await request.json();
    await dbConnect();

    // Validate input
    if (!userId || !newPassword) {
      return NextResponse.json({ 
        error: 'User ID and new password are required' 
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: 'New password must be at least 6 characters long' 
      }, { status: 400 });
    }

    // Get the target user (leader)
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ 
        error: 'Target user not found' 
      }, { status: 404 });
    }

    // Verify the target user is a leader
    if (targetUser.role !== 'leader') {
      return NextResponse.json({ 
        error: 'You can only reset passwords for leaders' 
      }, { status: 403 });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the leader's password
    await User.findByIdAndUpdate(userId, {
      password: hashedNewPassword,
      lastPasswordReset: new Date()
    });

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for ${targetUser.name}`
    });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Bishop password reset error:', error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

