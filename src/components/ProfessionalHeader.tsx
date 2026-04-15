"use client"

import React, { useRef, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ProfileIcon } from "@/components/ProfileIcon"

interface HeaderAction {
  label: string
  href?: string
  onClick?: () => void
  variant?: "default" | "outline" | "ghost"
  className?: string
  icon?: React.ReactNode
}

interface ProfessionalHeaderProps {
  title: string
  subtitle?: string
  user?: {
    name: string
    email: string
    profilePicture?: string
  }
  actions?: HeaderAction[]
  backHref?: string
  className?: string
}

export function ProfessionalHeader({
  title,
  subtitle,
  user,
  actions = [],
  backHref,
  className = ""
}: ProfessionalHeaderProps) {
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerHeight, setHeaderHeight] = useState(90)

  // Measure actual header height so the spacer is always accurate,
  // even when action buttons wrap to multiple lines on small screens.
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    setHeaderHeight(el.offsetHeight)
    const observer = new ResizeObserver(() => setHeaderHeight(el.offsetHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const nonLogoutActions = actions.filter(a => a.label !== "Logout")

  return (
    <>
      <div
        ref={headerRef}
        className={`sticky-header bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 border-b border-blue-500 shadow-lg ${className}`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="py-3 sm:py-4 md:py-5">

            {/* ── Main row: logo · title · profile · logout ── */}
            <div className="flex justify-between items-center gap-3 sm:gap-4">

              {/* Left – logo + title */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div className="flex-shrink-0">
                  <div className="bg-white/20 backdrop-blur-md rounded-full p-1.5 sm:p-2 shadow-lg border border-white/30">
                    <Image
                      src="/logo.jpg"
                      alt="G-45 Main Logo"
                      width={36}
                      height={36}
                      className="rounded-full object-cover w-8 h-8 sm:w-9 sm:h-9"
                      priority
                    />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white truncate leading-tight">
                      {title}
                    </h1>
                    <span className="hidden sm:inline-flex bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium text-white/90 flex-shrink-0">
                      G-45 Main
                    </span>
                  </div>
                  {subtitle && (
                    <p className="text-xs text-blue-100 truncate mt-0.5">{subtitle}</p>
                  )}
                </div>
              </div>

              {/* Right – profile avatar + logout icon */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {user && (
                  <Link href={`/${user.email.includes('bishop') ? 'bishop' : user.email.includes('protocol') ? 'protocol' : user.email.includes('leader') ? 'leader' : 'member'}/profile`}>
                    <div className="relative">
                      <ProfileIcon
                        profilePicture={user.profilePicture}
                        name={user.name}
                        size="md"
                        className="hover:border-white/50 border-2 border-white/30 shadow-lg hover:shadow-xl transition-all duration-300"
                      />
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />
                    </div>
                  </Link>
                )}

                {backHref && (
                  <Link href={backHref}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10 p-1.5 sm:p-2 rounded-xl bg-white/5 border border-white/20"
                      title="Go Back"
                    >
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </Button>
                  </Link>
                )}

                {actions.find(a => a.label === "Logout") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={actions.find(a => a.label === "Logout")?.onClick}
                    className="text-white hover:bg-red-500/20 p-1.5 sm:p-2 rounded-xl bg-red-500/10 border border-red-300/30"
                    title="Logout"
                  >
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </Button>
                )}
              </div>
            </div>

            {/* ── Navigation action buttons (non-logout) ── */}
            {nonLogoutActions.length > 0 && (
              <div className="flex gap-1.5 sm:gap-2 mt-2 overflow-x-auto scrollbar-hide pb-1">
                {nonLogoutActions.map((action, index) =>
                  action.href ? (
                    <Link key={index} href={action.href} className="flex-shrink-0">
                      <Button
                        variant={action.variant || "outline"}
                        size="sm"
                        className={`text-xs px-2.5 py-1.5 h-auto whitespace-nowrap transition-all duration-200 hover:scale-105 shadow-sm backdrop-blur-sm border-white/30 text-white bg-white/10 hover:bg-white/20 hover:border-white/50 ${action.className || ""}`}
                      >
                        {action.icon && <span className="mr-1">{action.icon}</span>}
                        {action.label}
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      key={index}
                      variant={action.variant || "outline"}
                      size="sm"
                      onClick={action.onClick}
                      className={`flex-shrink-0 text-xs px-2.5 py-1.5 h-auto whitespace-nowrap transition-all duration-200 hover:scale-105 shadow-sm backdrop-blur-sm border-white/30 text-white bg-white/10 hover:bg-white/20 hover:border-white/50 ${action.className || ""}`}
                    >
                      {action.icon && <span className="mr-1">{action.icon}</span>}
                      {action.label}
                    </Button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic spacer — always matches the actual fixed header height + 20px breathing room */}
      <div style={{ height: headerHeight + 20 }} aria-hidden="true" />
    </>
  )
}
