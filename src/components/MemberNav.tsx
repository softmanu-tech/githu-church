"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, TrendingUp, Heart, MessageSquare, User } from "lucide-react"

const NAV_ITEMS = [
  { href: "/member",                  icon: Home,          label: "Home"     },
  { href: "/member/finance",          icon: TrendingUp,    label: "Finance"  },
  { href: "/member/prayer-requests",  icon: Heart,         label: "Prayers"  },
  { href: "/inbox",                   icon: MessageSquare, label: "Inbox"    },
  { href: "/member/profile",          icon: User,          label: "Profile"  },
]

// ── Desktop top-strip ─────────────────────────────────────────────────────────
// Shown on sm+ as a horizontal pill-tab bar at the top of the page content.
export function MemberNavStrip() {
  const pathname = usePathname()

  return (
    <nav className="hidden sm:flex bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-1 gap-1 mb-5">
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== "/member" && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
              active
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-500 hover:text-blue-700 hover:bg-blue-50"
            }`}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

// ── Mobile bottom nav ─────────────────────────────────────────────────────────
// Fixed to the bottom of the screen on mobile only (hidden on sm+).
export function MemberBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
      <div className="flex">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/member" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                active ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${active ? "bg-blue-50" : ""}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`text-[10px] font-medium leading-none ${active ? "text-blue-600" : "text-gray-400"}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
      {/* Safe-area padding for iOS home indicator */}
      <div className="h-[env(safe-area-inset-bottom,0px)]" style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
    </nav>
  )
}
