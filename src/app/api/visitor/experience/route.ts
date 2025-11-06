import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Visitor } from '@/lib/models/Visitor';

export async function POST(request: Request) {
  try {
    const token = request.headers.get('cookie')?.split('auth_token=')[1]?.split(';')[0];
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const { verifyToken } = await import('@/lib/shared/jwt');
    let payload;
    try {
      payload = await verifyToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (payload.role !== 'visitor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rating, message, eventType } = await request.json();

    if (!rating || !message || rating < 1 || rating > 5) {
      return NextResponse.json({ 
        error: 'Valid rating (1-5) and message are required' 
      }, { status: 400 });
    }

    await dbConnect();

    const visitor = await Visitor.findById(payload.id);
    if (!visitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    // Add experience to visitor record
    visitor.experiences.push({
      date: new Date(),
      rating,
      message,
      eventType: eventType || undefined
    });

    await visitor.save();

    return NextResponse.json({
      success: true,
      message: 'Experience shared successfully'
    });
  } catch (error: unknown) {
    console.error('Visitor experience error:', error);
    return NextResponse.json(
      { error: 'Failed to submit experience' },
      { status: 500 }
    );
  }
}