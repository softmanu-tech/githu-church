import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import { FinanceContribution } from '@/lib/models/FinanceContribution';
import { FinanceCategory } from '@/lib/models/FinanceCategory';
import { parseMpesaMessage } from '@/lib/utils/mpesaParser';

/** Strip non-digit chars for a clean number comparison, e.g. " 522 522 " → "522522" */
function normalise(s: string) {
  return s.replace(/\D/g, '').trim();
}

// POST – parse a payment message, validate paybill/account match, save contribution
export async function POST(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['member']);
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const body = await request.json();
    const { message, categoryId } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Payment message is required' }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    // Verify category exists and is active
    const category = await FinanceCategory.findOne({ _id: categoryId, isActive: true });
    if (!category) {
      return NextResponse.json({ error: 'Category not found or no longer active' }, { status: 404 });
    }

    // Parse the payment message (M-Pesa or Loop)
    const parsed = parseMpesaMessage(message);
    if (!parsed) {
      return NextResponse.json(
        {
          error:
            'Could not extract payment details. Please paste a valid M-Pesa or Loop payment confirmation message.',
        },
        { status: 422 }
      );
    }

    // ── Validate paybill number ───────────────────────────────────────────────
    if (parsed.extractedPayBill) {
      const msgPayBill = normalise(parsed.extractedPayBill);
      const catPayBill = normalise(category.payBill);
      if (msgPayBill !== catPayBill) {
        return NextResponse.json(
          {
            error: `Wrong paybill: the message shows paybill ${parsed.extractedPayBill}, but this category requires paybill ${category.payBill}. Please pay to the correct paybill and try again.`,
          },
          { status: 422 }
        );
      }
    }

    // ── Validate account / agent number ──────────────────────────────────────
    if (parsed.accountNumber) {
      const msgAcct = normalise(parsed.accountNumber);
      const catAcct = normalise(category.agentNumber);
      if (msgAcct !== catAcct) {
        return NextResponse.json(
          {
            error: `Wrong account number: the message shows account ${parsed.accountNumber}, but this category requires account number ${category.agentNumber}. Please use the correct account number and try again.`,
          },
          { status: 422 }
        );
      }
    } else {
      // No account number could be extracted – cannot validate, reject for safety
      return NextResponse.json(
        {
          error:
            'Could not read an account number from this message. Please paste a paybill confirmation that includes "Account Number" (M-Pesa) or "AC -" (Loop).',
        },
        { status: 422 }
      );
    }

    // ── Duplicate check ───────────────────────────────────────────────────────
    const existing = await FinanceContribution.findOne({ referenceNumber: parsed.referenceNumber });
    if (existing) {
      return NextResponse.json(
        {
          error: `Duplicate transaction: Reference ${parsed.referenceNumber} has already been recorded.`,
        },
        { status: 409 }
      );
    }

    // ── Save contribution ─────────────────────────────────────────────────────
    const contribution = await FinanceContribution.create({
      category: categoryId,
      member: user.id,
      referenceNumber: parsed.referenceNumber,
      amount: parsed.amount,
      bankName: parsed.bankName,
      accountNumber: parsed.accountNumber,
      transactionDate: parsed.parsedDate,
      transactionTime: parsed.transactionTime,
      rawMessage: message.trim(),
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          _id: contribution._id,
          referenceNumber: contribution.referenceNumber,
          amount: contribution.amount,
          bankName: contribution.bankName,
          accountNumber: contribution.accountNumber,
          transactionDate: contribution.transactionDate,
          transactionTime: contribution.transactionTime,
          source: parsed.source,
          category: { _id: category._id, name: category.name },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/member/finance/extract error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
