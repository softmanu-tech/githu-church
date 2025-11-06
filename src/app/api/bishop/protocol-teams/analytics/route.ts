import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { ProtocolTeam } from '@/lib/models/ProtocolTeam';
import { Visitor } from '@/lib/models/Visitor';
import { User } from '@/lib/models/User';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

// GET comprehensive protocol teams analytics
export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get all active protocol teams with populated data
    const protocolTeams = await ProtocolTeam.find({ isActive: true })
      .populate('leader', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    // Get all visitors for analytics
    const allVisitors = await Visitor.find({}).exec();

    // Calculate performance analytics for each team
    const teamAnalytics = await Promise.all(protocolTeams.map(async (team) => {
      const teamVisitors = allVisitors.filter(v => v.protocolTeam && v.protocolTeam.toString() === team._id.toString());
      
      // Basic statistics
      const totalVisitors = teamVisitors.length;
      const joiningVisitors = teamVisitors.filter(v => v.status === 'joining').length;
      const visitingOnly = teamVisitors.filter(v => v.status === 'visiting').length;
      const activeMonitoring = teamVisitors.filter(v => v.monitoringStatus === 'active').length;
      const completedMonitoring = teamVisitors.filter(v => v.monitoringStatus === 'completed').length;
      const convertedMembers = teamVisitors.filter(v => v.monitoringStatus === 'converted-to-member').length;
      
      // Calculate conversion rate
      const conversionRate = joiningVisitors > 0 ? Math.round((convertedMembers / joiningVisitors) * 100) : 0;
      
      // Monthly growth analysis (last 12 months)
      const monthlyGrowth = [];
      const now = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        
        const monthVisitors = teamVisitors.filter(v => {
          const visitorDate = new Date(v.createdAt);
          return visitorDate >= monthStart && visitorDate <= monthEnd;
        });

        const monthJoining = monthVisitors.filter(v => v.status === 'joining').length;
        const monthVisiting = monthVisitors.filter(v => v.status === 'visiting').length;
        const monthConverted = teamVisitors.filter(v => {
          if (v.monitoringStatus !== 'converted-to-member') return false;
          const conversionDate = v.updatedAt ? new Date(v.updatedAt) : new Date(v.createdAt);
          return conversionDate >= monthStart && conversionDate <= monthEnd;
        }).length;

        monthlyGrowth.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          totalVisitors: monthVisitors.length,
          joining: monthJoining,
          visiting: monthVisiting,
          conversions: monthConverted,
          cumulativeTotal: teamVisitors.filter(v => new Date(v.createdAt) <= monthEnd).length
        });
      }

      // Calculate growth trends
      const recentMonths = monthlyGrowth.slice(-3);
      const previousMonths = monthlyGrowth.slice(-6, -3);
      
      const recentAvg = recentMonths.reduce((sum, month) => sum + month.totalVisitors, 0) / 3;
      const previousAvg = previousMonths.length > 0 ? previousMonths.reduce((sum, month) => sum + month.totalVisitors, 0) / previousMonths.length : 0;
      
      const growthTrend = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
      const trendDirection = growthTrend > 5 ? 'growing' : growthTrend < -5 ? 'declining' : 'stable';

      // Member performance within the team
      const memberPerformance = await Promise.all(team.members.map(async (member: any) => {
        const memberVisitors = teamVisitors.filter(v => v.assignedProtocolMember && v.assignedProtocolMember.toString() === member._id.toString());
        const memberConversions = memberVisitors.filter(v => v.monitoringStatus === 'converted-to-member').length;
        
        return {
          memberId: member._id,
          name: member.name,
          email: member.email,
          assignedVisitors: memberVisitors.length,
          conversions: memberConversions,
          conversionRate: memberVisitors.length > 0 ? Math.round((memberConversions / memberVisitors.length) * 100) : 0,
          isLeader: member._id.toString() === team.leader._id.toString()
        };
      }));

      // Performance score calculation (0-100)
      const performanceScore = Math.round(
        (conversionRate * 0.4) + // 40% weight on conversion rate
        (Math.min(totalVisitors / 10, 1) * 30) + // 30% weight on visitor count (max 10 visitors = 30 points)
        (Math.min(growthTrend / 20, 1) * 20) + // 20% weight on growth trend (max 20% growth = 20 points)
        (team.members.length > 1 ? 10 : 0) // 10% bonus for having multiple members
      );

      // Recent activity analysis
      const recentVisitors = teamVisitors
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      return {
        teamId: team._id,
        teamName: team.name,
        teamDescription: team.description,
        leader: {
          name: team.leader.name,
          email: team.leader.email
        },
        memberCount: team.members.length,
        createdAt: team.createdAt,
        
        // Core statistics
        statistics: {
          totalVisitors,
          joiningVisitors,
          visitingOnly,
          activeMonitoring,
          completedMonitoring,
          convertedMembers,
          conversionRate
        },
        
        // Growth and trend analysis
        growth: {
          monthlyGrowth,
          growthTrend: Math.round(growthTrend * 100) / 100,
          trendDirection,
          performanceScore
        },
        
        // Team member performance
        memberPerformance,
        
        // Recent activity
        recentActivity: recentVisitors.map(visitor => ({
          visitorName: visitor.name,
          status: visitor.status,
          monitoringStatus: visitor.monitoringStatus,
          createdAt: visitor.createdAt,
          assignedTo: visitor.assignedProtocolMember
        }))
      };
    }));

    // Calculate church-wide analytics
    const churchStats = {
      totalTeams: protocolTeams.length,
      totalVisitors: allVisitors.length,
      totalJoining: allVisitors.filter(v => v.status === 'joining').length,
      totalConversions: allVisitors.filter(v => v.monitoringStatus === 'converted-to-member').length,
      averageConversionRate: teamAnalytics.length > 0 ? 
        Math.round(teamAnalytics.reduce((sum, team) => sum + team.statistics.conversionRate, 0) / teamAnalytics.length) : 0,
      topPerformingTeam: teamAnalytics.length > 0 ? 
        teamAnalytics.reduce((top, current) => current.growth.performanceScore > top.growth.performanceScore ? current : top) : null
    };

    // Team rankings
    const teamRankings = teamAnalytics
      .sort((a, b) => b.growth.performanceScore - a.growth.performanceScore)
      .map((team, index) => ({
        rank: index + 1,
        teamId: team.teamId,
        teamName: team.teamName,
        performanceScore: team.growth.performanceScore,
        totalVisitors: team.statistics.totalVisitors,
        conversionRate: team.statistics.conversionRate,
        growthTrend: team.growth.growthTrend,
        trendDirection: team.growth.trendDirection
      }));

    // Monthly church-wide growth
    const churchGrowth = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthVisitors = allVisitors.filter(v => {
        const visitorDate = new Date(v.createdAt);
        return visitorDate >= monthStart && visitorDate <= monthEnd;
      });

      churchGrowth.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        totalVisitors: monthVisitors.length,
        joining: monthVisitors.filter(v => v.status === 'joining').length,
        visiting: monthVisitors.filter(v => v.status === 'visiting').length,
        conversions: allVisitors.filter(v => {
          if (v.monitoringStatus !== 'converted-to-member') return false;
          const conversionDate = v.updatedAt ? new Date(v.updatedAt) : new Date(v.createdAt);
          return conversionDate >= monthStart && conversionDate <= monthEnd;
        }).length
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        teamAnalytics,
        churchStats,
        teamRankings,
        churchGrowth,
        insights: {
          fastestGrowingTeam: teamRankings.find(team => team.trendDirection === 'growing'),
          highestConversionTeam: teamRankings.reduce((highest, current) => 
            current.conversionRate > highest.conversionRate ? current : highest, teamRankings[0]),
          teamsNeedingAttention: teamRankings.filter(team => 
            team.performanceScore < 30 || team.trendDirection === 'declining').length,
          totalActiveVisitors: allVisitors.filter(v => v.monitoringStatus === 'active').length
        }
      }
    });
  } catch (error: unknown) {
    console.error('Protocol teams analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch protocol teams analytics' },
      { status: 500 }
    );
  }
}
