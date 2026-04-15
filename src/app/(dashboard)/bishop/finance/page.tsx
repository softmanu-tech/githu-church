"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProfessionalHeader } from "@/components/ProfessionalHeader"
import { useAlerts } from "@/components/ui/alert-system"
import {
  DollarSign,
  Layers,
  Users,
  Plus,
  Trash2,
  Download,
  ChevronLeft,
  X,
  TrendingUp,
  FileText,
  LogOut,
  RefreshCw,
} from "lucide-react"
import { format } from "date-fns"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  _id: string
  name: string
  payBill: string
  agentNumber: string
  isActive: boolean
  createdAt: string
  totalAmount: number
  contributionsCount: number
  contributorsCount: number
}

interface Contribution {
  _id: string
  referenceNumber: string
  amount: number
  bankName: string
  accountNumber: string
  transactionDate: string
  transactionTime: string
  member: { _id: string; name: string; email: string; phone?: string }
  category: { _id: string; name: string }
  createdAt: string
}

interface ContributionsData {
  contributions: Contribution[]
  totalAmount: number
  count: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `Ksh ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`
}

function fmtDate(d: string) {
  try {
    return format(new Date(d), "dd MMM yyyy")
  } catch {
    return d
  }
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

// ─── Church constants ──────────────────────────────────────────────────────────
const CHURCH_REGION = "GITHURAI 45"
const BISHOP_NAME   = "D.A.B DR.BEATRICE OKATCH"
const BISHOP_PHONE  = "0722740948"

/** Wrap a value so Excel treats the cell as plain text (prevents scientific notation). */
function t(v: string) {
  return `<td style="mso-number-format:'@'; font-family:Calibri,Arial; font-size:11pt; padding:6px 10px; border:1px solid #bfdbfe;">${v}</td>`
}
/** Amount cell – right-aligned, number format. */
function n(v: number) {
  return `<td style="font-family:Calibri,Arial; font-size:11pt; padding:6px 10px; border:1px solid #bfdbfe; text-align:right; mso-number-format:'#\\,##0.00';">${v.toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>`
}

/** Fetch logo as base64 data-URL (client-side). Falls back to empty string. */
async function fetchLogoBase64(): Promise<string> {
  try {
    const res = await fetch("/logo.jpg")
    const blob = await res.blob()
    return await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return ""
  }
}

// ─── Excel Export (styled HTML workbook) ─────────────────────────────────────

async function downloadExcel(
  contributions: Contribution[],
  filename: string,
  categoryName: string,
) {
  const logoSrc = await fetchLogoBase64()
  const totalAmount = contributions.reduce((s, c) => s + c.amount, 0)
  const generated = format(new Date(), "dd MMM yyyy 'at' HH:mm")

  const dataRows = contributions
    .map(
      (c, i) => `
      <tr style="background:${i % 2 === 0 ? "#eff6ff" : "#ffffff"};">
        ${t(c.referenceNumber)}
        ${n(c.amount)}
        ${t(c.bankName || "M-Pesa")}
        ${t(c.accountNumber || "—")}
        ${t(fmtDate(c.transactionDate))}
        ${t(c.transactionTime || "—")}
      </tr>`
    )
    .join("")

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <!--[if gte mso 9]><xml>
    <x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
      <x:Name>Contributions</x:Name>
      <x:WorksheetOptions>
        <x:DefaultColumnWidth>22</x:DefaultColumnWidth>
        <x:FitToPage/>
        <x:Print><x:FitWidth>1</x:FitWidth><x:FitHeight>0</x:FitHeight></x:Print>
      </x:WorksheetOptions>
    </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>
  </xml><![endif]-->
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
    table { border-collapse: collapse; }
  </style>
</head>
<body>
<table cellpadding="0" cellspacing="0" style="width:100%;">

  <!-- ── Logo + Church name banner ── -->
  <tr style="background:#1e40af;">
    ${logoSrc ? `<td rowspan="2" style="padding:10px 14px; width:60px; vertical-align:middle;">
        <img src="${logoSrc}" width="48" height="48" style="border-radius:50%; border:2px solid rgba(255,255,255,0.4);"/>
      </td>` : `<td rowspan="2" style="width:60px; background:#1e40af;"></td>`}
    <td colspan="5" style="padding:12px 14px 4px; font-family:Calibri,Arial; font-size:16pt; font-weight:bold; color:#ffffff; letter-spacing:1px;">
      G-45 MAIN CHURCH
    </td>
  </tr>
  <tr style="background:#1e40af;">
    <td colspan="5" style="padding:4px 14px 12px; font-family:Calibri,Arial; font-size:10pt; color:#bfdbfe;">
      Finance Contributions Report &nbsp;·&nbsp; ${generated}
    </td>
  </tr>

  <!-- ── Blank separator ── -->
  <tr><td colspan="6" style="height:8px;"></td></tr>

  <!-- ── Info block ── -->
  <tr>
    <td colspan="2" style="padding:4px 10px; font-family:Calibri,Arial; font-size:10pt; font-weight:bold; color:#1e40af; border-bottom:1px solid #dbeafe;">REGION:</td>
    <td colspan="4" style="padding:4px 10px; font-family:Calibri,Arial; font-size:10pt; color:#1e293b; border-bottom:1px solid #dbeafe;">${CHURCH_REGION}</td>
  </tr>
  <tr>
    <td colspan="2" style="padding:4px 10px; font-family:Calibri,Arial; font-size:10pt; font-weight:bold; color:#1e40af; border-bottom:1px solid #dbeafe;">BISHOP'S NAME:</td>
    <td colspan="4" style="padding:4px 10px; font-family:Calibri,Arial; font-size:10pt; color:#1e293b; border-bottom:1px solid #dbeafe;">${BISHOP_NAME}</td>
  </tr>
  <tr>
    <td colspan="2" style="padding:4px 10px; font-family:Calibri,Arial; font-size:10pt; font-weight:bold; color:#1e40af; border-bottom:1px solid #dbeafe;">BISHOP'S NUMBER:</td>
    <td colspan="4" style="mso-number-format:'@'; padding:4px 10px; font-family:Calibri,Arial; font-size:10pt; color:#1e293b; border-bottom:1px solid #dbeafe;">${BISHOP_PHONE}</td>
  </tr>
  <tr>
    <td colspan="2" style="padding:4px 10px; font-family:Calibri,Arial; font-size:10pt; font-weight:bold; color:#1e40af; border-bottom:1px solid #dbeafe;">CATEGORY:</td>
    <td colspan="4" style="padding:4px 10px; font-family:Calibri,Arial; font-size:10pt; color:#1e293b; border-bottom:1px solid #dbeafe; font-weight:bold;">${categoryName}</td>
  </tr>

  <!-- ── Blank separator ── -->
  <tr><td colspan="6" style="height:10px;"></td></tr>

  <!-- ── Column headers ── -->
  <tr style="background:#1e40af;">
    <td style="padding:8px 10px; font-family:Calibri,Arial; font-size:10pt; font-weight:bold; color:#ffffff; border:1px solid #1e3a8a;">Reference Number</td>
    <td style="padding:8px 10px; font-family:Calibri,Arial; font-size:10pt; font-weight:bold; color:#ffffff; border:1px solid #1e3a8a; text-align:right;">Amount (Ksh)</td>
    <td style="padding:8px 10px; font-family:Calibri,Arial; font-size:10pt; font-weight:bold; color:#ffffff; border:1px solid #1e3a8a;">Bank</td>
    <td style="padding:8px 10px; font-family:Calibri,Arial; font-size:10pt; font-weight:bold; color:#ffffff; border:1px solid #1e3a8a;">Account Number</td>
    <td style="padding:8px 10px; font-family:Calibri,Arial; font-size:10pt; font-weight:bold; color:#ffffff; border:1px solid #1e3a8a;">Date</td>
    <td style="padding:8px 10px; font-family:Calibri,Arial; font-size:10pt; font-weight:bold; color:#ffffff; border:1px solid #1e3a8a;">Time</td>
  </tr>

  <!-- ── Data rows ── -->
  ${dataRows}

  <!-- ── Total row ── -->
  <tr style="background:#1e40af;">
    <td style="padding:8px 10px; font-family:Calibri,Arial; font-size:11pt; font-weight:bold; color:#ffffff; border:1px solid #1e3a8a;">TOTAL</td>
    <td style="padding:8px 10px; font-family:Calibri,Arial; font-size:11pt; font-weight:bold; color:#ffffff; border:1px solid #1e3a8a; text-align:right; mso-number-format:'#\\,##0.00';">
      ${totalAmount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
    </td>
    <td colspan="4" style="background:#1e40af; border:1px solid #1e3a8a;"></td>
  </tr>

  <!-- ── Footer ── -->
  <tr><td colspan="6" style="height:12px;"></td></tr>
  <tr>
    <td colspan="6" style="padding:4px 10px; font-family:Calibri,Arial; font-size:9pt; color:#94a3b8;">
      ${contributions.length} record${contributions.length !== 1 ? "s" : ""} &nbsp;·&nbsp; Generated by G-45 Main Church Management System
    </td>
  </tr>

</table>
</body>
</html>`

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${filename}.xls`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── PDF Export (styled print window) ────────────────────────────────────────

async function downloadPDF(
  contributions: Contribution[],
  categoryName: string,
) {
  const logoSrc = await fetchLogoBase64()
  const totalAmount = contributions.reduce((s, c) => s + c.amount, 0)
  const generated = format(new Date(), "dd MMM yyyy 'at' HH:mm")

  const rows = contributions
    .map(
      (c, i) => `
      <tr style="background:${i % 2 === 0 ? "#eff6ff" : "#ffffff"}">
        <td>${c.referenceNumber}</td>
        <td style="text-align:right">${c.amount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
        <td>${c.bankName || "M-Pesa"}</td>
        <td>${c.accountNumber || "—"}</td>
        <td>${fmtDate(c.transactionDate)}</td>
        <td>${c.transactionTime || "—"}</td>
      </tr>`
    )
    .join("")

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${categoryName}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Calibri, Arial, sans-serif; font-size: 11px; color: #1e293b; background:#fff; }

    /* ── Header banner ── */
    .banner {
      background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
      color: white;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 0;
    }
    .banner img { width: 52px; height: 52px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.4); object-fit:cover; }
    .banner-text h1 { font-size: 18px; font-weight: bold; letter-spacing: 0.5px; }
    .banner-text p  { font-size: 10px; color: #bfdbfe; margin-top: 2px; }

    /* ── Info block ── */
    .info-block {
      background: #f8fafc;
      border-left: 4px solid #1e40af;
      padding: 10px 16px;
      margin: 12px 20px;
      border-radius: 0 6px 6px 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 24px;
    }
    .info-row { display: flex; gap: 8px; font-size: 10px; }
    .info-label { font-weight: bold; color: #1e40af; min-width: 110px; }
    .info-value { color: #1e293b; }

    /* ── Table ── */
    .table-wrap { margin: 0 20px 20px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #1e40af; }
    thead th {
      color: white; font-size: 9px; font-weight: bold; text-transform: uppercase;
      letter-spacing: 0.5px; padding: 8px 8px; text-align: left; border: 1px solid #1e3a8a;
    }
    thead th:nth-child(2) { text-align: right; }
    tbody td { font-size: 10px; padding: 6px 8px; border: 1px solid #dbeafe; }
    tbody td:nth-child(2) { text-align: right; font-weight: 600; color: #166534; }
    tfoot tr { background: #1e40af; }
    tfoot td { color: white; font-weight: bold; font-size: 11px; padding: 8px 8px; border: 1px solid #1e3a8a; }
    tfoot td:nth-child(2) { text-align: right; }

    /* ── Footer text ── */
    .footer { margin: 8px 20px 0; font-size: 8px; color: #94a3b8; }

    @media print {
      body { margin: 0; }
      @page { margin: 10mm; size: A4 landscape; }
    }
  </style>
</head>
<body>

  <!-- Banner -->
  <div class="banner">
    ${logoSrc ? `<img src="${logoSrc}" alt="G-45 Logo" />` : ""}
    <div class="banner-text">
      <h1>G-45 MAIN CHURCH</h1>
      <p>Finance Contributions Report &nbsp;·&nbsp; Generated ${generated}</p>
    </div>
  </div>

  <!-- Info block -->
  <div class="info-block">
    <div class="info-row"><span class="info-label">REGION:</span><span class="info-value">${CHURCH_REGION}</span></div>
    <div class="info-row"><span class="info-label">CATEGORY:</span><span class="info-value" style="font-weight:bold;color:#1e40af">${categoryName}</span></div>
    <div class="info-row"><span class="info-label">BISHOP'S NAME:</span><span class="info-value">${BISHOP_NAME}</span></div>
    <div class="info-row"><span class="info-label">BISHOP'S NUMBER:</span><span class="info-value">${BISHOP_PHONE}</span></div>
  </div>

  <!-- Table -->
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Reference Number</th>
          <th style="text-align:right">Amount (Ksh)</th>
          <th>Bank</th>
          <th>Account Number</th>
          <th>Date</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td>TOTAL</td>
          <td style="text-align:right">${totalAmount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
          <td colspan="4"></td>
        </tr>
      </tfoot>
    </table>
  </div>

  <p class="footer">${contributions.length} record${contributions.length !== 1 ? "s" : ""} &nbsp;·&nbsp; G-45 Main Church Management System</p>

</body>
</html>`

  const win = window.open("", "_blank")
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 500)
}

// ─── Create Category Modal ────────────────────────────────────────────────────

function CreateCategoryModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const alerts = useAlerts()
  const [name, setName] = useState("")
  const [payBill, setPayBill] = useState("")
  const [agentNumber, setAgentNumber] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !payBill.trim() || !agentNumber.trim()) {
      alerts.error("Validation", "All fields are required.")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/bishop/finance/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, payBill, agentNumber }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create")
      alerts.success("Category Created", `"${name}" has been created.`)
      onCreated()
      onClose()
    } catch (err) {
      alerts.error("Error", err instanceof Error ? err.message : "Failed to create category")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-5 rounded-t-xl flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">New Finance Category</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Category Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tithe, Building Fund, Offering"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Pay Bill Number</label>
            <Input
              value={payBill}
              onChange={(e) => setPayBill(e.target.value)}
              placeholder="e.g. 247247"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Agent Number</label>
            <Input
              value={agentNumber}
              onChange={(e) => setAgentNumber(e.target.value)}
              placeholder="e.g. 60000"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? "Creating…" : "Create Category"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Category Detail Panel ────────────────────────────────────────────────────

function CategoryDetail({
  category,
  onBack,
}: {
  category: Category
  onBack: () => void
}) {
  const [data, setData] = useState<ContributionsData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/bishop/finance/contributions?categoryId=${category._id}`,
        { credentials: "include" }
      )
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [category._id])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6">
      {/* Back + Export bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-700 hover:text-blue-900 font-medium"
        >
          <ChevronLeft className="h-4 w-4" />
          All Categories
        </button>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-blue-300 text-blue-700"
            disabled={!data?.contributions.length}
            onClick={() =>
              data &&
              downloadExcel(
                data.contributions,
                `${category.name}-contributions`,
                category.name,
              )
            }
          >
            <Download className="h-4 w-4 mr-1" />
            Excel
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-blue-300 text-blue-700"
            disabled={!data?.contributions.length}
            onClick={() =>
              data &&
              downloadPDF(
                data.contributions,
                category.name,
              )
            }
          >
            <FileText className="h-4 w-4 mr-1" />
            PDF
          </Button>
        </div>
      </div>

      {/* Category summary card */}
      <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
        <CardHeader className="p-4 sm:p-5">
          <CardTitle className="text-blue-800 text-xl">{category.name}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-0 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Pay Bill", value: category.payBill },
            { label: "Agent Number", value: category.agentNumber },
            { label: "Total Collected", value: fmt(data?.totalAmount ?? 0) },
            { label: "Contributions", value: String(data?.count ?? 0) },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-blue-600">{item.label}</p>
              <p className="text-sm sm:text-base font-semibold text-blue-900">{item.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contributions table */}
      <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
        <CardHeader className="p-4 sm:p-5 flex-row items-center justify-between">
          <CardTitle className="text-blue-800 text-base">
            Contribution Records
          </CardTitle>
          <button onClick={load} className="text-blue-600 hover:text-blue-800">
            <RefreshCw className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-blue-600 animate-pulse">Loading…</div>
          ) : !data?.contributions.length ? (
            <div className="p-6 text-center text-blue-600">No contributions yet for this category.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-300/60">
                    <th className="text-left px-4 py-3 text-blue-800 font-semibold">Reference</th>
                    <th className="text-left px-4 py-3 text-blue-800 font-semibold">Member</th>
                    <th className="text-right px-4 py-3 text-blue-800 font-semibold">Amount</th>
                    <th className="text-left px-4 py-3 text-blue-800 font-semibold">Bank / Paybill</th>
                    <th className="text-left px-4 py-3 text-blue-800 font-semibold">Acct No.</th>
                    <th className="text-left px-4 py-3 text-blue-800 font-semibold">Date</th>
                    <th className="text-left px-4 py-3 text-blue-800 font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.contributions.map((c, i) => (
                    <tr
                      key={c._id}
                      className={i % 2 === 0 ? "bg-white/30" : "bg-blue-100/30"}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-blue-900">{c.referenceNumber}</td>
                      <td className="px-4 py-3 text-blue-900">
                        <p className="font-medium">{c.member?.name}</p>
                        <p className="text-xs text-blue-600">{c.member?.phone ?? c.member?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700">{fmt(c.amount)}</td>
                      <td className="px-4 py-3 text-blue-800">{c.bankName}</td>
                      <td className="px-4 py-3 text-blue-800">{c.accountNumber || "—"}</td>
                      <td className="px-4 py-3 text-blue-800">{fmtDate(c.transactionDate)}</td>
                      <td className="px-4 py-3 text-blue-800">{c.transactionTime || "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-300/60">
                    <td colSpan={2} className="px-4 py-3 font-bold text-blue-900">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">{fmt(data.totalAmount)}</td>
                    <td colSpan={4} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BishopFinancePage() {
  const alerts = useAlerts()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState<Category | null>(null)

  // All-contributions state for the overview tab
  const [allContribs, setAllContribs] = useState<ContributionsData | null>(null)
  const [allLoading, setAllLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"categories" | "all">("categories")

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/bishop/finance/categories", { credentials: "include" })
      const json = await res.json()
      if (json.success) setCategories(json.data)
    } catch {
      alerts.error("Error", "Failed to load categories")
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadAllContribs = useCallback(async () => {
    setAllLoading(true)
    try {
      const res = await fetch("/api/bishop/finance/contributions", { credentials: "include" })
      const json = await res.json()
      if (json.success) setAllContribs(json.data)
    } catch {
      // silent
    } finally {
      setAllLoading(false)
    }
  }, [])

  useEffect(() => { loadCategories() }, [loadCategories])
  useEffect(() => {
    if (activeTab === "all") loadAllContribs()
  }, [activeTab, loadAllContribs])

  async function deleteCategory(cat: Category) {
    alerts.warning(
      "Delete Category",
      `Delete "${cat.name}"? Members will no longer see it.`,
      [
        {
          label: "Delete",
          variant: "primary",
          action: async () => {
            const res = await fetch(`/api/bishop/finance/categories/${cat._id}`, {
              method: "DELETE",
              credentials: "include",
            })
            if (res.ok) {
              alerts.success("Deleted", `"${cat.name}" has been removed.`)
              loadCategories()
            } else {
              alerts.error("Error", "Could not delete category.")
            }
          },
        },
      ]
    )
  }

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST", credentials: "include" })
    window.location.href = "/"
  }

  const grandTotal = categories.reduce((s, c) => s + c.totalAmount, 0)

  return (
    <div className="min-h-screen bg-blue-300 overflow-x-hidden">
      <ProfessionalHeader
        title="Finance Management"
        subtitle="Track categories and member contributions"
        actions={[
          {
            label: "Dashboard",
            href: "/bishop",
            variant: "outline",
            className: "border-white/30 text-white bg-white/10 hover:bg-white/20",
          },
          {
            label: "Logout",
            onClick: handleLogout,
            variant: "outline",
            className: "border-red-300 text-red-100 bg-red-600/20 hover:bg-red-600/30",
            icon: <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />,
          },
        ]}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10">

        {/* If a category is selected, show its detail */}
        {selected ? (
          <CategoryDetail category={selected} onBack={() => setSelected(null)} />
        ) : (
          <div className="space-y-6">

            {/* Summary stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: <Layers className="h-5 w-5 text-blue-600" />,
                  label: "Categories",
                  value: categories.length,
                  active: `${categories.filter((c) => c.isActive).length} active`,
                },
                {
                  icon: <DollarSign className="h-5 w-5 text-green-600" />,
                  label: "Total Funds",
                  value: fmt(grandTotal),
                  active: "all categories",
                },
                {
                  icon: <TrendingUp className="h-5 w-5 text-purple-600" />,
                  label: "Total Contributions",
                  value: categories.reduce((s, c) => s + c.contributionsCount, 0),
                  active: `${categories.reduce((s, c) => s + c.contributorsCount, 0)} unique contributors`,
                },
              ].map((stat) => (
                <Card
                  key={stat.label}
                  className="bg-blue-200/90 backdrop-blur-md border border-blue-300"
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-white/50">{stat.icon}</div>
                    <div>
                      <p className="text-xs text-blue-600">{stat.label}</p>
                      <p className="text-lg font-bold text-blue-900">{stat.value}</p>
                      <p className="text-xs text-blue-500">{stat.active}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tab bar */}
            <div className="flex gap-2 border-b border-blue-400/40 pb-2">
              {(["categories", "all"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-blue-600 text-white"
                      : "text-blue-700 hover:bg-blue-200/60"
                  }`}
                >
                  {tab === "categories" ? "Categories" : "All Contributions"}
                </button>
              ))}
            </div>

            {/* ── Categories Tab ──────────────────────────────────────── */}
            {activeTab === "categories" && (
              <div className="space-y-4">
                {/* Add Category button */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => setShowCreate(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-40 rounded-xl bg-blue-200/60 animate-pulse" />
                    ))}
                  </div>
                ) : categories.length === 0 ? (
                  <Card className="bg-blue-200/90 border border-blue-300">
                    <CardContent className="p-10 text-center text-blue-700">
                      <Layers className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p className="font-medium">No categories yet.</p>
                      <p className="text-sm mt-1">Create your first finance category to start tracking contributions.</p>
                      <Button
                        onClick={() => setShowCreate(true)}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Category
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat) => (
                      <Card
                        key={cat._id}
                        className={`border transition-shadow hover:shadow-lg ${
                          cat.isActive
                            ? "bg-blue-200/90 border-blue-300"
                            : "bg-gray-100/80 border-gray-300 opacity-60"
                        }`}
                      >
                        <CardHeader className="p-4 pb-2 flex-row items-start justify-between">
                          <div>
                            <CardTitle className="text-blue-900 text-base leading-tight">
                              {cat.name}
                            </CardTitle>
                            {!cat.isActive && (
                              <span className="text-xs text-red-500 font-medium">Deleted</span>
                            )}
                          </div>
                          {cat.isActive && (
                            <button
                              onClick={() => deleteCategory(cat)}
                              className="text-red-400 hover:text-red-600 p-1 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </CardHeader>
                        <CardContent className="p-4 pt-2 space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-blue-500">Pay Bill</p>
                              <p className="font-semibold text-blue-800">{cat.payBill}</p>
                            </div>
                            <div>
                              <p className="text-blue-500">Agent No.</p>
                              <p className="font-semibold text-blue-800">{cat.agentNumber}</p>
                            </div>
                          </div>

                          <div className="bg-white/40 rounded-lg p-3 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-blue-600">Total Collected</span>
                              <span className="text-sm font-bold text-green-700">{fmt(cat.totalAmount)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-blue-600">Transactions</span>
                              <span className="text-sm font-semibold text-blue-800">{cat.contributionsCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-blue-600">Contributors</span>
                              <span className="text-sm font-semibold text-blue-800">{cat.contributorsCount}</span>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => setSelected(cat)}
                          >
                            View Records
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── All Contributions Tab ───────────────────────────────── */}
            {activeTab === "all" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-blue-800 font-medium">
                    {allContribs ? `${allContribs.count} records · Total: ${fmt(allContribs.totalAmount)}` : ""}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-300 text-blue-700"
                      disabled={!allContribs?.contributions.length}
                      onClick={() =>
                        allContribs &&
                        downloadExcel(
                          allContribs.contributions,
                          "all-contributions",
                          "All Categories",
                        )
                      }
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Excel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-300 text-blue-700"
                      disabled={!allContribs?.contributions.length}
                      onClick={() =>
                        allContribs &&
                        downloadPDF(
                          allContribs.contributions,
                          "All Finance Contributions",
                        )
                      }
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>

                <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
                  <CardContent className="p-0">
                    {allLoading ? (
                      <div className="p-6 text-center text-blue-600 animate-pulse">Loading…</div>
                    ) : !allContribs?.contributions.length ? (
                      <div className="p-6 text-center text-blue-600">No contributions recorded yet.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-blue-300/60">
                              <th className="text-left px-4 py-3 text-blue-800 font-semibold">Reference</th>
                              <th className="text-left px-4 py-3 text-blue-800 font-semibold">Member</th>
                              <th className="text-left px-4 py-3 text-blue-800 font-semibold">Category</th>
                              <th className="text-right px-4 py-3 text-blue-800 font-semibold">Amount</th>
                              <th className="text-left px-4 py-3 text-blue-800 font-semibold">Bank / Paybill</th>
                              <th className="text-left px-4 py-3 text-blue-800 font-semibold">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allContribs.contributions.map((c, i) => (
                              <tr key={c._id} className={i % 2 === 0 ? "bg-white/30" : "bg-blue-100/30"}>
                                <td className="px-4 py-3 font-mono text-xs text-blue-900">{c.referenceNumber}</td>
                                <td className="px-4 py-3 text-blue-900">
                                  <p className="font-medium">{c.member?.name}</p>
                                  <p className="text-xs text-blue-600">{c.member?.phone ?? c.member?.email}</p>
                                </td>
                                <td className="px-4 py-3 text-blue-800">{c.category?.name}</td>
                                <td className="px-4 py-3 text-right font-semibold text-green-700">{fmt(c.amount)}</td>
                                <td className="px-4 py-3 text-blue-800">{c.bankName}</td>
                                <td className="px-4 py-3 text-blue-800">{fmtDate(c.transactionDate)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-blue-300/60">
                              <td colSpan={3} className="px-4 py-3 font-bold text-blue-900">Grand Total</td>
                              <td className="px-4 py-3 text-right font-bold text-green-700">{fmt(allContribs.totalAmount)}</td>
                              <td colSpan={2} />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateCategoryModal
          onClose={() => setShowCreate(false)}
          onCreated={loadCategories}
        />
      )}
    </div>
  )
}
