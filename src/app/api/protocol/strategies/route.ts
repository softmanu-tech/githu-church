import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { ProtocolStrategy } from '@/lib/models/ProtocolStrategy';
import { User } from '@/lib/models/User';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

// GET strategies for protocol team
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

    // Get strategies for this team
    const strategies = await ProtocolStrategy.find({ 
      protocolTeam: protocolMember.protocolTeam._id 
    })
    .populate('submittedBy', 'name email')
    .populate('approvedBy', 'name email')
    .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: strategies
    });
  } catch (error: unknown) {
    console.error('Get protocol strategies error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch strategies' },
      { status: 500 }
    );
  }
}

// POST create new strategy
export async function POST(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['protocol']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const strategyData = await request.json();

    await dbConnect();

    // Get protocol member details
    const protocolMember = await User.findById(user.id).populate('protocolTeam');
    if (!protocolMember || !protocolMember.protocolTeam) {
      return NextResponse.json({ 
        error: 'Protocol member not assigned to a team' 
      }, { status: 400 });
    }

    // Validate required fields
    if (!strategyData.title || !strategyData.description) {
      return NextResponse.json({ 
        error: 'Title and description are required' 
      }, { status: 400 });
    }

    // Create new strategy
    const strategy = new ProtocolStrategy({
      protocolTeam: protocolMember.protocolTeam._id,
      submittedBy: user.id,
      
      category: strategyData.category,
      title: strategyData.title,
      description: strategyData.description,
      specificSteps: strategyData.specificSteps || [],
      
      measuredResults: strategyData.measuredResults || {
        beforeImplementation: { conversionRate: 0, visitorCount: 0, timeframe: '' },
        afterImplementation: { conversionRate: 0, visitorCount: 0, timeframe: '' },
        improvementPercentage: 0
      },
      
      successStories: strategyData.successStories || [],
      
      status: 'submitted', // Auto-submit for bishop review
      difficulty: strategyData.difficulty || 'beginner',
      tags: strategyData.tags || [],
      resourcesNeeded: strategyData.resourcesNeeded || [],
      estimatedTimeToImplement: strategyData.estimatedTimeToImplement || '',
      
      effectiveness: {
        timesShared: 0,
        timesImplemented: 0,
        averageImprovement: 0,
        feedback: []
      }
    });

    await strategy.save();

    // Populate the created strategy for response
    const populatedStrategy = await ProtocolStrategy.findById(strategy._id)
      .populate('submittedBy', 'name email')
      .populate('protocolTeam', 'name');

    return NextResponse.json({
      success: true,
      data: populatedStrategy,
      message: 'Strategy submitted successfully for bishop review'
    });
  } catch (error: unknown) {
    console.error('Create protocol strategy error:', error);
    return NextResponse.json(
      { error: 'Failed to create strategy' },
      { status: 500 }
    );
  }
}
