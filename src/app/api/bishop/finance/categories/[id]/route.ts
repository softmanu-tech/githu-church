import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import { FinanceCategory } from '@/lib/models/FinanceCategory';

// DELETE – soft-delete a category (members can no longer see it)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const category = await FinanceCategory.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('DELETE /api/bishop/finance/categories/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH – restore or rename a category
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name.trim();
    if (body.payBill !== undefined) update.payBill = body.payBill.trim();
    if (body.agentNumber !== undefined) update.agentNumber = body.agentNumber.trim();
    if (body.isActive !== undefined) update.isActive = body.isActive;

    const category = await FinanceCategory.findByIdAndUpdate(params.id, update, { new: true });
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('PATCH /api/bishop/finance/categories/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
