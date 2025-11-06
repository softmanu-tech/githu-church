// src/app/api/login/route.ts
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: Request) {
  try {
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
    return NextResponse.json({ message: 'Login failed' }, { status: 500 });
  }
}
