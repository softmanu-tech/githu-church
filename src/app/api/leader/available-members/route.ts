import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { Group } from '@/lib/models/Group';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

export async function GET(request: Request) {
  try {
    console.log('🔍 Available members API called');
    
    // Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      console.log('❌ Unauthorized: No user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);
    await dbConnect();
    console.log('✅ Database connected');

    // Get the leader's group
    const leader = await User.findById(user.id).populate('group');
    if (!leader || !(leader as any).group) {
      console.log('❌ Leader group not found for user:', user.id);
      return NextResponse.json({ error: 'Leader group not found' }, { status: 404 });
    }

    const leaderGroup = (leader as any).group;
    console.log('✅ Leader group found:', leaderGroup.name);

    // Get all members who are not in this specific group
    console.log('🔍 Searching for available members...');
    
    // First, get all members
    const allMembers = await User.find({ role: 'member' })
      .select('name email phone residence department group groups')
      .populate('group', 'name')
      .populate('groups', 'name')
      .sort({ name: 1 })
      .lean();
    
    console.log('📊 Total members found:', allMembers.length);
    
    // Filter out members who are already in this group
    const availableMembers = allMembers.filter(member => {
      // Check if member is in the leader's group via single group field
      const inSingleGroup = member.group && member.group._id.toString() === leaderGroup._id.toString();
      
      // Check if member is in the leader's group via groups array
      const inGroupsArray = member.groups && member.groups.some((g: any) => 
        g._id.toString() === leaderGroup._id.toString()
      );
      
      // Return true if member is NOT in this group
      return !inSingleGroup && !inGroupsArray;
    });

    console.log('✅ Found', availableMembers.length, 'available members');

    // Format the response
    const formattedMembers = availableMembers.map(member => {
      // Get all groups the member belongs to
      const memberGroups = [];
      if (member.group) {
        memberGroups.push((member.group as any).name);
      }
      if (member.groups && member.groups.length > 0) {
        memberGroups.push(...(member.groups as any).map((g: any) => g.name));
      }
      
      return {
        _id: member._id,
        name: member.name,
        email: member.email,
        phone: member.phone || '',
        residence: (member as any).residence || '',
        department: member.department || '',
        currentGroups: memberGroups.length > 0 ? memberGroups.join(', ') : 'No Groups'
      };
    });

    console.log('✅ Returning', formattedMembers.length, 'formatted members');
    return NextResponse.json({
      success: true,
      data: {
        members: formattedMembers,
        total: formattedMembers.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching available members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available members' },
      { status: 500 }
    );
  }
}
