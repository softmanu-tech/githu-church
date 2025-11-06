// app/api/init/route.ts
import { initBishop } from '@/lib/initBishop'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await initBishop()
    return NextResponse.json({ 
      success: true,
      message: "Bishop initialized successfully" 
    })
  } catch (error: unknown) {
    console.error('Init API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to initialize bishop' 
      },
      { status: 500 }
    );
  }
}
