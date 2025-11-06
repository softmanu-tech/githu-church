import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { Visitor } from '@/lib/models/Visitor';
import { ProtocolTeam } from '@/lib/models/ProtocolTeam';
import { Notification } from '@/lib/models/Notification';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

// POST generate and send report to bishop
export async function POST(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['protocol']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'monthly';

    await dbConnect();

    // Get protocol member details
    const protocolMember = await User.findById(user.id).populate('protocolTeam');
    if (!protocolMember || !protocolMember.protocolTeam) {
      return NextResponse.json({ 
        error: 'Protocol member not assigned to a team' 
      }, { status: 400 });
    }

    // Get bishop user
    const bishop = await User.findOne({ role: 'bishop' });
    if (!bishop) {
      return NextResponse.json({ error: 'Bishop not found' }, { status: 404 });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(now.getMonth() - 3);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Get visitors for this period
    const visitors = await Visitor.find({
      $or: [
        { assignedProtocolMember: user.id },
        { protocolTeam: protocolMember.protocolTeam._id }
      ],
      createdAt: { $gte: startDate }
    });

    // Calculate engagement metrics
    const totalVisitors = visitors.length;
    const newJoining = visitors.filter(v => v.status === 'joining').length;
    const conversions = visitors.filter(v => v.monitoringStatus === 'converted-to-member').length;
    const activeMonitoring = visitors.filter(v => v.monitoringStatus === 'active').length;
    
    // Feedback metrics
    const totalFeedback = visitors.reduce((count, visitor) => {
      const periodSuggestions = visitor.suggestions.filter((s: any) => new Date(s.date) >= startDate).length;
      const periodExperiences = visitor.experiences.filter((e: any) => new Date(e.date) >= startDate).length;
      return count + periodSuggestions + periodExperiences;
    }, 0);

    const averageRating = visitors.length > 0 ? 
      (visitors.reduce((sum, visitor) => {
        const periodExperiences = visitor.experiences.filter((e: any) => new Date(e.date) >= startDate);
        const visitorAvg = periodExperiences.length > 0 ?
          periodExperiences.reduce((rSum: any, e: any) => rSum + e.rating, 0) / periodExperiences.length : 0;
        return sum + visitorAvg;
      }, 0) / visitors.length).toFixed(1) : '0';

    // Top feedback themes
    const feedbackCategories: any = {};
    visitors.forEach(visitor => {
      visitor.suggestions.filter((s: any) => new Date(s.date) >= startDate).forEach((suggestion: any) => {
        feedbackCategories[suggestion.category] = (feedbackCategories[suggestion.category] || 0) + 1;
      });
    });

    const topFeedbackThemes = Object.entries(feedbackCategories)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }));

    // Visitors needing attention
    const visitorsNeedingAttention = visitors.filter(v => {
      if (v.monitoringStatus !== 'active') return false;
      const daysSinceStart = v.monitoringStartDate ? 
        Math.floor((now.getTime() - new Date(v.monitoringStartDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      return daysSinceStart > 75; // More than 2.5 months
    });

    // Generate report content
    const reportContent = {
      period: period,
      dateRange: `${startDate.toLocaleDateString()} - ${now.toLocaleDateString()}`,
      teamName: protocolMember.protocolTeam.name,
      protocolMemberName: protocolMember.name,
      
      metrics: {
        totalVisitors,
        newJoining,
        conversions,
        activeMonitoring,
        totalFeedback,
        averageRating: parseFloat(averageRating),
        conversionRate: newJoining > 0 ? Math.round((conversions / newJoining) * 100) : 0
      },
      
      highlights: [
        `Registered ${totalVisitors} new visitors`,
        `${newJoining} visitors expressed interest in joining`,
        `Achieved ${conversions} conversions to membership`,
        `Collected ${totalFeedback} pieces of feedback`,
        `Maintained ${averageRating}/5 average visitor satisfaction`
      ],
      
      concerns: visitorsNeedingAttention.map(v => ({
        name: v.name,
        daysInMonitoring: v.monitoringStartDate ? 
          Math.floor((now.getTime() - new Date(v.monitoringStartDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
        progress: Math.round((v.milestones.filter((m: any) => m.completed).length / 12) * 100)
      })),
      
      feedbackThemes: topFeedbackThemes,
      
      recommendations: [
        totalVisitors === 0 ? 'Focus on visitor outreach and recruitment' : null,
        conversions === 0 && newJoining > 0 ? 'Review conversion strategies and follow-up processes' : null,
        visitorsNeedingAttention.length > 0 ? `${visitorsNeedingAttention.length} visitors need immediate attention` : null,
        parseFloat(averageRating) < 4 ? 'Address visitor satisfaction concerns' : null
      ].filter(Boolean)
    };

    // Create notification for bishop
    const reportMessage = `${period.charAt(0).toUpperCase() + period.slice(1)} Protocol Team Report from ${protocolMember.protocolTeam.name}:

📊 Key Metrics:
• ${totalVisitors} new visitors registered
• ${newJoining} visitors interested in joining  
• ${conversions} successful conversions
• ${totalFeedback} feedback items collected
• ${averageRating}/5 average satisfaction rating

${visitorsNeedingAttention.length > 0 ? `⚠️ ${visitorsNeedingAttention.length} visitors need immediate attention` : '✅ All visitors on track'}

${reportContent.recommendations.length > 0 ? `📝 Recommendations:\n${reportContent.recommendations.map(r => `• ${r}`).join('\n')}` : '✅ No immediate concerns'}

Report generated by: ${protocolMember.name}
Period: ${reportContent.dateRange}`;

    const notification = new Notification({
      recipient: bishop._id,
      type: 'system',
      title: `${period.charAt(0).toUpperCase() + period.slice(1)} Protocol Report - ${protocolMember.protocolTeam.name}`,
      message: reportMessage,
      relatedId: protocolMember.protocolTeam._id,
      isRead: false
    });

    await notification.save();

    return NextResponse.json({
      success: true,
      message: `${period.charAt(0).toUpperCase() + period.slice(1)} report sent to bishop successfully`,
      data: reportContent
    });
  } catch (error: unknown) {
    console.error('Generate bishop report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate bishop report' },
      { status: 500 }
    );
  }
}
