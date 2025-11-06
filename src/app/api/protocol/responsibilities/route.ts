import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { Visitor } from '@/lib/models/Visitor';
import { ProtocolTeam } from '@/lib/models/ProtocolTeam';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

// GET protocol team responsibilities data
export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['protocol']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get protocol member details
    const protocolMember = await User.findById(user.id).populate('protocolTeam');
    if (!protocolMember || !protocolMember.protocolTeam) {
      return NextResponse.json({ 
        error: 'Protocol member not assigned to a team' 
      }, { status: 400 });
    }

    // Get all visitors assigned to this protocol member or team
    const visitors = await Visitor.find({
      $or: [
        { assignedProtocolMember: user.id },
        { protocolTeam: protocolMember.protocolTeam._id }
      ]
    })
    .populate('protocolTeam', 'name')
    .populate('assignedProtocolMember', 'name email')
    .sort({ createdAt: -1 });

    // Calculate statistics for responsibilities
    const totalVisitors = visitors.length;
    const joiningVisitors = visitors.filter(v => v.status === 'joining').length;
    const activeMonitoring = visitors.filter(v => v.monitoringStatus === 'active').length;
    const needsAttention = visitors.filter(v => {
      if (v.monitoringStatus !== 'active') return false;
      const daysSinceStart = v.monitoringStartDate ? 
        Math.floor((new Date().getTime() - new Date(v.monitoringStartDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      return daysSinceStart > 75; // More than 2.5 months
    }).length;

    // Recent feedback count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentFeedback = visitors.reduce((count, visitor) => {
      const recentSuggestions = visitor.suggestions.filter((s: any) => new Date(s.date) >= thirtyDaysAgo).length;
      const recentExperiences = visitor.experiences.filter((e: any) => new Date(e.date) >= thirtyDaysAgo).length;
      return count + recentSuggestions + recentExperiences;
    }, 0);

    // Pending reports (teams that haven't reported in 7 days)
    const pendingReports = 1; // Simplified for now

    // Recent activities for dashboard
    const recentActivities: any[] = [];
    
    // Add recent visitor registrations
    visitors.slice(0, 5).forEach(visitor => {
      recentActivities.push({
        type: 'registration',
        description: `Registered new ${visitor.status} visitor: ${visitor.name}`,
        date: visitor.createdAt,
        visitorName: visitor.name
      });
    });

    // Add recent feedback
    visitors.forEach(visitor => {
      visitor.suggestions.slice(-2).forEach((suggestion: any) => {
        recentActivities.push({
          type: 'feedback',
          description: `Collected suggestion from ${visitor.name}`,
          date: suggestion.date,
          visitorName: visitor.name
        });
      });
    });

    // Sort by date
    recentActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Process visitors data for frontend
    const processedVisitors = visitors.map(visitor => {
      // Calculate monitoring progress
      const completedMilestones = visitor.milestones.filter((m: any) => m.completed).length;
      const monitoringProgress = Math.round((completedMilestones / 12) * 100);
      
      // Calculate days remaining
      const startDate = visitor.monitoringStartDate ? new Date(visitor.monitoringStartDate) : new Date(visitor.createdAt);
      const endDate = new Date(startDate.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days
      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
      
      // Calculate attendance rate (simplified)
      const attendanceRate = visitor.visitHistory.length > 0 ? 
        Math.round((visitor.visitHistory.filter((v: any) => v.attendanceStatus === 'present').length / visitor.visitHistory.length) * 100) : 0;

      return {
        _id: visitor._id,
        name: visitor.name,
        email: visitor.email,
        phone: visitor.phone,
        address: visitor.address,
        type: visitor.type,
        status: visitor.status,
        monitoringStatus: visitor.monitoringStatus,
        attendanceRate,
        monitoringProgress,
        daysRemaining,
        createdAt: visitor.createdAt,
        visitHistory: visitor.visitHistory,
        suggestions: visitor.suggestions,
        experiences: visitor.experiences,
        milestones: visitor.milestones
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        protocolMember: {
          name: protocolMember.name,
          email: protocolMember.email,
          team: {
            name: protocolMember.protocolTeam.name,
            description: protocolMember.protocolTeam.description
          }
        },
        visitors: processedVisitors,
        statistics: {
          totalVisitors,
          joiningVisitors,
          activeMonitoring,
          needsAttention,
          recentFeedback,
          pendingReports
        },
        recentActivities: recentActivities.slice(0, 10)
      }
    });
  } catch (error: unknown) {
    console.error('Protocol responsibilities error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch protocol responsibilities data' },
      { status: 500 }
    );
  }
}
