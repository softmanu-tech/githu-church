import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import { FinanceCategory } from '@/lib/models/FinanceCategory';

// GET active categories (visible to members)
export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['member']);
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const categories = await FinanceCategory.find({ isActive: true }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: categories.map((cat) => ({
        _id: cat._id,
        name: cat.name,
        payBill: cat.payBill,
        agentNumber: cat.agentNumber,
      })),
    });
  } catch (error) {
    console.error('GET /api/member/finance/categories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
