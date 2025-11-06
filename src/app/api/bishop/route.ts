// app/api/bishop/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { requireSessionAndRoles } from "@/lib/authMiddleware";
import { User } from "@/lib/models/User";
import {Group} from "@/lib/models/Group";
import { Attendance } from "@/lib/models/Attendance";

// Cache for dashboard stats (2 minutes)
const dashboardCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireSessionAndRoles(req, ["bishop"]);

  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Create cache key based on filters
    const cacheKey = `dashboard-${from || 'default'}-${to || 'default'}`;
    const cached = dashboardCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📊 Returning cached dashboard stats');
      return NextResponse.json({
        ...cached.data,
        cached: true
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

    // Optimized: Use aggregation for attendance count instead of fetching all records
    const [leadersCount, groupsCount, membersCount, attendanceStats] = await Promise.all([
      User.countDocuments({ role: "leader" }),
      Group.countDocuments(),
      User.countDocuments({ role: "member" }),
      Attendance.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalAttendance: { $sum: { $size: { $ifNull: ["$presentMembers", []] } } }
          }
        }
      ])
    ]);

    const totalAttendance = attendanceStats[0]?.totalAttendance || 0;

    const result = {
      stats: {
        leaders: leadersCount,
        groups: groupsCount,
        members: membersCount,
        totalAttendance,
      },
      filter: { from, to },
    };

    // Cache the result
    dashboardCache.set(cacheKey, { data: result, timestamp: Date.now() });

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
