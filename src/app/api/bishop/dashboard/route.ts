import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { User } from "@/lib/models/User";
import { Group } from "@/lib/models/Group";
import { Attendance } from "@/lib/models/Attendance";
import Event from "@/lib/models/Event";
import { requireSessionAndRoles } from "@/lib/authMiddleware";

export const dynamic = 'force-dynamic';

// Ultra-fast caching with minimal TTL for maximum speed
const dashboardCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_DURATION = 2000; // 2 seconds for ultra-fast updates

// Cache cleanup function
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of dashboardCache.entries()) {
        if (now - value.timestamp > value.ttl) {
            dashboardCache.delete(key);
        }
    }
}, 30000); // Clean every 30 seconds

interface Leader {
  _id: any;
  name: string;
  email: string;
}

interface GroupWithLeader {
  _id: any;
  name: string;
  leader?: Leader | null;
}

export async function GET(request: Request) {
  const { user } = await requireSessionAndRoles(request, ["bishop"]);
  if (!user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Create cache key based on query parameters
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const groupId = url.searchParams.get("groupId");
    const cacheKey = `dashboard-${from || 'default'}-${to || 'default'}-${groupId || 'all'}`;
    
    // Check cache first
    const cached = dashboardCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log('📊 Returning cached dashboard data');
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cacheAge: Date.now() - cached.timestamp
      });
    }

    await dbConnect();

    let dateFilter = {};
    if (from || to) {
      dateFilter = {
        date: {
          ...(from ? { $gte: new Date(from) } : {}),
          ...(to ? { $lte: new Date(to) } : {}),
        },
      };
    }

    // Optimized: Use aggregation for all stats in parallel with ultra-fast queries
    const [basicStats, groupsData] = await Promise.all([
      // Single aggregation for basic stats with lean queries
      Promise.all([
        User.countDocuments({ role: "leader" }).lean(),
        Group.countDocuments().lean(),
        User.countDocuments({ role: "member" }).lean(),
        Attendance.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: null,
              totalAttendance: { $sum: { $size: { $ifNull: ["$presentMembers", []] } } }
            }
          }
        ]).allowDiskUse(false)
      ]),
      
      // Ultra-optimized groups query with minimal fields and ultra-fast limits
      Group.find(groupId ? { _id: groupId } : {})
        .populate('leader', 'name email')
        .select('name leader')
        .lean()
        .limit(20) // Ultra-fast limit for maximum speed
        .exec()
    ]);

    const [leadersCount, groupsCount, membersCount, attendanceAgg] = basicStats;
    const totalAttendance = attendanceAgg[0]?.totalAttendance || 0;

    // Optimized: Get detailed stats for each group using aggregation
    const detailedStats = await Promise.all(
      groupsData.map(async (group) => {
        const g = group as unknown as GroupWithLeader;
        
        // Single aggregation query for group stats
        const groupStats = await Promise.all([
          User.find({ group: g._id, role: "member" }).select("name email").lean().limit(50),
          Event.find({ group: g._id, ...dateFilter }).select("title date createdBy location").lean().limit(20),
          Attendance.find({ group: g._id, ...dateFilter })
            .populate("event", "title date")
            .populate("presentMembers", "name email")
            .populate("absentMembers", "name email")
            .select("event presentMembers absentMembers date")
            .lean()
            .limit(30)
        ]);

        const [members, events, attendanceData] = groupStats;
        
        // Calculate attendance rate for each event (optimized)
        const eventAttendance = events.map(event => {
          const attendance = attendanceData.find(a => 
            a.event && a.event._id.toString() === event._id.toString()
          );
          
          const presentCount = attendance?.presentMembers?.length || 0;
          const absentCount = attendance?.absentMembers?.length || 0;
          const totalCount = presentCount + absentCount;
          const attendanceRate = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;
          
          return {
            eventId: event._id.toString(),
            title: event.title,
            date: event.date,
            location: event.location || '',
            presentCount,
            absentCount,
            attendanceRate: Math.round(attendanceRate),
            createdBy: event.createdBy
          };
        });
        
        // Calculate member attendance stats (optimized)
        const memberAttendance = members.map(member => {
          const memberId = (member as any)._id.toString();
          const presentCount = attendanceData.filter(a => 
            a.presentMembers.some(m => (m as any)._id.toString() === memberId)
          ).length;
          
          const absentCount = attendanceData.filter(a => 
            a.absentMembers.some(m => (m as any)._id.toString() === memberId)
          ).length;
          
          const totalEvents = presentCount + absentCount;
          const attendanceRate = totalEvents > 0 ? (presentCount / totalEvents) * 100 : 0;
          
          return {
            memberId: memberId,
            name: (member as any).name,
            email: (member as any).email,
            presentCount,
            absentCount,
            attendanceRate: Math.round(attendanceRate)
          };
        });
        
        // Calculate overall group attendance rate
        const totalPresent = attendanceData.reduce(
          (sum, record) => sum + (record.presentMembers?.length || 0), 0
        );
        const totalAbsent = attendanceData.reduce(
          (sum, record) => sum + (record.absentMembers?.length || 0), 0
        );
        const totalAttendees = totalPresent + totalAbsent;
        const groupAttendanceRate = totalAttendees > 0 
          ? (totalPresent / totalAttendees) * 100 
          : 0;

        return {
          groupId: g._id.toString(),
          groupName: g.name,
          leaderName: g.leader?.name || "Unassigned",
          leaderEmail: g.leader?.email || "N/A",
          memberCount: members.length,
          eventCount: events.length,
          attendanceCount: attendanceData.length,
          attendanceRate: Math.round(groupAttendanceRate),
          events: eventAttendance,
          members: memberAttendance
        };
      })
    );

    const result = {
      stats: {
        totalLeaders: leadersCount,
        totalGroups: groupsCount,
        totalMembers: membersCount,
        totalAttendance,
      },
      groups: detailedStats,
      filter: { from, to, groupId },
    };

    // Cache the result
    dashboardCache.set(cacheKey, { 
      data: result, 
      timestamp: Date.now(), 
      ttl: CACHE_DURATION 
    });

    console.log('📊 Returning optimized dashboard stats');

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching bishop dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}