// src/app/api/login/route.ts
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';

export const dynamic = 'force-dynamic';

// Validate JWT_SECRET at module level
const JWT_SECRET = process.env.JWT_SECRET?.trim();
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is not set!');
}

export async function POST(req: Request) {
  try {
    // Validate JWT_SECRET at runtime
    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET is missing in environment variables');
      return NextResponse.json(
        { message: 'Server configuration error. Please contact administrator.' },
        { status: 500 }
      );
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password required' }, { status: 400 });
    }

    await dbConnect();
    
    // Ultra-optimized: Parallel user and visitor lookup
    const [user, visitor] = await Promise.all([
      User.findOne({ email }).select('+password').lean(),
      (async () => {
        const { Visitor } = await import('@/lib/models/Visitor');
        return Visitor.findOne({ email, canLogin: true }).select('+password').lean();
      })()
    ]);
    
    // Determine which user to authenticate
    let authUser: any = user;
    if (!user && visitor) {
      const visitorData = visitor as any;
      authUser = {
        _id: visitorData._id,
        email: visitorData.email,
        name: visitorData.name,
        password: visitorData.password,
        role: 'visitor'
      };
    }

    if (!authUser || !(await bcrypt.compare(password, (authUser as any).password))) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Ultra-fast JWT creation
    const token = await new SignJWT({
      id: (authUser as any)._id.toString(),
      email: (authUser as any).email,
      role: (authUser as any).role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(secret);

    // Ultra-fast cookie setting
    const cookieStore = await cookies(); 
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2,
    });

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: (authUser as any)._id,
        email: (authUser as any).email,
        name: (authUser as any).name,
        role: (authUser as any).role,
      },
      redirectTo: (authUser as any).role === 'bishop' ? '/bishop' : 
                  (authUser as any).role === 'leader' ? '/leader' : 
                  (authUser as any).role === 'protocol' ? '/protocol' :
                  (authUser as any).role === 'visitor' ? '/visitor' : '/member',
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Better error messages for debugging
    let errorMessage = 'Login failed';
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check for specific error types
      if (error.message.includes('MongoDB') || error.message.includes('connection')) {
        errorMessage = 'Database connection error. Please try again.';
      } else if (error.message.includes('JWT') || error.message.includes('secret')) {
        errorMessage = 'Authentication service error. Please contact administrator.';
      }
    }
    
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
