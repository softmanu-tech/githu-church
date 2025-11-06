// app/api/leader/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { Attendance } from '@/lib/models/Attendance';
import Event from '@/lib/models/Event';
import { Group } from '@/lib/models/Group'; 
import { requireSessionAndRoles } from "@/lib/authMiddleware";
import mongoose, { FilterQuery } from 'mongoose';
import { IAttendance, IUser, IGroup } from '@/lib/models';

// Define EnhancedMember interface
interface EnhancedMember {
  _id: string;
  name: string;
  email: string;
  phone: string;
  attendanceCount: number;
  lastAttendanceDate: Date | null;
  rating: 'Excellent' | 'Average' | 'Poor';
}

// Ultra-fast caching for leader data
const leaderCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_DURATION = 5 * 1000; // 5 seconds for ultra-fast updates

// Aggressive cache cleanup
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of leaderCache.entries()) {
        if (now - value.timestamp > value.ttl) {
            leaderCache.delete(key);
        }
    }
}, 10000); // Clean every 10 seconds

export async function GET(request: Request) {
  try {
    // 1. Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check cache first
    const cacheKey = `leader-${user.id}`;
    const cached = leaderCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true
      });
    }

    await dbConnect();

    // 2. Get Leader with Group
    const leader = await User.findById(user.id).populate<{ group: IGroup }>('group');
    if (!(leader as any)?.group) {
      return NextResponse.json({ error: 'Leader group not found' }, { status: 404 });
    }

    // Optionally, fetch the group details if needed
    const groupDetails = await Group.findById((leader as any).group._id);
    if (!groupDetails) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Debugging: Log the leader object
    console.log('Leader:', leader);

    // 3. Parse and Validate Filters
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    if (eventId && !mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID format' }, { status: 400 });
    }

    // 4. Build Secure Filters
    const attendanceFilter: FilterQuery<IAttendance> = {
      group: (leader as any).group._id,
      ...(eventId && { event: new mongoose.Types.ObjectId(eventId) }),
      ...(fromDate || toDate) && {
        date: {
          ...(fromDate && { $gte: new Date(fromDate) }),
          ...(toDate && { $lte: new Date(toDate) })
        }
      }
    };

    // 5. Fetch Data - Optimized with aggregation
    const [attendanceRecords, events, rawMembers, memberStats] = await Promise.all([
      Attendance.find(attendanceFilter).lean<IAttendance[]>(),
      Event.find({ group: (leader as any).group._id }).lean(),
      User.find({ group: (leader as any).group._id, role: 'member' })
        .select('name email phone')
        .lean<IUser[]>(),
      // Single aggregation query for member statistics
      Attendance.aggregate([
        { $match: attendanceFilter },
        { $unwind: { path: "$presentMembers", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$presentMembers",
            attendanceCount: { $sum: 1 },
            lastAttendanceDate: { $max: "$date" }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "member"
          }
        },
        { $unwind: "$member" },
        {
          $project: {
            memberId: "$_id",
            name: "$member.name",
            email: "$member.email",
            attendanceCount: 1,
            lastAttendanceDate: 1,
            rating: {
              $cond: {
                if: { $gte: ["$attendanceCount", 8] },
                then: "Excellent",
                else: {
                  $cond: {
                    if: { $gte: ["$attendanceCount", 4] },
                    then: "Average",
                    else: "Poor"
                  }
                }
              }
            }
          }
        }
      ])
    ]);

    // 6. Process Member Attendance - Use aggregated data
    const processedMembers: EnhancedMember[] = memberStats.map(stat => ({
      _id: stat.memberId,
      name: stat.name,
      email: stat.email,
      phone: '', // Not available in aggregation
      attendanceCount: stat.attendanceCount,
      lastAttendanceDate: stat.lastAttendanceDate,
      rating: stat.rating as 'Excellent' | 'Average' | 'Poor'
    }));

    // Add members with zero attendance
    const memberIdsWithAttendance = new Set(processedMembers.map(m => m._id.toString()));
    const membersWithoutAttendance = rawMembers
      .filter(m => !memberIdsWithAttendance.has(m._id.toString()))
      .map(m => ({
        _id: m._id,
        name: m.name,
        email: m.email,
        phone: m.phone || '',
        attendanceCount: 0,
        lastAttendanceDate: null,
        rating: 'Poor' as const
      }));

    const enhancedMembers = [...processedMembers, ...membersWithoutAttendance];

    const responseData = {
      group: {
        _id: (leader as any).group._id.toString(),
        name: (leader as any).group.name
      },
      events,
      members: enhancedMembers,
      attendanceRecords
    };

    // Cache the result
    leaderCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
      ttl: CACHE_DURATION
    });

    // 8. Return Secure Response
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Leader API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Add Member
export async function POST(request: Request) {
  try {
    await dbConnect();

    // 1. Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get Leader with Group
    const leader = await User.findById(user.id).populate<{ group: IGroup }>('group');
    if (!(leader as any)?.group) {
      return NextResponse.json({ error: 'Leader group not found' }, { status: 404 });
    }

    // 3. Parse and Validate Request Body
    const { name, email, phone } = await request.json();
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // 4. Create New Member
    const newMember = new User({
      name,
      email,
      phone,
      role: 'member',
      group: (leader as any).group._id
    });

    await newMember.save();

    // 5. Return Success Response
    return NextResponse.json({ message: 'Member added successfully', member: newMember });

  } catch (error) {
    console.error('Leader API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
// PUT: Update Member
export async function PUT(request: Request) {
  try {
    await dbConnect();

    // 1. Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get Leader with Group
    const leader = await User.findById(user.id).populate<{ group: IGroup }>('group');
    if (!(leader as any)?.group) {
      return NextResponse.json({ error: 'Leader group not found' }, { status: 404 });
    }

    // 3. Parse and Validate Request Body
    const { memberId, name, email, phone } = await request.json();
    if (!memberId || !name || !email) {
      return NextResponse.json({ error: 'Member ID, name, and email are required' }, { status: 400 });
    }

    // 4. Find and Update Member
    const updatedMember = await User.findOneAndUpdate(
      { _id: memberId, group: (leader as any).group._id },
      { name, email, phone },
      { new: true }
    );

    if (!updatedMember) {
      return NextResponse.json({ error: 'Member not found or not in your group' }, { status: 404 });
    }

    // 5. Return Success Response
    return NextResponse.json({ message: 'Member updated successfully', member: updatedMember });

  } catch (error) {
    console.error('Leader API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
// DELETE: Remove Member
export async function DELETE(request: Request) {
  try {
    await dbConnect();

    // 1. Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get Leader with Group
    const leader = await User.findById(user.id).populate<{ group: IGroup }>('group');
    if (!(leader as any)?.group) {
      return NextResponse.json({ error: 'Leader group not found' }, { status: 404 });
    }

    // 3. Parse and Validate Request Body
    const { memberId } = await request.json();
    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    // 4. Find and Delete Member
    const deletedMember = await User.findOneAndDelete({
      _id: memberId,
      group: (leader as any).group._id
    });

    if (!deletedMember) {
      return NextResponse.json({ error: 'Member not found or not in your group' }, { status: 404 });
    }

    // 5. Return Success Response
    return NextResponse.json({ message: 'Member removed successfully' });

  } catch (error) {
    console.error('Leader API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
