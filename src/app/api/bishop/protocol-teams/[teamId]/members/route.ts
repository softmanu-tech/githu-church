import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { ProtocolTeam } from '@/lib/models/ProtocolTeam';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import bcrypt from 'bcryptjs';

// POST add member to protocol team
export async function POST(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = params;
    const { memberName, memberEmail } = await request.json();

    await dbConnect();

    // Validate required fields
    if (!memberName || !memberEmail) {
      return NextResponse.json({ 
        error: 'Member name and email are required' 
      }, { status: 400 });
    }

    // Check if team exists
    const team = await ProtocolTeam.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Protocol team not found' }, { status: 404 });
    }

    // Check if user already exists
    let protocolMember = await User.findOne({ email: memberEmail });
    
    if (protocolMember) {
      // User exists, check if already in this team
      if (team.members.includes(protocolMember._id)) {
        return NextResponse.json({ 
          error: 'Member is already part of this team' 
        }, { status: 400 });
      }

      // Update existing user to protocol role and add to team
      protocolMember.role = 'protocol';
      protocolMember.protocolTeam = teamId;
      await protocolMember.save();
    } else {
      // Create new protocol member account
      const temporaryPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      protocolMember = new User({
        name: memberName,
        email: memberEmail,
        password: hashedPassword,
        role: 'protocol',
        protocolTeam: teamId
      });

      await protocolMember.save();
    }

    // Add member to team
    team.members.push(protocolMember._id);
    await team.save();

    // Return updated team with member details
    const updatedTeam = await ProtocolTeam.findById(teamId)
      .populate('leader', 'name email phone')
      .populate('members', 'name email phone');

    return NextResponse.json({
      success: true,
      data: updatedTeam,
      message: `${memberName} added to protocol team successfully`,
      credentials: protocolMember ? {
        email: memberEmail,
        password: protocolMember.password ? 'Existing user - password unchanged' : 'Password generated'
      } : null
    });
  } catch (error: unknown) {
    console.error('Add protocol team member error:', error);
    return NextResponse.json(
      { error: 'Failed to add team member' },
      { status: 500 }
    );
  }
}

// DELETE remove member from protocol team
export async function DELETE(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = params;
    const { memberId } = await request.json();

    await dbConnect();

    // Check if team exists
    const team = await ProtocolTeam.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Protocol team not found' }, { status: 404 });
    }

    // Check if member exists in team
    if (!team.members.includes(memberId)) {
      return NextResponse.json({ 
        error: 'Member is not part of this team' 
      }, { status: 400 });
    }

    // Don't allow removing the team leader
    if (team.leader.toString() === memberId) {
      return NextResponse.json({ 
        error: 'Cannot remove team leader. Transfer leadership first.' 
      }, { status: 400 });
    }

    // Remove member from team
    team.members = team.members.filter((id: any) => id.toString() !== memberId);
    await team.save();

    // Update user's protocol team reference
    await User.findByIdAndUpdate(memberId, { 
      $unset: { protocolTeam: 1 },
      role: 'member' // Change back to regular member
    });

    // Return updated team
    const updatedTeam = await ProtocolTeam.findById(teamId)
      .populate('leader', 'name email phone')
      .populate('members', 'name email phone');

    return NextResponse.json({
      success: true,
      data: updatedTeam,
      message: 'Member removed from protocol team successfully'
    });
  } catch (error: unknown) {
    console.error('Remove protocol team member error:', error);
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    );
  }
}
