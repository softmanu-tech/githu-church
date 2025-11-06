import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { Group } from '@/lib/models/Group';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

export async function POST(request: Request) {
  try {
    // Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Get the leader's group
    const leader = await User.findById(user.id).populate('group');
    if (!leader || !(leader as any).group) {
      return NextResponse.json({ error: 'Leader group not found' }, { status: 404 });
    }

    const leaderGroup = (leader as any).group;

    // Check if the member exists and is not already in this group
    const member = await User.findById(memberId);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (member.role !== 'member') {
      return NextResponse.json({ error: 'User is not a member' }, { status: 400 });
    }

    // Check if member is already in this group
    const isInGroup = (member.group && member.group.toString() === leaderGroup._id.toString()) ||
                      (member.groups && member.groups.some((g: any) => g.toString() === leaderGroup._id.toString()));
    
    if (isInGroup) {
      return NextResponse.json({ error: 'Member is already in this group' }, { status: 400 });
    }

    // Add member to the group (support both single and multiple groups)
    const memberUpdate: any = {};
    
    // If member doesn't have any groups, set the primary group
    if (!member.group && (!member.groups || member.groups.length === 0)) {
      memberUpdate.group = leaderGroup._id;
    }
    
    // Add to groups array (for multiple group support)
    memberUpdate.$addToSet = { groups: leaderGroup._id };
    
    await User.findByIdAndUpdate(memberId, memberUpdate);

    // Add member to the group's members array
    await Group.findByIdAndUpdate(leaderGroup._id, {
      $addToSet: { members: memberId }
    });

    return NextResponse.json({
      success: true,
      message: `${member.name} has been successfully added to your group`,
      data: {
        member: {
          _id: member._id,
          name: member.name,
          email: member.email,
          phone: member.phone || '',
          residence: (member as any).residence || '',
          department: member.department || ''
        }
      }
    });

  } catch (error) {
    console.error('Error adding existing member to group:', error);
    return NextResponse.json(
      { error: 'Failed to add member to group' },
      { status: 500 }
    );
  }
}
