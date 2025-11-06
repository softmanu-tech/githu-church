'use client';
import React, { useState, useEffect, useMemo } from 'react';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, Area, AreaChart
} from 'recharts';
import Link from 'next/link';
import { CreateMemberForm } from '@/components/CreateMemberForm';
import { AddExistingMemberForm } from '@/components/AddExistingMemberForm';
import { Users, Calendar, TrendingUp, Settings, LogOut, MessageSquare, UserPlus } from 'lucide-react';
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';
import { ProfileIcon } from '@/components/ProfileIcon';
import { ProfessionalHeader } from '@/components/ProfessionalHeader';

interface Member {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  attendanceCount: number;
  lastAttendanceDate: string | null;
  rating: 'Excellent' | 'Average' | 'Poor';
}

interface Event {
  _id: string;
  name: string;
  date: string;
}

interface Group {
  _id: string;
  name: string;
  leader: {
    _id: string;
    name: string;
  } | null;
}

export interface DashboardResponse {
  group: Group;
  leader?: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  members: Member[];
  events: Event[];
  attendanceRecords: {
    _id: string;
    event: string;
    group: string;
    date: string;
    presentMembers: string[];
  }[];
}

const PAGE_SIZE = 12;

const ratingColors = {
  Excellent: '#4caf50',
  Average: '#ff9800',
  Poor: '#f44336',
};


export default function LeaderDashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAddMember, setOpenAddMember] = useState(false);
  const [openAddExistingMember, setOpenAddExistingMember] = useState(false);

  // Filtering and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<'name' | 'attendanceCount' | 'lastAttendanceDate' | 'rating'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include"
      });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leader');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const result = await response.json();
      // Normalize API shape: handle cached { success, data } and direct payload
      setData(result && result.success && result.data ? result.data : result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      setPerformanceLoading(true);
      const response = await fetch('/api/leader/group-performance?months=6');
      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }
      const result = await response.json();
      if (result.success) {
        setPerformanceData(result.data);
      }
    } catch (err) {
      console.error('Error fetching performance data:', err);
    } finally {
      setPerformanceLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPerformanceData();
  }, []);

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    if (!data) return [];
    
    return data.members.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           member.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRating = !ratingFilter || member.rating === ratingFilter;
      
      return matchesSearch && matchesRating;
    }).sort((a, b) => {
      let aVal: any = a[sortKey];
      let bVal: any = b[sortKey];
      
      if (sortKey === 'lastAttendanceDate') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [data, searchTerm, ratingFilter, sortKey, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / PAGE_SIZE);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Chart data
  const ratingDistribution = useMemo(() => {
    if (!data) return [];
    
    const counts = { Excellent: 0, Average: 0, Poor: 0 };
    data.members.forEach(member => {
      counts[member.rating]++;
    });
    
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  const attendanceTrend = useMemo(() => {
    if (!data) return [];
    
    const dateMap = new Map<string, number>();
    data.attendanceRecords.forEach(record => {
      const date = new Date(record.date).toLocaleDateString();
      dateMap.set(date, record.presentMembers.length);
    });
    
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
    
    return sortedDates.map(date => ({
      date,
      attendance: dateMap.get(date)!
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-300">
        <ProfessionalHeader
          title="Leader Dashboard"
          subtitle="Manage your group members and events"
        />
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <UltraFastCardSkeleton key={i} />
            ))}
          </div>

          {/* Chart Skeleton */}
          <UltraFastChartSkeleton />

          {/* Table Skeleton */}
          <UltraFastTableSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-300 flex items-center justify-center px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md text-center">
          <div className="mb-4">
            <svg className="w-8 h-8 text-red-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <strong>Error:</strong> {error}
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-blue-300 flex items-center justify-center px-4">
        <div className="bg-blue-200/90 backdrop-blur-md rounded-lg p-6 border border-blue-300 text-center">
          <p className="text-blue-800">No data available.</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-300">
      <ProfessionalHeader
        title={`${data.group.name} - Leader Dashboard`}
        subtitle="Manage your group members and events"
        user={data.leader ? {
          name: data.leader.name,
          email: data.leader.email,
          profilePicture: data.leader.profilePicture
        } : undefined}
        actions={[
          {
            label: "Add Existing",
            onClick: () => setOpenAddExistingMember(true),
            variant: "outline",
            icon: <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
          },
          {
            label: "Add New",
            onClick: () => setOpenAddMember(true),
            variant: "outline",
            icon: <Users className="h-3 w-3 sm:h-4 sm:w-4" />
          },
          {
            label: "Mark Attendance",
            href: "/leader/attendance",
            variant: "outline",
            icon: <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
          },
          {
            label: "Manage Events",
            href: "/leader/events",
            variant: "default",
            icon: <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
          },
          {
            label: "View Analytics",
            href: "/leader/analytics",
            variant: "outline",
            className: "border-green-300 text-green-100 bg-green-600/20 hover:bg-green-600/30",
            icon: <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
          },
          {
            label: "Communications",
            href: "/leader/communications",
            variant: "outline",
            className: "border-blue-300 text-blue-100 bg-blue-600/20 hover:bg-blue-600/30",
            icon: <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
          },
          {
            label: "Logout",
            onClick: handleLogout,
            variant: "outline",
            className: "border-red-300 text-red-100 bg-red-600/20 hover:bg-red-600/30",
            icon: <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
          }
        ]}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="animate-fade-in space-y-4 sm:space-y-6 md:space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-3 sm:p-4 md:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600" />
                </div>
                <div className="ml-2 sm:ml-3 md:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 uppercase tracking-wide">Total Members</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-800">{data.members.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-3 sm:p-4 md:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600" />
                </div>
                <div className="ml-2 sm:ml-3 md:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 uppercase tracking-wide">Total Events</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-800">{data.events.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-3 sm:p-4 md:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600" />
                </div>
                <div className="ml-2 sm:ml-3 md:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 uppercase tracking-wide">Attendance Records</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-800">{data.attendanceRecords.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-3 sm:p-4 md:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600" />
                </div>
                <div className="ml-2 sm:ml-3 md:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 uppercase tracking-wide">Communications</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-800">View Messages</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-3 sm:p-4 md:p-6">
            <h3 className="text-sm sm:text-base md:text-lg font-medium text-blue-800 mb-3 sm:mb-4">Filter Members</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-blue-300 rounded-md px-2 sm:px-4 py-2 bg-white/90 text-blue-800 placeholder-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
              />

              <select
                value={ratingFilter ?? ''}
                onChange={(e) => {
                  setRatingFilter(e.target.value || null);
                  setCurrentPage(1);
                }}
                className="border border-blue-300 rounded-md px-2 sm:px-4 py-2 bg-white/90 text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
              >
                <option value="">All Ratings</option>
                <option value="Excellent">Excellent</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option>
              </select>

              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
                className="border border-blue-300 rounded-md px-2 sm:px-4 py-2 bg-white/90 text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
              >
                <option value="name">Sort by Name</option>
                <option value="attendanceCount">Sort by Attendance</option>
                <option value="lastAttendanceDate">Sort by Last Attendance</option>
                <option value="rating">Sort by Rating</option>
              </select>

              <select
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                className="border border-blue-300 rounded-md px-2 sm:px-4 py-2 bg-white/90 text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          {/* Members Grid */}
          <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300">
            <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-blue-300">
              <h3 className="text-sm sm:text-base md:text-lg font-medium text-blue-800">Group Members</h3>
              <p className="text-xs sm:text-sm text-blue-700 mt-1">Showing {paginatedMembers.length} of {filteredMembers.length} members</p>
            </div>
            
            <div className="p-3 sm:p-4 md:p-6">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                  <h3 className="text-lg font-medium text-blue-800 mb-2">No members found</h3>
                  <p className="text-blue-600">Try adjusting your search filters or add new members to your group.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  {paginatedMembers.map((member) => (
                    <div 
                      key={member._id}
                      className="animate-fade-in bg-white/80 backdrop-blur-sm rounded-lg border border-blue-200 p-3 sm:p-4 md:p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h4 className="text-base sm:text-lg font-semibold text-blue-800">{member.name}</h4>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.rating === 'Excellent' ? 'bg-blue-100 text-blue-800' :
                          member.rating === 'Average' ? 'bg-blue-200 text-blue-800' :
                          'bg-blue-300 text-blue-800'
                        }`}>
                          {member.rating}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-xs sm:text-sm text-blue-700">
                          <span className="font-medium">Email:</span> {member.email}
                        </p>
                        {member.phone && (
                          <p className="text-xs sm:text-sm text-blue-700">
                            <span className="font-medium">Phone:</span> {member.phone}
                          </p>
                        )}
                        <p className="text-xs sm:text-sm text-blue-700">
                          <span className="font-medium">Attendance:</span> {member.attendanceCount} events
                        </p>
                        <p className="text-xs sm:text-sm text-blue-700">
                          <span className="font-medium">Last Attended:</span> {
                            member.lastAttendanceDate ? 
                            new Date(member.lastAttendanceDate).toLocaleDateString() : 
                            'Never'
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-blue-300 rounded-md bg-white/80 text-blue-800 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-4 py-2 text-blue-800">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-blue-300 rounded-md bg-white/80 text-blue-800 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-3 sm:p-4 md:p-6">
              <h3 className="text-sm sm:text-base md:text-lg font-medium text-blue-800 mb-3 sm:mb-4">Attendance Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={attendanceTrend}>
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="attendance" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-3 sm:p-4 md:p-6">
              <h3 className="text-sm sm:text-base md:text-lg font-medium text-blue-800 mb-3 sm:mb-4">Member Rating Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={ratingDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#3b82f6" />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Group Performance Analytics */}
          <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-3 sm:p-4 md:p-6">
            <h3 className="text-sm sm:text-base md:text-lg font-medium text-blue-800 mb-3 sm:mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Group Performance Analytics
            </h3>
            
            {performanceLoading ? (
              <UltraFastChartSkeleton />
            ) : performanceData ? (
              <div className="space-y-6">
                {/* Performance Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white/80 p-3 sm:p-4 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-800">{performanceData.overallStats.attendanceRate}%</div>
                    <div className="text-sm text-blue-600">Overall Attendance Rate</div>
                    <div className={`text-xs mt-1 ${
                      performanceData.trend.direction === 'improving' ? 'text-green-600' :
                      performanceData.trend.direction === 'declining' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {performanceData.trend.direction === 'improving' ? '↗' : 
                       performanceData.trend.direction === 'declining' ? '↘' : '→'} 
                      {performanceData.trend.description}
                    </div>
                  </div>
                  
                  <div className="bg-white/80 p-3 sm:p-4 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-green-800">{performanceData.overallStats.totalPresent}</div>
                    <div className="text-sm text-blue-600">Total Present</div>
                    <div className="text-xs text-blue-600 mt-1">
                      Avg: {performanceData.overallStats.averageAttendancePerEvent} per event
                    </div>
                  </div>
                  
                  <div className="bg-white/80 p-3 sm:p-4 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-800">{performanceData.groupInfo.totalEvents}</div>
                    <div className="text-sm text-blue-600">Total Events</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {performanceData.groupInfo.totalAttendanceRecords} attendance records
                    </div>
                  </div>
                  
                  <div className="bg-white/80 p-3 sm:p-4 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-purple-800">{performanceData.insights.excellentMembers}</div>
                    <div className="text-sm text-blue-600">Excellent Members</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {performanceData.insights.needsAttention} need attention
                    </div>
                  </div>
                </div>

                {/* Monthly Performance Chart */}
                <div className="bg-white/80 p-3 sm:p-4 rounded-lg border border-blue-200">
                  <h4 className="text-sm sm:text-base md:text-lg font-medium text-blue-800 mb-3 sm:mb-4">Monthly Attendance Trend</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={performanceData.monthlyData}>
                      <defs>
                        <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#1E40AF' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#1E40AF' }} domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${value}%`, 
                          name === 'attendanceRate' ? 'Attendance Rate' : name
                        ]}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #3B82F6',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="attendanceRate" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorAttendance)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Performing Members */}
                <div className="bg-white/80 p-3 sm:p-4 rounded-lg border border-blue-200">
                  <h4 className="text-sm sm:text-base md:text-lg font-medium text-blue-800 mb-3 sm:mb-4">Top Performing Members</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={performanceData.memberPerformance.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
                      <XAxis 
                        dataKey="memberName" 
                        tick={{ fontSize: 10, fill: '#1E40AF' }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 12, fill: '#1E40AF' }} domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Attendance Rate']}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #3B82F6',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar 
                        dataKey="attendanceRate" 
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  {/* Performance Legend */}
                  <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 mt-3 sm:mt-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded"></div>
                      <span className="text-blue-800 font-medium">Excellent (80%+)</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded"></div>
                      <span className="text-blue-800 font-medium">Good (60-79%)</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded"></div>
                      <span className="text-blue-800 font-medium">Average (40-59%)</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded"></div>
                      <span className="text-blue-800 font-medium">Poor (&lt;40%)</span>
                    </div>
                  </div>
                </div>

                {/* Performance Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
                    <h5 className="font-medium text-green-800 mb-2 text-sm sm:text-base">🏆 Best Performance</h5>
                    <p className="text-xs sm:text-sm text-green-700">
                      <strong>{performanceData.insights.bestMonth.month}</strong> had the highest attendance rate at 
                      <strong>{performanceData.insights.bestMonth.attendanceRate}%</strong>
                    </p>
                  </div>
                  
                  <div className="bg-amber-50 p-3 sm:p-4 rounded-lg border border-amber-200">
                    <h5 className="font-medium text-amber-800 mb-2 text-sm sm:text-base">⚠️ Needs Attention</h5>
                    <p className="text-xs sm:text-sm text-amber-700">
                      <strong>{performanceData.insights.needsAttention}</strong> members have poor attendance and may need follow-up
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-blue-600">
                <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm sm:text-base">Performance analytics will appear here once data is available.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Add Member Modals */}
      {openAddMember && data && (
        <CreateMemberForm
          groupId={data.group._id}
          onMemberCreated={() => {
            setOpenAddMember(false);
            fetchData();
          }}
        />
      )}

      {openAddExistingMember && data && (
        <AddExistingMemberForm
          groupId={data.group._id}
          onMemberAdded={() => {
            setOpenAddExistingMember(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}