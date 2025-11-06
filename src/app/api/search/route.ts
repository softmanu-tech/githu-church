import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { Group } from '@/lib/models/Group';
import { Attendance } from '@/lib/models/Attendance';
import Event from '@/lib/models/Event';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

export async function GET(request: Request) {
  try {
    // Authentication - all roles can search, but results will be filtered by role
    const { user } = await requireSessionAndRoles(request, ['bishop', 'leader', 'member']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const type = url.searchParams.get('type') || 'all';
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    await dbConnect();

    // Get the user's role and group
    const currentUser = await User.findById(user.id);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let results: any = {};
    let totalResults = 0;

    // Search based on the requested type and user's role
    if (type === 'all' || type === 'members') {
      let memberQuery: any = { role: 'member' };
      
      // Add text search if query is provided
      if (query) {
        memberQuery.$or = [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { phone: { $regex: query, $options: 'i' } }
        ];
      }
      
      // Restrict by group for leaders
      if (currentUser.role === 'leader' && currentUser.group) {
        memberQuery.group = currentUser.group;
      }
      
      // Members can only search themselves
      if (currentUser.role === 'member') {
        memberQuery._id = currentUser._id;
      }
      
      const [members, memberCount] = await Promise.all([
        User.find(memberQuery)
          .select('name email phone group')
          .populate('group', 'name')
          .skip(skip)
          .limit(limit),
        User.countDocuments(memberQuery)
      ]);
      
      results.members = members;
      totalResults += memberCount;
    }

    if ((type === 'all' || type === 'groups') && currentUser.role !== 'member') {
      let groupQuery: any = {};
      
      // Add text search if query is provided
      if (query) {
        groupQuery.name = { $regex: query, $options: 'i' };
      }
      
      // Restrict by group for leaders
      if (currentUser.role === 'leader' && currentUser.group) {
        groupQuery._id = currentUser.group;
      }
      
      const [groups, groupCount] = await Promise.all([
        Group.find(groupQuery)
          .populate('leader', 'name email')
          .skip(skip)
          .limit(limit),
        Group.countDocuments(groupQuery)
      ]);
      
      results.groups = groups;
      totalResults += groupCount;
    }

    if (type === 'all' || type === 'events') {
      let eventQuery: any = {};
      
      // Add text search if query is provided
      if (query) {
        eventQuery.$or = [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { location: { $regex: query, $options: 'i' } }
        ];
      }
      
      // Restrict by group for leaders and members
      if (currentUser.role !== 'bishop') {
        eventQuery.group = currentUser.group;
      }
      
      const [events, eventCount] = await Promise.all([
        Event.find(eventQuery)
          .populate('group', 'name')
          .populate('createdBy', 'name')
          .sort({ date: -1 })
          .skip(skip)
          .limit(limit),
        Event.countDocuments(eventQuery)
      ]);
      
      results.events = events;
      totalResults += eventCount;
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        totalResults,
        query,
        type
      }
    });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Search error:', error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}