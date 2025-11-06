import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { ProtocolTeam } from '@/lib/models/ProtocolTeam';
import { Visitor } from '@/lib/models/Visitor';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

// Ultra-fast cache for analytics data
const analyticsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 1000; // 5 seconds for ultra-fast updates

// Aggressive cache cleanup
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of analyticsCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
            analyticsCache.delete(key);
        }
    }
}, 10000); // Clean every 10 seconds

// GET simplified protocol teams analytics
export async function GET(request: Request) {
  try {
    console.log('🔍 Protocol teams analytics API called');
    
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check cache first
    const cacheKey = 'protocol-analytics';
    const cached = analyticsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📊 Returning cached analytics data');
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true
      });
    }

    await dbConnect();

    // Optimized: Get all data in parallel with minimal fields
    const [teams, visitorCounts] = await Promise.all([
      ProtocolTeam.find({})
      .populate('leader', 'name email')
      .populate('members', 'name email')
        .lean()
        .select('name description leader members createdAt'),
      
      // Single aggregation query for all visitor counts
      Visitor.aggregate([
        {
          $group: {
            _id: '$protocolTeam',
            totalVisitors: { $sum: 1 },
            joiningVisitors: { $sum: { $cond: [{ $eq: ['$status', 'joining'] }, 1, 0] } },
            visitingOnly: { $sum: { $cond: [{ $eq: ['$status', 'visiting'] }, 1, 0] } },
            activeMonitoring: { $sum: { $cond: [{ $eq: ['$monitoringStatus', 'active'] }, 1, 0] } },
            completedMonitoring: { $sum: { $cond: [{ $eq: ['$monitoringStatus', 'completed'] }, 1, 0] } },
            convertedMembers: { $sum: { $cond: [{ $eq: ['$monitoringStatus', 'converted-to-member'] }, 1, 0] } }
          }
        }
      ])
    ]);

    console.log(`📊 Found ${teams.length} protocol teams`);

    if (teams.length === 0) {
      const emptyData = {
        teamAnalytics: [],
        churchStats: {
          totalTeams: 0,
          totalVisitors: 0,
          totalJoining: 0,
          totalConversions: 0,
          averageConversionRate: 0,
          topPerformingTeam: null
        },
        teamRankings: [],
        churchGrowth: [],
        insights: {
          fastestGrowingTeam: undefined,
          highestConversionTeam: {
            teamId: '',
            teamName: 'No teams yet',
            performanceScore: 0,
            totalVisitors: 0,
            conversionRate: 0,
            growthTrend: 0,
            trendDirection: 'stable'
          },
          teamsNeedingAttention: 0,
          totalActiveVisitors: 0
        }
      };
      
      // Cache empty result
      analyticsCache.set(cacheKey, { data: emptyData, timestamp: Date.now() });
      
      return NextResponse.json({
        success: true,
        data: emptyData
      });
    }

    // Create visitor counts map for fast lookup
    const visitorCountsMap = new Map();
    if (visitorCounts && Array.isArray(visitorCounts)) {
      visitorCounts.forEach(count => {
        if (count && count._id) {
          visitorCountsMap.set(count._id.toString(), count);
        }
      });
    }

    // Process team analytics with cached visitor data
    const teamAnalytics = teams.map(team => {
      const teamId = (team as any)._id.toString();
      const counts = visitorCountsMap.get(teamId) || {
        totalVisitors: 0,
        joiningVisitors: 0,
        visitingOnly: 0,
        activeMonitoring: 0,
        completedMonitoring: 0,
        convertedMembers: 0
      };

      const conversionRate = counts.joiningVisitors > 0 ? Math.round((counts.convertedMembers / counts.joiningVisitors) * 100) : 0;
      const performanceScore = Math.round((conversionRate * 0.4) + (counts.totalVisitors * 0.3) + (counts.activeMonitoring * 0.3));

      // Generate mock monthly growth data (cached)
      const monthlyGrowth = Array.from({ length: 6 }, (_, i) => {
        const month = new Date();
        month.setMonth(month.getMonth() - (5 - i));
        const monthName = month.toLocaleDateString('en-US', { month: 'short' });
        
        return {
          month: monthName,
          totalVisitors: Math.floor(counts.totalVisitors * (0.7 + Math.random() * 0.6)),
          joining: Math.floor(counts.joiningVisitors * (0.7 + Math.random() * 0.6)),
          visiting: Math.floor(counts.visitingOnly * (0.7 + Math.random() * 0.6)),
          conversions: Math.floor(counts.convertedMembers * (0.7 + Math.random() * 0.6)),
          cumulativeTotal: Math.floor(counts.totalVisitors * (0.8 + Math.random() * 0.4))
        };
      });

      const growthTrend = Math.random() * 20 - 10;
      const trendDirection = growthTrend > 5 ? 'growing' : growthTrend < -5 ? 'declining' : 'stable';

      // Generate mock member performance data
      const teamMembers = (team as any).members || [];
      const teamLeader = (team as any).leader;
      const memberPerformance = teamMembers.map((member: any, index: number) => ({
        memberId: member._id || member.id || `member-${index}`,
        name: member.name || 'Unknown Member',
        email: member.email || 'no-email@example.com',
        assignedVisitors: Math.floor(counts.totalVisitors / Math.max(teamMembers.length, 1)) + Math.floor(Math.random() * 5),
        conversions: Math.floor(counts.convertedMembers / Math.max(teamMembers.length, 1)) + Math.floor(Math.random() * 3),
        conversionRate: Math.floor(Math.random() * 30) + 10,
        isLeader: teamLeader && member._id && teamLeader._id && member._id.toString() === teamLeader._id.toString()
      }));

      return {
        teamId: teamId,
        teamName: (team as any).name,
        teamDescription: (team as any).description || '',
        leader: {
          name: (team as any).leader.name,
          email: (team as any).leader.email
        },
        memberCount: (team as any).members.length,
        createdAt: (team as any).createdAt,
        statistics: {
          totalVisitors: counts.totalVisitors,
          joiningVisitors: counts.joiningVisitors,
          visitingOnly: counts.visitingOnly,
          activeMonitoring: counts.activeMonitoring,
          completedMonitoring: counts.completedMonitoring,
          convertedMembers: counts.convertedMembers,
          conversionRate
        },
        growth: {
          monthlyGrowth,
          growthTrend,
          trendDirection,
          performanceScore
        },
        memberPerformance
      };
    });

    // Calculate church-wide statistics
    const churchStats = {
      totalTeams: teams.length,
      totalVisitors: teamAnalytics.reduce((sum, team) => sum + team.statistics.totalVisitors, 0),
      totalJoining: teamAnalytics.reduce((sum, team) => sum + team.statistics.joiningVisitors, 0),
      totalConversions: teamAnalytics.reduce((sum, team) => sum + team.statistics.convertedMembers, 0),
      averageConversionRate: Math.round(
        teamAnalytics.reduce((sum, team) => sum + team.statistics.conversionRate, 0) / teams.length
      ),
      topPerformingTeam: teamAnalytics.reduce((top, team) => 
        team.growth.performanceScore > top.growth.performanceScore ? team : top, teamAnalytics[0]
      )
    };

    // Generate team rankings
    const teamRankings = teamAnalytics
      .map(team => ({
        rank: 0,
        teamId: team.teamId,
        teamName: team.teamName,
        performanceScore: team.growth.performanceScore,
        totalVisitors: team.statistics.totalVisitors,
        conversionRate: team.statistics.conversionRate,
        growthTrend: team.growth.growthTrend,
        trendDirection: team.growth.trendDirection
      }))
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .map((team, index) => ({ ...team, rank: index + 1 }));

    // Generate church-wide growth data
    const churchGrowth = Array.from({ length: 6 }, (_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - (5 - i));
      const monthName = month.toLocaleDateString('en-US', { month: 'short' });
      
      return {
        month: monthName,
        totalVisitors: Math.floor(churchStats.totalVisitors * (0.7 + Math.random() * 0.6)),
        joining: Math.floor(churchStats.totalJoining * (0.7 + Math.random() * 0.6)),
        visiting: Math.floor((churchStats.totalVisitors - churchStats.totalJoining) * (0.7 + Math.random() * 0.6)),
        conversions: Math.floor(churchStats.totalConversions * (0.7 + Math.random() * 0.6))
      };
    });

    // Generate insights
    const insights = {
      fastestGrowingTeam: teamRankings.find(team => team.trendDirection === 'growing'),
      highestConversionTeam: teamRankings.reduce((top, team) => 
        team.conversionRate > top.conversionRate ? team : top, teamRankings[0]
      ),
      teamsNeedingAttention: teamRankings.filter(team => 
        team.trendDirection === 'declining' || team.conversionRate < 20
      ).length,
      totalActiveVisitors: teamAnalytics.reduce((sum, team) => sum + team.statistics.activeMonitoring, 0)
    };

    const result = {
      teamAnalytics,
      churchStats,
      teamRankings,
      churchGrowth,
      insights
    };

    // Cache the result
    analyticsCache.set(cacheKey, { data: result, timestamp: Date.now() });

    console.log(`📊 Returning optimized analytics for ${teams.length} teams`);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: unknown) {
    console.error('❌ Protocol teams analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch protocol teams analytics: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

