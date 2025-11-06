"use client"

import React, { useState, useRef } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';
import { useAlerts } from "@/components/ui/alert-system"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Camera, 
  Lock, 
  Save,
  Edit3,
  Shield,
  Users,
  X
} from "lucide-react"

interface UserProfile {
  _id: string
  name: string
  email: string
  phone?: string
  residence?: string
  department?: string
  role: 'bishop' | 'leader' | 'member' | 'protocol'
  profilePicture?: string
  group?: {
    _id: string
    name: string
  }
  lastPasswordReset?: string
}

interface ProfileManagerProps {
  user: UserProfile
  canResetPasswords?: boolean
  subordinateUsers?: UserProfile[]
  onProfileUpdate: (updatedUser: UserProfile) => void
}

export function ProfileManager({ 
  user, 
  canResetPasswords = false, 
  subordinateUsers = [], 
  onProfileUpdate 
}: ProfileManagerProps) {
  const alerts = useAlerts()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Profile editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    residence: user.residence || '',
    department: user.department || ''
  })
  
  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // Loading states
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  
  // Password reset modal state
  const [showResetModal, setShowResetModal] = useState(false)
  const [selectedUserForReset, setSelectedUserForReset] = useState<UserProfile | null>(null)
  const [newPasswordForReset, setNewPasswordForReset] = useState('')

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset to original values if canceling
      setEditData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        residence: user.residence || '',
        department: user.department || ''
      })
    }
    setIsEditing(!isEditing)
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      
      // Validate required fields
      if (!editData.name.trim() || !editData.email.trim()) {
        alerts.error(
          "Validation Error",
          "Name and email are required fields.",
          [{ label: "OK", action: () => {}, variant: "primary" }]
        )
        return
      }

      const response = await fetch(`/api/${user.role}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editData.name.trim(),
          email: editData.email.trim(),
          phone: editData.phone.trim() || undefined,
          residence: editData.residence.trim() || undefined,
          department: editData.department.trim() || undefined
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        alerts.success(
          "Profile Updated!",
          "Your profile information has been successfully updated.",
          [
            {
              label: "Great!",
              action: () => {},
              variant: "primary"
            }
          ]
        )
        
        // Update parent component
        onProfileUpdate(result.data.user)
        setIsEditing(false)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      alerts.error(
        "Update Failed",
        error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        [
          {
            label: "Retry",
            action: () => handleSaveProfile(),
            variant: "primary"
          }
        ]
      )
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alerts.error(
        "Invalid File",
        "Please select a valid image file (PNG, JPG, GIF).",
        [{ label: "OK", action: () => {}, variant: "primary" }]
      )
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alerts.error(
        "File Too Large",
        "Please select an image smaller than 5MB.",
        [{ label: "OK", action: () => {}, variant: "primary" }]
      )
      return
    }

    try {
      setUploadingImage(true)
      
      const formData = new FormData()
      formData.append('profilePicture', file)

      const response = await fetch(`/api/${user.role}/profile/picture`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        
        alerts.success(
          "Profile Picture Updated!",
          "Your profile picture has been successfully uploaded.",
          [
            {
              label: "Awesome!",
              action: () => {},
              variant: "primary"
            }
          ]
        )
        
        // Update parent component
        onProfileUpdate(result.data.user)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Image upload error:', error)
      alerts.error(
        "Upload Failed",
        error instanceof Error ? error.message : "Failed to upload image. Please try again.",
        [
          {
            label: "Retry",
            action: () => fileInputRef.current?.click(),
            variant: "primary"
          }
        ]
      )
    } finally {
      setUploadingImage(false)
    }
  }

  const handlePasswordChange = async () => {
    try {
      // Validate password fields
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        alerts.warning(
          "Missing Information",
          "Please fill in all password fields.",
          [{ label: "OK", action: () => {}, variant: "primary" }]
        )
        return
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        alerts.warning(
          "Password Mismatch",
          "New password and confirmation don't match.",
          [{ label: "OK", action: () => {}, variant: "primary" }]
        )
        return
      }

      if (passwordData.newPassword.length < 6) {
        alerts.warning(
          "Password Too Short",
          "New password must be at least 6 characters long.",
          [{ label: "OK", action: () => {}, variant: "primary" }]
        )
        return
      }

      setChangingPassword(true)

      const response = await fetch(`/api/${user.role}/profile/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      if (response.ok) {
        alerts.success(
          "Password Changed!",
          "Your password has been successfully updated.",
          [
            {
              label: "Great!",
              action: () => {},
              variant: "primary"
            }
          ]
        )
        
        // Reset form and close modal
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setShowPasswordChange(false)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to change password')
      }
    } catch (error) {
      console.error('Password change error:', error)
      alerts.error(
        "Password Change Failed",
        error instanceof Error ? error.message : "Failed to change password. Please try again.",
        [
          {
            label: "Retry",
            action: () => handlePasswordChange(),
            variant: "primary"
          }
        ]
      )
    } finally {
      setChangingPassword(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!selectedUserForReset || !newPasswordForReset.trim()) {
      alerts.warning(
        "Missing Information",
        "Please enter a new password for the user.",
        [{ label: "OK", action: () => {}, variant: "primary" }]
      )
      return
    }

    if (newPasswordForReset.length < 6) {
      alerts.warning(
        "Password Too Short",
        "New password must be at least 6 characters long.",
        [{ label: "OK", action: () => {}, variant: "primary" }]
      )
      return
    }

    try {
      const response = await fetch(`/api/${user.role}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: selectedUserForReset._id,
          newPassword: newPasswordForReset
        })
      })

      if (response.ok) {
        alerts.success(
          "Password Reset Successful!",
          `Password has been reset for ${selectedUserForReset.name}. Please share the new password with them securely.`,
          [
            {
              label: "Copy Password",
              action: () => navigator.clipboard.writeText(newPasswordForReset),
              variant: "primary"
            }
          ]
        )
        
        // Close modal and reset state
        setShowResetModal(false)
        setSelectedUserForReset(null)
        setNewPasswordForReset('')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Password reset error:', error)
      alerts.error(
        "Password Reset Failed",
        error instanceof Error ? error.message : "Failed to reset password. Please try again.",
        [
          {
            label: "Retry",
            action: () => handlePasswordReset(),
            variant: "primary"
          }
        ]
      )
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'bishop': return <Shield className="h-4 w-4" />
      case 'leader': return <Users className="h-4 w-4" />
      case 'member': return <User className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'bishop': return 'bg-blue-600 text-white'
      case 'leader': return 'bg-blue-500 text-white'
      case 'member': return 'bg-blue-400 text-white'
      default: return 'bg-blue-400 text-white'
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Information Card */}
      <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-blue-800 flex items-center gap-2 text-lg sm:text-xl">
              <User className="h-5 w-5" />
              My Profile
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleEditToggle}
                variant={isEditing ? "outline" : "default"}
                size="sm"
                className={isEditing ? 
                  "border-blue-300 text-blue-800 bg-white/80 hover:bg-white/90" : 
                  "bg-blue-600 hover:bg-blue-700 text-white"
                }
              >
                {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit3 className="h-4 w-4 mr-2" />}
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
              
              <Button
                onClick={() => setShowPasswordChange(true)}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-800 bg-white/80 hover:bg-white/90"
              >
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center space-y-6">
              <div className="relative group">
                <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-blue-200 to-blue-400 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:shadow-2xl">
                  {user.profilePicture ? (
                    <Image 
                      src={user.profilePicture} 
                      alt="Profile" 
                      width={160}
                      height={160}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <User className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 text-blue-600" />
                  )}
                </div>
                
                {/* Upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-300 disabled:opacity-50 hover:scale-110"
                  title="Upload profile picture"
                >
                  {uploadingImage ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              
              {/* User Name & Role */}
              <div className="text-center space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-blue-800">{user.name}</h2>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)} shadow-md`}>
                  {getRoleIcon(user.role)}
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>
                {user.group && (
                  <p className="text-blue-600 text-sm">{user.group.name} Group</p>
                )}
              </div>
            </div>

            {/* Profile Information */}
            <div className="flex-1 space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">
                  <User className="h-4 w-4 inline mr-1" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 text-blue-800 placeholder-blue-600 bg-white/90"
                    placeholder="Enter your full name"
                    required
                  />
                ) : (
                  <p className="text-blue-800 font-medium bg-white/60 px-3 py-2 rounded-md">{user.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 text-blue-800 placeholder-blue-600 bg-white/90"
                    placeholder="your.email@example.com"
                    required
                  />
                ) : (
                  <p className="text-blue-800 font-medium bg-white/60 px-3 py-2 rounded-md">{user.email}</p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 text-blue-800 placeholder-blue-600 bg-white/90"
                    placeholder="+254 700 000 000"
                  />
                ) : (
                  <p className="text-blue-800 font-medium bg-white/60 px-3 py-2 rounded-md">{user.phone || 'Not provided'}</p>
                )}
              </div>

              {/* Residence Field (for members and leaders) */}
              {(user.role === 'member' || user.role === 'leader') && (
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-1">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Residence
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.residence}
                      onChange={(e) => setEditData({ ...editData, residence: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 text-blue-800 placeholder-blue-600 bg-white/90"
                      placeholder="Enter your residence/address"
                    />
                  ) : (
                    <p className="text-blue-800 font-medium bg-white/60 px-3 py-2 rounded-md">{user.residence || 'Not provided'}</p>
                  )}
                </div>
              )}

              {/* Department Field (for members) */}
              {user.role === 'member' && (
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-1">
                    <Building className="h-4 w-4 inline mr-1" />
                    Department
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.department}
                      onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 text-blue-800 placeholder-blue-600 bg-white/90"
                      placeholder="e.g., Youth, Choir, Ushering"
                    />
                  ) : (
                    <p className="text-blue-800 font-medium bg-white/60 px-3 py-2 rounded-md">{user.department || 'Not provided'}</p>
                  )}
                </div>
              )}

              {/* Group Information */}
              {user.group && (
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-1">
                    <Users className="h-4 w-4 inline mr-1" />
                    Group
                  </label>
                  <p className="text-blue-800 font-medium bg-white/60 px-3 py-2 rounded-md">{user.group.name}</p>
                </div>
              )}

              {/* Save Button */}
              {isEditing && (
                <div className="pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? (
                      <>
                        <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Reset Section (for users with subordinates) */}
      {canResetPasswords && subordinateUsers.length > 0 && (
        <Card className="bg-blue-200/90 backdrop-blur-md border border-blue-300">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-blue-800 flex items-center gap-2 text-lg sm:text-xl">
              <Shield className="h-5 w-5" />
              Password Reset Management
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <p className="text-blue-700 mb-4">
              You can reset passwords for the following users:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subordinateUsers.map((subordinate) => (
                <div
                  key={subordinate._id}
                  className="bg-white/80 rounded-lg p-3 border border-blue-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-blue-800 truncate">{subordinate.name}</p>
                      <p className="text-sm text-blue-600 truncate">{subordinate.email}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {getRoleIcon(subordinate.role)}
                        <span className="text-xs text-blue-500">{subordinate.role}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedUserForReset(subordinate)
                        setShowResetModal(true)
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white ml-2"
                    >
                      <Lock className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-blue-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-blue-200/95 backdrop-blur-md rounded-lg shadow-xl max-w-md w-full border border-blue-300">
            <div className="flex items-center justify-between p-6 border-b border-blue-300">
              <h3 className="text-lg font-semibold text-blue-800">Change Password</h3>
              <button
                onClick={() => {
                  setShowPasswordChange(false)
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 text-blue-800 bg-white/90"
                  placeholder="Enter current password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 text-blue-800 bg-white/90"
                  placeholder="Enter new password (min 6 chars)"
                  minLength={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 text-blue-800 bg-white/90"
                  placeholder="Confirm new password"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  onClick={() => {
                    setShowPasswordChange(false)
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  }}
                  variant="outline"
                  className="border-blue-300 text-blue-800 bg-white/80 hover:bg-white/90"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePasswordChange}
                  disabled={changingPassword}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {changingPassword ? (
                    <>
                      <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </div>
                      Changing...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showResetModal && selectedUserForReset && (
        <div className="fixed inset-0 bg-blue-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-blue-200/95 backdrop-blur-md rounded-lg shadow-xl max-w-md w-full border border-blue-300">
            <div className="flex items-center justify-between p-6 border-b border-blue-300">
              <h3 className="text-lg font-semibold text-blue-800">Reset Password</h3>
              <button
                onClick={() => {
                  setShowResetModal(false)
                  setSelectedUserForReset(null)
                  setNewPasswordForReset('')
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-100 border border-blue-300 text-blue-700 px-4 py-3 rounded text-sm">
                <strong>Resetting password for:</strong><br />
                {selectedUserForReset.name} ({selectedUserForReset.email})
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPasswordForReset}
                  onChange={(e) => setNewPasswordForReset(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 text-blue-800 bg-white/90"
                  placeholder="Enter new password (min 6 chars)"
                  minLength={6}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  onClick={() => {
                    setShowResetModal(false)
                    setSelectedUserForReset(null)
                    setNewPasswordForReset('')
                  }}
                  variant="outline"
                  className="border-blue-300 text-blue-800 bg-white/80 hover:bg-white/90"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePasswordReset}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
