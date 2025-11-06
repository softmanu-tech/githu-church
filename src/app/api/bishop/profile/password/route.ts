import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import bcrypt from 'bcryptjs';

// Change bishop password
export async function PUT(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();
    await dbConnect();

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        error: 'Current password and new password are required' 
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: 'New password must be at least 6 characters long' 
      }, { status: 400 });
    }

    // Get the bishop with password
    const bishop = await User.findById(user.id);
    if (!bishop) {
      return NextResponse.json({ error: 'Bishop not found' }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, bishop.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ 
        error: 'Current password is incorrect' 
      }, { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await User.findByIdAndUpdate(user.id, {
      password: hashedNewPassword,
      lastPasswordReset: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Bishop password change error:', error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

