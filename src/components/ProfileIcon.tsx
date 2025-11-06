"use client"

import React from "react"
import Image from "next/image"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProfileIconProps {
  profilePicture?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  onClick?: () => void
}

export function ProfileIcon({ 
  profilePicture, 
  name, 
  size = 'md', 
  className,
  onClick 
}: ProfileIconProps) {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8'
  }

  const sizeMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64
  }

  return (
    <div 
      className={cn(
        "rounded-full bg-blue-300 border-2 border-blue-400 overflow-hidden flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors",
        sizeClasses[size],
        className
      )}
      onClick={onClick}
      title={name ? `${name}'s profile` : 'Profile'}
    >
      {profilePicture ? (
        <Image 
          src={profilePicture} 
          alt={name ? `${name}'s profile` : 'Profile'} 
          width={sizeMap[size]}
          height={sizeMap[size]}
          className="w-full h-full object-cover"
          unoptimized
        />
      ) : (
        <User className={cn("text-blue-600", iconSizes[size])} />
      )}
    </div>
  )
}

