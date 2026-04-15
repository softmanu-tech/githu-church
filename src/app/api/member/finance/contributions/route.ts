import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import { FinanceContribution } from '@/lib/models/FinanceContribution';
import { FinanceCategory } from '@/lib/models/FinanceCategory';

// GET current member's own contributions, grouped by category
export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['member']);
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    const filter: Record<string, unknown> = { member: user.id };
    if (categoryId) filter.category = categoryId;

    const contributions = await FinanceContribution.find(filter)
      .populate('category', 'name payBill agentNumber isActive')
      .sort({ transactionDate: -1, createdAt: -1 });

    // Group by category for summary
    const byCategory: Record<
      string,
      { category: { _id: string; name: string; payBill: string; agentNumber: string; isActive: boolean }; totalAmount: number; count: number }
    > = {};

    for (const c of contributions) {
      const cat = c.category as { _id: { toString(): string }; name: string; payBill: string; agentNumber: string; isActive: boolean };
      const key = cat._id.toString();
      if (!byCategory[key]) {
        byCategory[key] = { category: { _id: key, name: cat.name, payBill: cat.payBill, agentNumber: cat.agentNumber, isActive: cat.isActive }, totalAmount: 0, count: 0 };
      }
      byCategory[key].totalAmount += c.amount;
      byCategory[key].count += 1;
    }

    const grandTotal = contributions.reduce((sum, c) => sum + c.amount, 0);

    // Also include active categories with zero contributions
    const activeCategories = await FinanceCategory.find({ isActive: true });
    for (const cat of activeCategories) {
      const key = (cat._id as { toString(): string }).toString();
      if (!byCategory[key]) {
        byCategory[key] = { category: { _id: key, name: cat.name, payBill: cat.payBill, agentNumber: cat.agentNumber, isActive: true }, totalAmount: 0, count: 0 };
      }
    }

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
          createdAt: c.createdAt,
        })),
        categorySummaries: Object.values(byCategory),
        grandTotal,
        totalCount: contributions.length,
      },
    });
  } catch (error) {
    console.error('GET /api/member/finance/contributions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
