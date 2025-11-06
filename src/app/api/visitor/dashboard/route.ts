import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Visitor } from '@/lib/models/Visitor';
import Event from '@/lib/models/Event';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

export async function GET(request: Request) {
  try {
    // Check if user is a visitor (we'll need to modify authMiddleware to support visitors)
    const token = request.headers.get('cookie')?.split('auth_token=')[1]?.split(';')[0];
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    await dbConnect();

    // For now, we'll decode the token manually to get visitor info
    // In production, you'd want to enhance the auth middleware
    const { verifyToken } = await import('@/lib/shared/jwt');
    let payload;
    try {
      payload = await verifyToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get visitor data
    const visitor = await Visitor.findById(payload.id)
      .populate('protocolTeam', 'name')
      .populate('assignedProtocolMember', 'name email phone');

    if (!visitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    // Get upcoming events (church-wide events for visitors)
    const upcomingEvents = await Event.find({
      date: { $gte: new Date() }
    })
    .sort({ date: 1 })
    .limit(5)
    .select('title date location description');

    // Calculate statistics
    const totalVisits = visitor.visitHistory.length;
    const presentCount = visitor.visitHistory.filter((v: any) => v.attendanceStatus === 'present').length;
    const attendanceRate = totalVisits > 0 ? Math.round((presentCount / totalVisits) * 100) : 0;
    
    const completedMilestones = visitor.milestones.filter((m: any) => m.completed).length;
    const averageRating = visitor.experiences.length > 0 
      ? Math.round((visitor.experiences.reduce((sum: any, exp: any) => sum + exp.rating, 0) / visitor.experiences.length) * 10) / 10
      : 0;

    const monitoringStartDate = new Date(visitor.monitoringStartDate || visitor.createdAt);
    const daysInProgram = Math.floor((Date.now() - monitoringStartDate.getTime()) / (1000 * 60 * 60 * 24));

    // Get milestone progress for charts
    const milestoneProgress = visitor.milestones.map((milestone: any) => ({
      week: milestone.week,
      completed: milestone.completed,
      notes: milestone.notes,
      completedDate: milestone.completedDate
    }));

    // Calculate days remaining
    const daysRemaining = visitor.monitoringEndDate 
      ? Math.max(0, Math.ceil((new Date(visitor.monitoringEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        visitor: {
          ...visitor.toObject(),
          attendanceRate,
          monitoringProgress: Math.round((completedMilestones / 12) * 100),
          daysRemaining
        },
        visitHistory: visitor.visitHistory.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        milestones: milestoneProgress,
        upcomingEvents,
        suggestions: visitor.suggestions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        experiences: visitor.experiences.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        statistics: {
          totalVisits,
          presentCount,
          attendanceRate,
          completedMilestones,
          averageRating,
          daysInProgram
        }
      }
    });
  } catch (error: unknown) {
    console.error('Visitor dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visitor dashboard data' },
      { status: 500 }
    );
  }
}
