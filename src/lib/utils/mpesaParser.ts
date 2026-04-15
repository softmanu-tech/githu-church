export interface MpesaData {
  referenceNumber: string;
  amount: number;
  bankName: string;
  /** Paybill number extracted directly from the message (may be empty for some formats). */
  extractedPayBill: string;
  /** Account number / agent number extracted from the message. */
  accountNumber: string;
  transactionDate: string;
  transactionTime: string;
  parsedDate: Date;
  /** 'mpesa' | 'loop' */
  source: 'mpesa' | 'loop';
}

/**
 * Parse a payment confirmation SMS and extract payment details.
 * Returns null if the message does not match any known format.
 *
 * Supported formats:
 *
 * Standard M-Pesa paybill:
 *   ABC12345DE Confirmed. Ksh500.00 paid to ORG NAME Account Number 12345 on 15/4/26 at 2:00 PM. …
 *
 * Standard M-Pesa till / send:
 *   ABC12345DE Confirmed. Ksh500.00 paid to STORE 123456 on 15/4/26 at 2:00 PM. …
 *
 * Loop bank via M-Pesa Paybill:
 *   M-PESA Paybill Successful:KES.500.00 to 522522 - KCB Paybill AC -1317734378 LOOP Ref NHE7DINRAYCI,
 *   M-Pesa Ref UD5U99J0TC, Fee: KES.11.50 on 05/04/2026 11:23:22.
 */
export function parseMpesaMessage(message: string): MpesaData | null {
  if (!message || typeof message !== 'string') return null;

  const cleaned = message.trim().replace(/\s+/g, ' ');

  // ── Try Loop format first ─────────────────────────────────────────────────
  if (/M-PESA Paybill Successful/i.test(cleaned)) {
    return parseLoopMessage(cleaned);
  }

  // ── Standard M-Pesa Confirmed format ─────────────────────────────────────
  return parseStandardMpesa(cleaned);
}

// ─────────────────────────────────────────────────────────────────────────────
// Loop bank via M-Pesa Paybill
// Example: M-PESA Paybill Successful:KES.500.00 to 522522 - KCB Paybill AC -1317734378
//          LOOP Ref NHE7DINRAYCI, M-Pesa Ref UD5U99J0TC, Fee: KES.11.50 on 05/04/2026 11:23:22.
// ─────────────────────────────────────────────────────────────────────────────
function parseLoopMessage(cleaned: string): MpesaData | null {
  // Use the M-Pesa Ref as the unique reference
  const mpesaRefMatch = cleaned.match(/M-Pesa Ref\s+([A-Z0-9]+)/i);
  if (!mpesaRefMatch) return null;
  const referenceNumber = mpesaRefMatch[1].toUpperCase();

  // Amount – first KES.xxx value
  const amountMatch = cleaned.match(/KES\.([\d,]+\.?\d*)/i);
  if (!amountMatch) return null;
  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  if (isNaN(amount) || amount <= 0) return null;

  // Paybill number – "to 522522"
  const payBillMatch = cleaned.match(/to\s+(\d+)/i);
  const extractedPayBill = payBillMatch ? payBillMatch[1].trim() : '';

  // Bank name – "KCB Paybill" → "KCB"
  const bankMatch = cleaned.match(/(\w[\w\s]*?)\s+Paybill\b/i);
  const bankName = bankMatch ? bankMatch[1].trim() : 'Loop Bank';

  // Account number – "AC -1317734378" or "AC-1317734378"
  const acctMatch = cleaned.match(/AC\s*-\s*(\d+)/i);
  const accountNumber = acctMatch ? acctMatch[1].trim() : '';

  // Date – DD/MM/YYYY (Loop format)
  const dateMatch = cleaned.match(/on\s+(\d{2}\/\d{2}\/\d{4})/i);
  const transactionDate = dateMatch ? dateMatch[1] : '';

  // Time – HH:MM:SS
  const timeMatch = cleaned.match(/(\d{2}:\d{2}:\d{2})/);
  const transactionTime = timeMatch ? timeMatch[1] : '';

  const parsedDate = parseLoopDate(transactionDate);

  return {
    referenceNumber,
    amount,
    bankName,
    extractedPayBill,
    accountNumber,
    transactionDate,
    transactionTime,
    parsedDate,
    source: 'loop',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Standard M-Pesa Confirmed message
// ─────────────────────────────────────────────────────────────────────────────
function parseStandardMpesa(cleaned: string): MpesaData | null {
  // Reference number – 10-12 uppercase alphanumeric chars that open the message
  const refMatch = cleaned.match(/^([A-Z0-9]{10,12})\s+Confirmed/i);
  if (!refMatch) return null;
  const referenceNumber = refMatch[1].toUpperCase();

  // Amount – first Ksh / KSh / KES value
  const amountMatch = cleaned.match(/(?:Ksh|KSh|KES)\s*([\d,]+\.?\d*)/i);
  if (!amountMatch) return null;
  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  if (isNaN(amount) || amount <= 0) return null;

  // Bank / Organisation name + account number
  let bankName = 'M-Pesa';
  let accountNumber = '';

  // Paybill pattern: "paid to ORG NAME Account Number XXXX"
  const paybillMatch = cleaned.match(/paid to\s+(.+?)\s+Account Number\s+([^\s.,]+)/i);
  if (paybillMatch) {
    bankName = paybillMatch[1].trim();
    accountNumber = paybillMatch[2].trim();
  } else {
    // Generic "paid to X on" or "sent to X on DATE"
    const genericMatch = cleaned.match(/(?:paid|sent) to\s+(.+?)\s+on\s+\d{1,2}\//i);
    if (genericMatch) bankName = genericMatch[1].trim();
  }

  // Try to pull a paybill number that may be embedded at the end of the bank name
  // e.g. bankName = "CHURCH NAME 247247"
  const embeddedPayBill = bankName.match(/\b(\d{4,7})\s*$/);
  const extractedPayBill = embeddedPayBill ? embeddedPayBill[1] : '';

  // Clean the paybill number out of the bankName if found
  const cleanBankName = extractedPayBill
    ? bankName.replace(/\s*\d{4,7}\s*$/, '').trim()
    : bankName;

  // Date – format D/M/YY or D/M/YYYY
  const dateMatch = cleaned.match(/on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  const transactionDate = dateMatch ? dateMatch[1] : '';

  // Time – e.g. "2:00 PM" or "10:30 AM"
  const timeMatch = cleaned.match(/at\s+(\d{1,2}:\d{2}\s*[AP]M)/i);
  const transactionTime = timeMatch ? timeMatch[1] : '';

  const parsedDate = parseMpesaDate(transactionDate);

  return {
    referenceNumber,
    amount,
    bankName: cleanBankName,
    extractedPayBill,
    accountNumber,
    transactionDate,
    transactionTime,
    parsedDate,
    source: 'mpesa',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Date parsers
// ─────────────────────────────────────────────────────────────────────────────

/** Standard M-Pesa: D/M/YY or D/M/YYYY */
function parseMpesaDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('/');
  if (parts.length !== 3) return new Date();
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  let year = parseInt(parts[2], 10);
  if (year < 100) year += 2000;
  const d = new Date(year, month, day);
  return isNaN(d.getTime()) ? new Date() : d;
}

/** Loop: DD/MM/YYYY */
function parseLoopDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('/');
  if (parts.length !== 3) return new Date();
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  return isNaN(d.getTime()) ? new Date() : d;
}
