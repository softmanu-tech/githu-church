import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import bcrypt from 'bcryptjs';

// GET protocol member profile
export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['protocol']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get protocol member with team details
    const protocolMember = await User.findById(user.id)
      .populate('protocolTeam', 'name description')
      .select('-password');

    if (!protocolMember) {
      return NextResponse.json({ error: 'Protocol member not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          _id: protocolMember._id,
          name: protocolMember.name,
          email: protocolMember.email,
          phone: protocolMember.phone,
          residence: protocolMember.residence,
          department: protocolMember.department,
          role: protocolMember.role,
          profilePicture: protocolMember.profilePicture,
          protocolTeam: protocolMember.protocolTeam,
          lastPasswordReset: protocolMember.lastPasswordReset
        }
      }
    });
  } catch (error: unknown) {
    console.error('Get protocol profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT update protocol member profile
export async function PUT(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['protocol']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      name, 
      phone, 
      residence, 
      department, 
      profilePicture,
      currentPassword,
      newPassword 
    } = await request.json();

    await dbConnect();

    // Get current user
    const protocolMember = await User.findById(user.id);
    if (!protocolMember) {
      return NextResponse.json({ error: 'Protocol member not found' }, { status: 404 });
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ 
          error: 'Current password is required to set new password' 
        }, { status: 400 });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, protocolMember.password);
      if (!isValidPassword) {
        return NextResponse.json({ 
          error: 'Current password is incorrect' 
        }, { status: 400 });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      protocolMember.password = hashedPassword;
      protocolMember.lastPasswordReset = new Date();
    }

    // Update profile fields
    if (name) protocolMember.name = name;
    if (phone !== undefined) protocolMember.phone = phone;
    if (residence !== undefined) protocolMember.residence = residence;
    if (department !== undefined) protocolMember.department = department;
    if (profilePicture !== undefined) protocolMember.profilePicture = profilePicture;

    await protocolMember.save();

    // Return updated user (without password)
    const updatedUser = await User.findById(user.id)
      .populate('protocolTeam', 'name description')
      .select('-password');

    return NextResponse.json({
      success: true,
      data: {
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          residence: updatedUser.residence,
          department: updatedUser.department,
          role: updatedUser.role,
          profilePicture: updatedUser.profilePicture,
          protocolTeam: updatedUser.protocolTeam,
          lastPasswordReset: updatedUser.lastPasswordReset
        }
      },
      message: 'Profile updated successfully'
    });
  } catch (error: unknown) {
    console.error('Update protocol profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
