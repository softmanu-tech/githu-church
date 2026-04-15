import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import { FinanceCategory } from '@/lib/models/FinanceCategory';
import { FinanceContribution } from '@/lib/models/FinanceContribution';

// GET all categories with totals
export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const categories = await FinanceCategory.find({}).sort({ createdAt: -1 });

    // Attach aggregated stats for each category
    const withStats = await Promise.all(
      categories.map(async (cat) => {
        const agg = await FinanceContribution.aggregate([
          { $match: { category: cat._id } },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 },
              contributors: { $addToSet: '$member' },
            },
          },
        ]);

        const stats = agg[0] ?? { totalAmount: 0, count: 0, contributors: [] };

        return {
          _id: cat._id,
          name: cat.name,
          payBill: cat.payBill,
          agentNumber: cat.agentNumber,
          isActive: cat.isActive,
          createdAt: cat.createdAt,
          totalAmount: stats.totalAmount,
          contributionsCount: stats.count,
          contributorsCount: stats.contributors.length,
        };
      })
    );

    return NextResponse.json({ success: true, data: withStats });
  } catch (error) {
    console.error('GET /api/bishop/finance/categories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new category
export async function POST(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const body = await request.json();
    const { name, payBill, agentNumber } = body;

    if (!name?.trim() || !payBill?.trim() || !agentNumber?.trim()) {
      return NextResponse.json(
        { error: 'name, payBill and agentNumber are required' },
        { status: 400 }
      );
    }

    const category = await FinanceCategory.create({
      name: name.trim(),
      payBill: payBill.trim(),
      agentNumber: agentNumber.trim(),
      createdBy: user.id,
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error('POST /api/bishop/finance/categories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
