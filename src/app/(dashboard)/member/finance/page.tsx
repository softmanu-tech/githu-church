"use client"

import React, { useState, useEffect, useCallback } from "react"
import { ProfessionalHeader } from "@/components/ProfessionalHeader"
import { MemberNavStrip } from "@/components/MemberNav"
import { useAlerts } from "@/components/ui/alert-system"
import {
  DollarSign,
  Layers,
  TrendingUp,
  X,
  Smartphone,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  LogOut,
  ChevronDown,
  ChevronUp,
  Plus,
  ArrowRight,
  Calendar,
  Hash,
  Building2,
  CreditCard,
} from "lucide-react"
import { format } from "date-fns"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  _id: string
  name: string
  payBill: string
  agentNumber: string
}

interface CategorySummary {
  category: {
    _id: string
    name: string
    payBill: string
    agentNumber: string
    isActive: boolean
  }
  totalAmount: number
  count: number
}

interface Contribution {
  _id: string
  referenceNumber: string
  amount: number
  bankName: string
  accountNumber: string
  transactionDate: string
  transactionTime: string
  category: { _id: string; name: string }
  createdAt: string
}

interface ContributionsData {
  contributions: Contribution[]
  categorySummaries: CategorySummary[]
  grandTotal: number
  totalCount: number
}

interface ParsedPreview {
  referenceNumber: string
  amount: number
  bankName: string
  extractedPayBill: string
  accountNumber: string
  transactionDate: string
  transactionTime: string
  source: "mpesa" | "loop"
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `Ksh ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`
}

function fmtDate(d: string) {
  try { return format(new Date(d), "dd MMM yyyy") } catch { return d }
}

function fmtShort(d: string) {
  try { return format(new Date(d), "dd MMM") } catch { return d }
}

// ─── Client-side Preview Parser ───────────────────────────────────────────────

function previewParse(message: string): ParsedPreview | null {
  if (!message.trim()) return null
  const cleaned = message.trim().replace(/\s+/g, " ")

  if (/M-PESA Paybill Successful/i.test(cleaned)) {
    const mpesaRefMatch = cleaned.match(/M-Pesa Ref\s+([A-Z0-9]+)/i)
    if (!mpesaRefMatch) return null
    const referenceNumber = mpesaRefMatch[1].toUpperCase()
    const amountMatch = cleaned.match(/KES\.([\d,]+\.?\d*)/i)
    if (!amountMatch) return null
    const amount = parseFloat(amountMatch[1].replace(/,/g, ""))
    if (isNaN(amount) || amount <= 0) return null
    const payBillMatch = cleaned.match(/to\s+(\d+)/i)
    const extractedPayBill = payBillMatch ? payBillMatch[1].trim() : ""
    const bankMatch = cleaned.match(/(\w[\w\s]*?)\s+Paybill\b/i)
    const bankName = bankMatch ? bankMatch[1].trim() : "Loop Bank"
    const acctMatch = cleaned.match(/AC\s*-\s*(\d+)/i)
    const accountNumber = acctMatch ? acctMatch[1].trim() : ""
    const dateMatch = cleaned.match(/on\s+(\d{2}\/\d{2}\/\d{4})/i)
    const transactionDate = dateMatch ? dateMatch[1] : ""
    const timeMatch = cleaned.match(/(\d{2}:\d{2}:\d{2})/)
    const transactionTime = timeMatch ? timeMatch[1] : ""
    return { referenceNumber, amount, bankName, extractedPayBill, accountNumber, transactionDate, transactionTime, source: "loop" }
  }

  const refMatch = cleaned.match(/^([A-Z0-9]{10,12})\s+Confirmed/i)
  if (!refMatch) return null
  const referenceNumber = refMatch[1].toUpperCase()
  const amountMatch = cleaned.match(/(?:Ksh|KSh|KES)\s*([\d,]+\.?\d*)/i)
  if (!amountMatch) return null
  const amount = parseFloat(amountMatch[1].replace(/,/g, ""))
  if (isNaN(amount) || amount <= 0) return null
  let bankName = "M-Pesa"
  let accountNumber = ""
  const paybillMatch = cleaned.match(/paid to\s+(.+?)\s+Account Number\s+([^\s.,]+)/i)
  if (paybillMatch) { bankName = paybillMatch[1].trim(); accountNumber = paybillMatch[2].trim() }
  else {
    const genericMatch = cleaned.match(/(?:paid|sent) to\s+(.+?)\s+on\s+\d{1,2}\//i)
    if (genericMatch) bankName = genericMatch[1].trim()
  }
  const embeddedPayBill = bankName.match(/\b(\d{4,7})\s*$/)
  const extractedPayBill = embeddedPayBill ? embeddedPayBill[1] : ""
  if (extractedPayBill) bankName = bankName.replace(/\s*\d{4,7}\s*$/, "").trim()
  const dateMatch = cleaned.match(/on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i)
  const transactionDate = dateMatch ? dateMatch[1] : ""
  const timeMatch = cleaned.match(/at\s+(\d{1,2}:\d{2}\s*[AP]M)/i)
  const transactionTime = timeMatch ? timeMatch[1] : ""
  return { referenceNumber, amount, bankName, extractedPayBill, accountNumber, transactionDate, transactionTime, source: "mpesa" }
}

function normalise(s: string) { return s.replace(/\D/g, "").trim() }

function checkMismatch(preview: ParsedPreview, category: Category): string[] {
  const issues: string[] = []
  if (preview.extractedPayBill && normalise(preview.extractedPayBill) !== normalise(category.payBill))
    issues.push(`Paybill mismatch — message shows ${preview.extractedPayBill}, category requires ${category.payBill}`)
  if (preview.accountNumber && normalise(preview.accountNumber) !== normalise(category.agentNumber))
    issues.push(`Account number mismatch — message shows ${preview.accountNumber}, category requires ${category.agentNumber}`)
  if (!preview.accountNumber)
    issues.push("No account number found — cannot verify payment destination")
  return issues
}

// ─── Record Contribution Modal ────────────────────────────────────────────────

function RecordModal({ category, onClose, onRecorded }: {
  category: Category
  onClose: () => void
  onRecorded: () => void
}) {
  const alerts = useAlerts()
  const [message, setMessage] = useState("")
  const [preview, setPreview] = useState<ParsedPreview | null>(null)
  const [mismatches, setMismatches] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleMessageChange(v: string) {
    setMessage(v)
    const p = previewParse(v)
    setPreview(p)
    setMismatches(p ? checkMismatch(p, category) : [])
  }

  const canSubmit = Boolean(preview) && mismatches.length === 0 && !submitting

  async function handleSubmit() {
    if (!message.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/member/finance/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message, categoryId: category._id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to record contribution")
      setSubmitted(true)
    } catch (err) {
      alerts.error("Error", err instanceof Error ? err.message : "Failed to record contribution")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
      {/* Sheet: bottom-sheet on mobile, centred card on sm+ */}
      <div className="bg-white w-full sm:max-w-lg sm:mx-4 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[93vh] sm:max-h-[90vh] flex flex-col overflow-hidden">

        {/* Handle bar (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-wider">Record Contribution</p>
            <h2 className="text-white font-bold text-lg leading-tight">{category.name}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {submitted ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-9 w-9 text-green-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">Contribution Recorded!</p>
                <p className="text-gray-500 text-sm mt-1">Your payment has been successfully saved.</p>
              </div>
              <button
                onClick={() => { onRecorded(); onClose() }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Payment details reminder */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-3">
                  Pay to these details
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-3 border border-blue-100">
                    <p className="text-xs text-blue-400 mb-1">Pay Bill</p>
                    <p className="font-bold text-blue-900 text-lg leading-none">{category.payBill}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-blue-100">
                    <p className="text-xs text-blue-400 mb-1">Account No.</p>
                    <p className="font-bold text-blue-900 text-lg leading-none">{category.agentNumber}</p>
                  </div>
                </div>
              </div>

              {/* Paste area */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Smartphone className="h-4 w-4 text-blue-500" />
                  Paste M-Pesa or Loop confirmation SMS
                </label>
                <textarea
                  className="w-full border border-gray-200 rounded-2xl p-4 text-sm leading-relaxed h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 placeholder:text-gray-400"
                  placeholder={"Paste your confirmation message here…\n\nE.g. ABC12345DE Confirmed. Ksh500.00 paid to CHURCH Account Number 60000 on 15/4/26 at 2:00 PM."}
                  value={message}
                  onChange={(e) => handleMessageChange(e.target.value)}
                />
              </div>

              {/* Live extraction preview */}
              {message.trim() && (
                !preview ? (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">Unrecognised message</p>
                      <p className="text-xs text-red-500 mt-0.5">
                        Please paste a valid M-Pesa or Loop payment confirmation SMS.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Source badge + fields */}
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Extracted details
                        </p>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          preview.source === "loop"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {preview.source === "loop" ? "Loop Bank" : "M-Pesa"}
                        </span>
                      </div>

                      {/* Key figures */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white rounded-xl p-3 border border-gray-100">
                          <p className="text-xs text-gray-400">Amount</p>
                          <p className="font-bold text-green-700 text-base leading-tight">{fmt(preview.amount)}</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-gray-100">
                          <p className="text-xs text-gray-400">Reference</p>
                          <p className="font-bold text-gray-800 text-xs font-mono leading-tight break-all">{preview.referenceNumber}</p>
                        </div>
                      </div>

                      {/* Other details */}
                      <div className="space-y-2">
                        {[
                          { icon: <Building2 className="h-3.5 w-3.5" />, label: "Bank / Paybill", value: preview.bankName },
                          preview.extractedPayBill ? { icon: <Hash className="h-3.5 w-3.5" />, label: "Paybill No.", value: preview.extractedPayBill } : null,
                          preview.accountNumber ? { icon: <CreditCard className="h-3.5 w-3.5" />, label: "Account No.", value: preview.accountNumber } : null,
                          preview.transactionDate ? { icon: <Calendar className="h-3.5 w-3.5" />, label: "Date & Time", value: `${preview.transactionDate}${preview.transactionTime ? `  ${preview.transactionTime}` : ""}` } : null,
                        ]
                          .filter((x): x is { icon: React.JSX.Element; label: string; value: string } => x !== null)
                          .map(({ icon, label, value }) => (
                            <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                                {icon}{label}
                              </span>
                              <span className="text-xs font-medium text-gray-700 text-right max-w-[55%] break-all">{value}</span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Validation */}
                    {mismatches.length > 0 ? (
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                          <p className="text-sm font-semibold text-red-700">Payment destination mismatch</p>
                        </div>
                        {mismatches.map((m) => (
                          <p key={m} className="text-xs text-red-600 pl-6">• {m}</p>
                        ))}
                        <p className="text-xs text-red-400 pl-6 pt-1">
                          Ensure you paid to the correct Paybill and Account Number, then paste the correct message.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <p className="text-sm font-semibold text-green-700">Details verified — ready to submit</p>
                      </div>
                    )}
                  </div>
                )
              )}
            </>
          )}
        </div>

        {/* Sticky footer buttons */}
        {!submitted && (
          <div className="flex gap-3 px-5 py-4 border-t border-gray-100 bg-white flex-shrink-0">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><RefreshCw className="h-4 w-4 animate-spin" /> Saving…</>
              ) : (
                <><ArrowRight className="h-4 w-4" /> Submit</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Contribution Row — card on mobile, used inside expanded panel ────────────

function ContribCard({ c }: { c: Contribution }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-gray-100 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-mono text-gray-500 truncate">{c.referenceNumber}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {fmtDate(c.transactionDate)}{c.transactionTime ? ` · ${c.transactionTime}` : ""}
        </p>
      </div>
      <p className="text-sm font-bold text-green-600 ml-3 flex-shrink-0">{fmt(c.amount)}</p>
    </div>
  )
}

// ─── History Item — full contribution with category tag ──────────────────────

function HistoryItem({ c }: { c: Contribution }) {
  return (
    <div className="flex items-start justify-between py-3.5 px-4 border-b border-gray-100 last:border-0 gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
            {(c.category as { name: string })?.name}
          </span>
        </div>
        <p className="text-xs font-mono text-gray-400 mt-1 truncate">{c.referenceNumber}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {fmtDate(c.transactionDate)}{c.transactionTime ? ` · ${c.transactionTime}` : ""}
        </p>
        <p className="text-xs text-gray-400">{c.bankName}</p>
      </div>
      <p className="text-base font-bold text-green-600 flex-shrink-0">{fmt(c.amount)}</p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MemberFinancePage() {
  const alerts = useAlerts()
  const [categories, setCategories] = useState<Category[]>([])
  const [contribData, setContribData] = useState<ContributionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"categories" | "history">("categories")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [catRes, contribRes] = await Promise.all([
        fetch("/api/member/finance/categories", { credentials: "include" }),
        fetch("/api/member/finance/contributions", { credentials: "include" }),
      ])
      const [catJson, contribJson] = await Promise.all([catRes.json(), contribRes.json()])
      if (catJson.success) setCategories(catJson.data)
      if (contribJson.success) setContribData(contribJson.data)
    } catch {
      alerts.error("Error", "Failed to load finance data")
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST", credentials: "include" })
    window.location.href = "/"
  }

  const summaryForCategory = (id: string) =>
    contribData?.categorySummaries.find((s) => s.category._id === id)

  const contributionsForCategory = (id: string) =>
    contribData?.contributions.filter((c) => (c.category as { _id: string })._id === id) ?? []

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-200 overflow-x-hidden">
      <ProfessionalHeader
        title="My Finance"
        subtitle="Contributions & giving records"
        actions={[
          {
            label: "Dashboard",
            href: "/member",
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

      <div className="max-w-2xl mx-auto px-3 sm:px-4 pb-6 sm:pb-8 space-y-4 sm:space-y-5">
        <MemberNavStrip />

        {/* ── Skeleton ── */}
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded-2xl bg-white/40 animate-pulse" />
              ))}
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-2xl bg-white/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* ── Summary strip ── */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                {
                  icon: <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />,
                  label: "Categories",
                  value: categories.length,
                  bg: "bg-blue-50",
                },
                {
                  icon: <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />,
                  label: "Total Given",
                  value: `Ksh ${(contribData?.grandTotal ?? 0).toLocaleString("en-KE")}`,
                  bg: "bg-green-50",
                },
                {
                  icon: <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />,
                  label: "Payments",
                  value: contribData?.totalCount ?? 0,
                  bg: "bg-purple-50",
                },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-2xl p-3 sm:p-4 text-center shadow-sm border border-white/60`}>
                  <div className="flex justify-center mb-1.5">{s.icon}</div>
                  <p className="text-sm sm:text-base font-bold text-gray-800 leading-none truncate">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-1 leading-none">{s.label}</p>
                </div>
              ))}
            </div>

            {/* ── Tab bar ── */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-1 flex gap-1 shadow-sm border border-white/60">
              {(["categories", "history"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === tab
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                  }`}
                >
                  {tab === "categories" ? "Categories" : "My History"}
                </button>
              ))}
            </div>

            {/* ── Categories tab ── */}
            {activeTab === "categories" && (
              <div className="space-y-3">
                {categories.length === 0 ? (
                  <div className="bg-white/80 rounded-2xl p-10 text-center shadow-sm border border-white/60">
                    <Layers className="h-10 w-10 text-blue-300 mx-auto mb-3" />
                    <p className="font-semibold text-gray-600">No categories yet</p>
                    <p className="text-sm text-gray-400 mt-1">Check back later or contact your bishop.</p>
                  </div>
                ) : (
                  categories.map((cat) => {
                    const summary = summaryForCategory(cat._id)
                    const records = contributionsForCategory(cat._id)
                    const isExpanded = expandedCategory === cat._id
                    const hasContributed = (summary?.count ?? 0) > 0

                    return (
                      <div key={cat._id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 overflow-hidden">

                        {/* Card top */}
                        <div className="p-4 sm:p-5">
                          {/* Name row */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="min-w-0">
                              <h3 className="font-bold text-gray-800 text-base sm:text-lg leading-tight truncate">
                                {cat.name}
                              </h3>
                              <p className="text-xs text-gray-400 mt-0.5">Fund category</p>
                            </div>
                            <button
                              onClick={() => setSelectedCategory(cat)}
                              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl transition-colors flex-shrink-0"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span className="hidden xs:inline sm:inline">Record</span>
                            </button>
                          </div>

                          {/* Paybill / account chips */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-lg">
                              <Hash className="h-3 w-3" />
                              PayBill: <strong>{cat.payBill}</strong>
                            </span>
                            <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-lg">
                              <CreditCard className="h-3 w-3" />
                              Acct: <strong>{cat.agentNumber}</strong>
                            </span>
                          </div>

                          {/* Stats row */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-green-50 rounded-xl p-3">
                              <p className="text-xs text-green-500 font-medium">My Total</p>
                              <p className="text-base font-bold text-green-700 mt-0.5 leading-none">
                                {fmt(summary?.totalAmount ?? 0)}
                              </p>
                            </div>
                            <div className="bg-blue-50 rounded-xl p-3">
                              <p className="text-xs text-blue-500 font-medium">Payments Made</p>
                              <p className="text-base font-bold text-blue-700 mt-0.5 leading-none">
                                {summary?.count ?? 0}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Expandable records */}
                        {hasContributed && (
                          <>
                            <button
                              onClick={() => setExpandedCategory(isExpanded ? null : cat._id)}
                              className="w-full flex items-center justify-between px-4 sm:px-5 py-3 border-t border-gray-100 text-sm font-medium text-blue-600 hover:bg-blue-50/50 transition-colors"
                            >
                              <span>
                                {isExpanded ? "Hide" : "View"} {records.length} payment{records.length !== 1 ? "s" : ""}
                              </span>
                              {isExpanded
                                ? <ChevronUp className="h-4 w-4" />
                                : <ChevronDown className="h-4 w-4" />}
                            </button>

                            {isExpanded && (
                              <div className="border-t border-gray-100">
                                {records.map((c) => <ContribCard key={c._id} c={c} />)}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* ── History tab ── */}
            {activeTab === "history" && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 overflow-hidden">
                {/* Header row */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100">
                  <div>
                    <h3 className="font-bold text-gray-800 text-base">All Contributions</h3>
                    {contribData && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {contribData.totalCount} payment{contribData.totalCount !== 1 ? "s" : ""} · {fmt(contribData.grandTotal)}
                      </p>
                    )}
                  </div>
                  <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                {!contribData?.contributions.length ? (
                  <div className="py-12 text-center">
                    <TrendingUp className="h-10 w-10 text-blue-200 mx-auto mb-3" />
                    <p className="font-semibold text-gray-500">No contributions yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Go to Categories tab to record your first payment.
                    </p>
                    <button
                      onClick={() => setActiveTab("categories")}
                      className="mt-4 inline-flex items-center gap-1.5 text-blue-600 text-sm font-semibold hover:underline"
                    >
                      Go to Categories <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    {contribData.contributions.map((c) => <HistoryItem key={c._id} c={c} />)}
                    {/* Total footer */}
                    <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-gray-50 border-t border-gray-100">
                      <p className="text-sm font-semibold text-gray-600">Grand Total</p>
                      <p className="text-base font-bold text-green-600">{fmt(contribData.grandTotal)}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {selectedCategory && (
        <RecordModal
          category={selectedCategory}
          onClose={() => setSelectedCategory(null)}
          onRecorded={load}
        />
      )}
    </div>
  )
}
