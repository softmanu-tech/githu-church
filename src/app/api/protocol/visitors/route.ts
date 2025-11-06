import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

// Import models in dependency order to ensure proper registration
import '@/lib/models/Group';
import '@/lib/models/Notification';
import '@/lib/models/ProtocolTeam';
import '@/lib/models/Visitor';
import '@/lib/models/User';

// Import model classes
import { User } from '@/lib/models/User';
import { ProtocolTeam } from '@/lib/models/ProtocolTeam';
import { Visitor } from '@/lib/models/Visitor';

// Ultra-fast caching
const visitorsCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_DURATION = 5 * 1000; // 5 seconds for ultra-fast updates

// Cache cleanup
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of visitorsCache.entries()) {
        if (now - value.timestamp > value.ttl) {
            visitorsCache.delete(key);
        }
    }
}, 15000); // Clean every 15 seconds

// GET visitors for protocol member - Ultra-optimized version
export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['protocol']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check cache first
    const cacheKey = `visitors-${user.id}`;
    const cached = visitorsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true
      });
    }

    await dbConnect();

    // Ultra-optimized parallel queries
    const [protocolMember, visitors] = await Promise.all([
      User.findById(user.id).select('name email profilePicture protocolTeam').lean(),
      Visitor.find({
        $or: [
          { assignedProtocolMember: user.id },
          { protocolTeam: (user as any).protocolTeam }
        ]
      })
      .select('name email phone address type status monitoringStatus attendanceRate monitoringProgress monitoringEndDate createdAt')
      .sort({ createdAt: -1 })
      .limit(100) // Limit for performance
      .lean()
    ]);

    if (!protocolMember) {
      return NextResponse.json({ 
        error: 'Protocol member not found' 
      }, { status: 400 });
    }

    // Get protocol team details (cached)
    let protocolTeam = null;
    if ((protocolMember as any).protocolTeam) {
      protocolTeam = await ProtocolTeam.findById((protocolMember as any).protocolTeam)
        .select('name description')
        .lean();
    }

    // Calculate statistics using aggregation for speed
    const stats = visitors.reduce((acc, visitor) => {
      acc.totalVisitors++;
      if (visitor.type === 'joining') acc.joiningVisitors++;
      if (visitor.type === 'visiting') acc.visitingOnly++;
      if (visitor.status === 'monitoring') acc.activeMonitoring++;
      if (visitor.status === 'completed') acc.completedMonitoring++;
      if (visitor.status === 'converted') acc.convertedToMembers++;
      if (visitor.status === 'needs-attention') acc.needsAttention++;
      return acc;
    }, {
      totalVisitors: 0,
      joiningVisitors: 0,
      visitingOnly: 0,
      activeMonitoring: 0,
      completedMonitoring: 0,
      convertedToMembers: 0,
      needsAttention: 0
    });
    
    const conversionRate = stats.totalVisitors > 0 ? Math.round((stats.convertedToMembers / stats.totalVisitors) * 100) : 0;

    const dashboardData = {
      protocolMember: {
        name: (protocolMember as any).name,
        email: (protocolMember as any).email,
        profilePicture: (protocolMember as any).profilePicture,
        team: {
          name: (protocolTeam as any)?.name || 'Protocol Team',
          description: (protocolTeam as any)?.description || 'Visitor management and integration team'
        }
      },
      visitors: visitors.map(visitor => ({
        _id: visitor._id,
        name: visitor.name,
        email: visitor.email,
        phone: visitor.phone,
        address: visitor.address,
        type: visitor.type,
        status: visitor.status,
        monitoringStatus: visitor.monitoringStatus || 'inactive',
        attendanceRate: visitor.attendanceRate || 0,
        monitoringProgress: visitor.monitoringProgress || 0,
        daysRemaining: visitor.monitoringEndDate ? 
          Math.max(0, Math.ceil((new Date(visitor.monitoringEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0,
        createdAt: visitor.createdAt
      })),
      statistics: {
        ...stats,
        conversionRate
      }
    };

    // Cache the result
    visitorsCache.set(cacheKey, {
      data: dashboardData,
      timestamp: Date.now(),
      ttl: CACHE_DURATION
    });

    return NextResponse.json({
      success: true,
      data: dashboardData
    });
  } catch (error: unknown) {
    console.error('Protocol visitors error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch protocol dashboard data' },
      { status: 500 }
    );
  }
}

// POST create new visitor - Simplified version  
export async function POST(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['protocol']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      name,
      email,
      phone,
      address,
      age,
      occupation,
      maritalStatus,
      type,
      status,
      referredBy,
      howDidYouHear,
      emergencyContact
    } = await request.json();

    await dbConnect();

    // Get protocol member details
    const protocolMember = await User.findById(user.id);
    if (!protocolMember) {
      return NextResponse.json({ 
        error: 'Protocol member not found' 
      }, { status: 400 });
    }

    // Validate required fields
    if (!name || !email || !type || !status) {
      return NextResponse.json({ 
        error: 'Name, email, type, and status are required' 
      }, { status: 400 });
    }

    // Check if visitor with this email already exists
    const existingVisitor = await Visitor.findOne({ email });
    if (existingVisitor) {
      return NextResponse.json({ 
        error: 'Visitor with this email already exists' 
      }, { status: 400 });
    }

    // Get protocol team for this member
    let protocolTeam = null;
    if ((protocolMember as any).protocolTeam) {
      protocolTeam = await ProtocolTeam.findById((protocolMember as any).protocolTeam);
    }

    // Create new visitor
    const visitor = new Visitor({
      name,
      email,
      phone,
      address,
      age: age ? Number(age) : undefined,
      occupation,
      maritalStatus,
      type,
      status,
      referredBy,
      howDidYouHear,
      emergencyContact,
      assignedProtocolMember: user.id,
      protocolTeam: (protocolMember as any).protocolTeam,
      monitoringStartDate: status === 'joining' ? new Date() : undefined,
      monitoringEndDate: status === 'joining' ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) : undefined, // 90 days from now
      monitoringStatus: status === 'joining' ? 'active' : 'inactive',
      // Initialize arrays and objects
      visitHistory: [],
      suggestions: [],
      experiences: [],
      eventResponses: [],
      milestones: status === 'joining' ? Array.from({ length: 12 }, (_, i) => ({
        week: i + 1,
        completed: false
      })) : [],
      integrationChecklist: {
        welcomePackage: false,
        homeVisit: false,
        smallGroupIntro: false,
        ministryOpportunities: false,
        mentorAssigned: false,
        regularCheckIns: false
      },
      isActive: true,
      canLogin: status === 'joining' // Only joining visitors can login
    });

    await visitor.save();

    // Clear cache for this protocol member
    const cacheKey = `visitors-${user.id}`;
    visitorsCache.delete(cacheKey);

    return NextResponse.json({
      success: true,
      message: 'Visitor registered successfully',
      data: {
        _id: visitor._id,
        name: visitor.name,
        email: visitor.email,
        phone: visitor.phone,
        type: visitor.type,
        status: visitor.status,
        canLogin: visitor.canLogin,
        monitoringStatus: visitor.monitoringStatus,
        createdAt: visitor.createdAt
      }
    });
  } catch (error: unknown) {
    console.error('Create visitor error:', error);
    
    // Handle specific MongoDB errors
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { error: 'Visitor with this email already exists' },
          { status: 400 }
        );
      }
      if (error.message.includes('validation')) {
        return NextResponse.json(
          { error: 'Invalid visitor data provided' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create visitor' },
      { status: 500 }
    );
  }
}