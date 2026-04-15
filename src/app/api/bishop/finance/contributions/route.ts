import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import { FinanceContribution } from '@/lib/models/FinanceContribution';

// GET contributions – optionally filtered by ?categoryId=xxx
export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    const filter: Record<string, unknown> = {};
    if (categoryId) filter.category = categoryId;

    const contributions = await FinanceContribution.find(filter)
      .populate('category', 'name payBill agentNumber')
      .populate('member', 'name email phone')
      .sort({ transactionDate: -1, createdAt: -1 });

    const totalAmount = contributions.reduce((sum, c) => sum + c.amount, 0);

    return NextResponse.json({
      success: true,
      data: {
        contributions: contributions.map((c) => ({
          _id: c._id,
          referenceNumber: c.referenceNumber,
          amount: c.amount,
          bankName: c.bankName,
          accountNumber: c.accountNumber,
          transactionDate: c.transactionDate,
          transactionTime: c.transactionTime,
          category: c.category,
          member: c.member,
          createdAt: c.createdAt,
        })),
        totalAmount,
        count: contributions.length,
      },
    });
  } catch (error) {
    console.error('GET /api/bishop/finance/contributions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
