'use client';
import React, { useState, useEffect, useMemo } from 'react';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import Link from 'next/link';

import { CreateMemberForm } from '@/components/CreateMemberForm';
import { Users, Calendar, TrendingUp } from 'lucide-react';

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

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-blue-300 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-blue-200/90 backdrop-blur-md rounded-lg p-6 animate-pulse">
          <div className="h-8 bg-blue-400 rounded mb-4 w-64"></div>
          <div className="h-4 bg-blue-400 rounded w-48"></div>
        </div>
      </div>
    </div>
  );
}

export default function LeaderDashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAddMember, setOpenAddMember] = useState(false);

  // Filtering and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<'name' | 'attendanceCount' | 'lastAttendanceDate' | 'rating'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leader');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-300 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-blue-300 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-blue-200/90 backdrop-blur-md rounded-lg p-6">
            <p className="text-blue-800">No data available.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-300">
      {/* Header */}
      <div className="bg-blue-200/90 backdrop-blur-md border-b border-blue-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-blue-800">{data.group.name} - Leader Dashboard</h1>
              <p className="text-sm text-blue-700 mt-1">Manage your group members and events</p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setOpenAddMember(true)}
                className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-800 bg-white/80 backdrop-blur-sm hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Member
              </button>
              <Link 
                href="/leader/events" 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-800"
              >
                Create Event
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-700 uppercase tracking-wide">Total Members</p>
                  <p className="text-2xl font-bold text-blue-800">{data.members.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-700 uppercase tracking-wide">Total Events</p>
                  <p className="text-2xl font-bold text-blue-800">{data.events.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-700 uppercase tracking-wide">Attendance Records</p>
                  <p className="text-2xl font-bold text-blue-800">{data.attendanceRecords.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-6">
            <h3 className="text-lg font-medium text-blue-800 mb-4">Filter Members</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-blue-300 rounded-md px-4 py-2 bg-white/90 text-blue-800 placeholder-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <select
                value={ratingFilter ?? ''}
                onChange={(e) => {
                  setRatingFilter(e.target.value || null);
                  setCurrentPage(1);
                }}
                className="border border-blue-300 rounded-md px-4 py-2 bg-white/90 text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Ratings</option>
                <option value="Excellent">Excellent</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option>
              </select>

              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
                className="border border-blue-300 rounded-md px-4 py-2 bg-white/90 text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="attendanceCount">Sort by Attendance</option>
                <option value="lastAttendanceDate">Sort by Last Attendance</option>
                <option value="rating">Sort by Rating</option>
              </select>

              <select
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                className="border border-blue-300 rounded-md px-4 py-2 bg-white/90 text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          {/* Members Grid */}
          <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300">
            <div className="px-6 py-4 border-b border-blue-300">
              <h3 className="text-lg font-medium text-blue-800">Group Members</h3>
              <p className="text-sm text-blue-700 mt-1">Showing {paginatedMembers.length} of {filteredMembers.length} members</p>
            </div>
            
            <div className="p-6">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                  <h3 className="text-lg font-medium text-blue-800 mb-2">No members found</h3>
                  <p className="text-blue-600">Try adjusting your search filters or add new members to your group.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedMembers.map((member) => (
                    <div 
                      key={member._id}
                      className="animate-fade-in bg-white/80 backdrop-blur-sm rounded-lg border border-blue-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-blue-800">{member.name}</h4>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.rating === 'Excellent' ? 'bg-green-100 text-green-800' :
                          member.rating === 'Average' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {member.rating}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Email:</span> {member.email}
                        </p>
                        {member.phone && (
                          <p className="text-sm text-blue-700">
                            <span className="font-medium">Phone:</span> {member.phone}
                          </p>
                        )}
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Attendance:</span> {member.attendanceCount} events
                        </p>
                        <p className="text-sm text-blue-700">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-6">
              <h3 className="text-lg font-medium text-blue-800 mb-4">Attendance Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceTrend}>
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="attendance" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-sm border border-blue-300 p-6">
              <h3 className="text-lg font-medium text-blue-800 mb-4">Member Rating Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ratingDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ratingColors[entry.name as keyof typeof ratingColors]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

      {/* Add Member Modal */}
      {openAddMember && data && (
        <CreateMemberForm
          groupId={data.group._id}
          onMemberCreated={() => {
            setOpenAddMember(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
