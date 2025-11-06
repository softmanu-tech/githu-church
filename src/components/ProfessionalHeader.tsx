"use client"

import React from "react"
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
  return (
    <div className={`sticky top-0 z-[100] bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 border-b border-blue-500 shadow-lg ${className}`} style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="py-3 sm:py-4 md:py-6">
          {/* Main Header Row */}
          <div className="flex justify-between items-start gap-3 sm:gap-4">
            
            {/* Left Section - Logo, Title, Subtitle */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              {/* Logo */}
              <div className="animate-fade-in flex-shrink-0">
                <div className="bg-white/20 backdrop-blur-md rounded-full p-2 shadow-lg border border-white/30">
                  <Image
                    src="/logo.jpg"
                    alt="G-45 Main Logo"
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                    priority
                  />
                </div>
              </div>

              {/* Title and Subtitle */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white truncate">
                    {title}
                  </h1>
                  <div className="hidden sm:block bg-white/20 px-2 py-1 rounded-full">
                    <span className="text-xs font-medium text-white/90">G-45 Main</span>
                  </div>
                </div>
                {subtitle && (
                  <p className="text-xs sm:text-sm text-blue-100 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Right Section - Icons positioned on right side */}
            <div className="flex flex-col lg:flex-row items-end lg:items-center gap-2 flex-shrink-0">
              
              {/* Profile Icon (smaller than logo) */}
              {user && (
                <Link href={`/${user.email.includes('bishop') ? 'bishop' : user.email.includes('protocol') ? 'protocol' : user.email.includes('leader') ? 'leader' : 'member'}/profile`}>
                  <div className="relative">
                    <ProfileIcon 
                      profilePicture={user.profilePicture}
                      name={user.name}
                      size="md"
                      className="hover:border-white/50 border-2 border-white/30 shadow-lg hover:shadow-xl transition-all duration-300"
                    />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                  </div>
                </Link>
              )}

              {/* Icons Row - Vertical on small/medium, Horizontal on large screens */}
              <div className="flex flex-col lg:flex-row items-center gap-2">
                {/* Back Button (if provided) */}
                {backHref && (
                  <Link href={backHref}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10 p-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 bg-white/5 border border-white/20"
                      title="Go Back"
                    >
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </Button>
                  </Link>
                )}

                {/* Logout Icon (icon only) */}
                {actions.find(action => action.label === "Logout") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={actions.find(action => action.label === "Logout")?.onClick}
                    className="text-white hover:bg-red-500/20 p-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 bg-red-500/10 border border-red-300/30"
                    title="Logout"
                  >
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons Row - Below main header on mobile */}
          {actions.filter(action => action.label !== "Logout").length > 0 && (
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-start sm:justify-center lg:justify-end">
              {actions.filter(action => action.label !== "Logout").map((action, index) => (
                action.href ? (
                  <Link key={index} href={action.href}>
                    <Button
                      variant={action.variant || "outline"}
                      size="sm"
                      className={`text-xs sm:text-sm px-2 sm:px-3 py-2 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg backdrop-blur-sm ${
                        action.variant === "outline" 
                          ? "border-white/30 text-white bg-white/10 hover:bg-white/20 hover:border-white/50" 
                          : action.variant === "ghost"
                          ? "text-white hover:bg-white/10"
                          : "bg-white/90 text-blue-800 hover:bg-white hover:text-blue-900"
                      } ${action.className || ""}`}
                    >
                      {action.icon && <span className="mr-1 sm:mr-2">{action.icon}</span>}
                      {action.label}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    key={index}
                    variant={action.variant || "outline"}
                    size="sm"
                    onClick={action.onClick}
                    className={`text-xs sm:text-sm px-2 sm:px-3 py-2 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg backdrop-blur-sm ${
                      action.variant === "outline" 
                        ? "border-white/30 text-white bg-white/10 hover:bg-white/20 hover:border-white/50" 
                        : action.variant === "ghost"
                        ? "text-white hover:bg-white/10"
                        : "bg-white/90 text-blue-800 hover:bg-white hover:text-blue-900"
                    } ${action.className || ""}`}
                  >
                    {action.icon && <span className="mr-1 sm:mr-2">{action.icon}</span>}
                    {action.label}
                  </Button>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
