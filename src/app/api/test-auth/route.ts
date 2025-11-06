import { NextResponse } from 'next/server';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

export async function GET(request: Request) {
  try {
    console.log('🔍 Test auth API called');
    
    const { user } = await requireSessionAndRoles(request, ['leader']);
    console.log('✅ User authenticated:', user.email);
    
    return NextResponse.json({
      success: true,
      message: 'Authentication working',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Auth test error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
