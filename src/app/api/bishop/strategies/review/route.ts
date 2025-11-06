import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { ProtocolStrategy } from '@/lib/models/ProtocolStrategy';
import { Notification } from '@/lib/models/Notification';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

// GET strategies for bishop review
export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get all strategies for review (submitted, approved, featured)
    const strategies = await ProtocolStrategy.find({
      status: { $in: ['submitted', 'approved', 'featured'] }
    })
    .populate('protocolTeam', 'name')
    .populate('submittedBy', 'name email')
    .populate('approvedBy', 'name email')
    .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: strategies
    });
  } catch (error: unknown) {
    console.error('Get strategies for review error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch strategies for review' },
      { status: 500 }
    );
  }
}

// PUT approve or reject strategy
export async function PUT(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { strategyId, action, notes } = await request.json();

    await dbConnect();

    // Validate action
    if (!['approve', 'reject', 'feature'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be approve, reject, or feature' 
      }, { status: 400 });
    }

    // Get strategy
    const strategy = await ProtocolStrategy.findById(strategyId)
      .populate('protocolTeam', 'name')
      .populate('submittedBy', 'name email');

    if (!strategy) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
    }

    // Update strategy status
    if (action === 'approve') {
      strategy.status = 'approved';
      strategy.approvedBy = user.id;
      strategy.approvalDate = new Date();
      strategy.approvalNotes = notes || '';
    } else if (action === 'feature') {
      strategy.status = 'featured';
      strategy.approvedBy = user.id;
      strategy.approvalDate = new Date();
      strategy.approvalNotes = notes || '';
    } else if (action === 'reject') {
      strategy.status = 'archived';
      strategy.approvalNotes = notes || 'Strategy rejected by bishop';
    }

    await strategy.save();

    // Create notification for the submitter
    const notificationTitle = action === 'approve' ? 'Strategy Approved!' : 
                             action === 'feature' ? 'Strategy Featured!' : 
                             'Strategy Review Update';
    
    const notificationMessage = action === 'approve' ? 
      `Your strategy "${strategy.title}" has been approved and is now available for sharing with other protocol teams.` :
      action === 'feature' ?
      `Congratulations! Your strategy "${strategy.title}" has been featured as a best practice and will be highlighted to all protocol teams.` :
      `Your strategy "${strategy.title}" has been reviewed. ${notes || 'Please see the bishop for more details.'}`;

    const notification = new Notification({
      recipient: strategy.submittedBy._id,
      type: 'system',
      title: notificationTitle,
      message: notificationMessage,
      relatedId: strategyId,
      isRead: false
    });

    await notification.save();

    return NextResponse.json({
      success: true,
      message: `Strategy ${action}d successfully`,
      data: {
        strategyId,
        newStatus: strategy.status,
        teamName: strategy.protocolTeam.name,
        submitterName: strategy.submittedBy.name
      }
    });
  } catch (error: unknown) {
    console.error('Review strategy error:', error);
    return NextResponse.json(
      { error: 'Failed to review strategy' },
      { status: 500 }
    );
  }
}
