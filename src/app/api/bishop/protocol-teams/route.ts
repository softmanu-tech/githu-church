import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { ProtocolTeam } from '@/lib/models/ProtocolTeam';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import bcrypt from 'bcryptjs';

// Ultra-fast caching for protocol teams
const teamsCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_DURATION = 5 * 1000; // 5 seconds for ultra-fast updates

// Aggressive cache cleanup
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of teamsCache.entries()) {
        if (now - value.timestamp > value.ttl) {
            teamsCache.delete(key);
        }
    }
}, 10000); // Clean every 10 seconds

// GET all protocol teams - Ultra-optimized version
export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check cache first
    const cacheKey = 'protocol-teams';
    const cached = teamsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true
      });
    }

    await dbConnect();

    // Ultra-optimized: Get teams and visitor stats in parallel with aggregation
    const [protocolTeams, visitorStats] = await Promise.all([
      ProtocolTeam.find({ isActive: true })
        .populate('leader', 'name email phone')
        .populate('members', 'name email phone')
        .select('name description leader members responsibilities createdAt')
        .lean()
        .sort({ createdAt: -1 }),
      
      // Single aggregation query for all visitor statistics
      (async () => {
        const { Visitor } = await import('@/lib/models/Visitor');
        return Visitor.aggregate([
          {
            $group: {
              _id: '$protocolTeam',
              totalVisitors: { $sum: 1 },
              joiningVisitors: { $sum: { $cond: [{ $eq: ['$status', 'joining'] }, 1, 0] } },
              activeMonitoring: { $sum: { $cond: [{ $eq: ['$monitoringStatus', 'active'] }, 1, 0] } },
              convertedMembers: { $sum: { $cond: [{ $eq: ['$monitoringStatus', 'converted-to-member'] }, 1, 0] } }
            }
          }
        ]);
      })()
    ]);

    // Create stats lookup map for O(1) access
    const statsMap = new Map();
    visitorStats.forEach(stat => {
      statsMap.set(stat._id.toString(), stat);
    });

    // Combine teams with their stats
    const teamsWithStats = protocolTeams.map(team => {
      const teamId = (team as any)._id.toString();
      const stats = statsMap.get(teamId) || {
        totalVisitors: 0,
        joiningVisitors: 0,
        activeMonitoring: 0,
        convertedMembers: 0
      };

      return {
        ...team,
        stats: {
          ...stats,
          conversionRate: stats.joiningVisitors > 0 ? Math.round((stats.convertedMembers / stats.joiningVisitors) * 100) : 0
        }
      };
    });

    const responseData = teamsWithStats;

    // Cache the result
    teamsCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
      ttl: CACHE_DURATION
    });

    return NextResponse.json({
      success: true,
      data: responseData
    });
  } catch (error: unknown) {
    console.error('Protocol teams fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch protocol teams' },
      { status: 500 }
    );
  }
}

// POST create new protocol team
export async function POST(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      name, 
      description, 
      leaderName, 
      leaderEmail, 
      responsibilities 
    } = await request.json();

    await dbConnect();

    // Validate required fields
    if (!name || !leaderName || !leaderEmail) {
      return NextResponse.json({ 
        error: 'Team name, leader name, and leader email are required' 
      }, { status: 400 });
    }

    // Check if team name already exists
    const existingTeam = await ProtocolTeam.findOne({ name });
    if (existingTeam) {
      return NextResponse.json({ 
        error: 'Protocol team with this name already exists' 
      }, { status: 400 });
    }

    // Create protocol team leader account
    const temporaryPassword = Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const protocolLeader = new User({
      name: leaderName,
      email: leaderEmail,
      password: hashedPassword,
      role: 'protocol'
    });

    await protocolLeader.save();

    // Create protocol team
    const protocolTeam = new ProtocolTeam({
      name,
      description,
      leader: protocolLeader._id,
      members: [protocolLeader._id], // Leader is also a member
      responsibilities: responsibilities || [
        'Welcome and register visitors',
        'Monitor joining visitors progress',
        'Collect visitor feedback and experiences',
        'Report to bishop on visitor engagement',
        'Assist visitors with church integration'
      ],
      createdBy: user.id
    });

    await protocolTeam.save();

    // Update the leader's protocolTeam reference
    protocolLeader.protocolTeam = protocolTeam._id;
    await protocolLeader.save();

    return NextResponse.json({
      success: true,
      data: {
        team: protocolTeam,
        leader: {
          _id: protocolLeader._id,
          name: protocolLeader.name,
          email: protocolLeader.email,
          temporaryPassword // Return for initial setup
        }
      },
      message: 'Protocol team created successfully'
    });
  } catch (error: unknown) {
    console.error('Protocol team creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create protocol team' },
      { status: 500 }
    );
  }
}
