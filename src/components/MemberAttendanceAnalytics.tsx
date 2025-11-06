import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { format, addDays } from 'date-fns';

interface MemberAttendance {
  member: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  attendance: {
    present: number;
    absent: number;
    total: number;
    percentage: number;
  };
  trend: string;
}

interface GroupStats {
  totalMembers: number;
  totalEvents: number;
  totalAttendanceRecords: number;
  averageAttendance: number;
}

interface AnalyticsData {
  groupStats: GroupStats;
  memberAnalytics: MemberAttendance[];
}

interface MemberDetailsData {
  member: {
    _id: string;
    name: string;
    email: string;
  };
  summary: {
    attendanceRate: number;
    attendedEvents: number;
    totalEvents: number;
  };
  streaks: {
    current: number;
    longest: number;
  };
  patterns: {
    dayOfWeek: Array<{
      day: string;
      percentage: number;
    }>;
    monthly: Array<{
      month: string;
      percentage: number;
    }>;
  };
  history: Array<{
    date: string;
    event?: {
      _id: string;
      title: string;
    };
    status: 'present' | 'absent';
    notes?: string;
  }>;
}

export default function MemberAttendanceAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [memberDetails, setMemberDetails] = useState<MemberDetailsData | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("table");

  useEffect(() => {
    setStartDate(new Date(new Date().setDate(new Date().getDate() - 30)))
    setEndDate(new Date())
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      fetchAnalytics();
    }
  }, [startDate, endDate]);

  const fetchAnalytics = async () => {
    if (!startDate || !endDate) {
      setError("Start and end dates are required");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/leader/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch analytics data');
        console.error('Failed to fetch analytics:', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberDetails = async (memberId: string) => {
    if (!memberId || !startDate || !endDate) {
      setDetailsError("Member ID and date range are required");
      return;
    }
    
    setLoadingDetails(true);
    setDetailsError(null);
    try {
      const response = await fetch(
        `/api/leader/member-attendance-details?memberId=${memberId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setMemberDetails(result.data);
        setSelectedMember(memberId);
        setActiveTab("details");
      } else {
        setDetailsError(result.error || 'Failed to fetch member details');
        console.error('Failed to fetch member details:', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setDetailsError(errorMessage);
      console.error('Error fetching member details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improved':
        return 'text-green-500';
      case 'declined':
        return 'text-red-500';
      default:
        return 'text-blue-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improved':
        return '↑';
      case 'declined':
        return '↓';
      default:
        return '→';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Error: {error}</p>
        <Button onClick={fetchAnalytics} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Member Attendance Analytics</h2>
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="border rounded-md p-2">
            <p className="text-sm text-blue-600 mb-1">Start Date</p>
            <div className="flex items-center">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setStartDate(prev => prev ? addDays(prev, -7) : new Date())}
                className="mr-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Calendar
                mode="single"
                selected={startDate || undefined}
                onSelect={(date: Date | undefined) => date && setStartDate(date)}
                className="rounded-md border"
                disabled={(date: Date): boolean => !endDate ? false : date > endDate}
              />
            </div>
          </div>
          <div className="border rounded-md p-2">
            <p className="text-sm text-blue-600 mb-1">End Date</p>
            <div className="flex items-center">
              <Calendar
                mode="single"
                selected={endDate || undefined}
                onSelect={(date: Date | undefined) => date && setEndDate(date)}
                className="rounded-md border"
                disabled={(date: Date) => !startDate || date < startDate || date > new Date()}
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setEndDate(prev => prev ? addDays(prev, 7) : new Date())}
                className="ml-2"
                disabled={!endDate || endDate >= new Date()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {data && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.groupStats.totalMembers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.groupStats.totalEvents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.groupStats.totalAttendanceRecords}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.groupStats.averageAttendance}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="chart">Chart View</TabsTrigger>
          {selectedMember && <TabsTrigger value="details">Member Details</TabsTrigger>}
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Member Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                        Attendance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                        Trend
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data?.memberAnalytics && data.memberAnalytics.length > 0 ? (
                      data.memberAnalytics.map((item) => (
                        <tr key={item.member._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.member.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-blue-600">{item.member.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.attendance.percentage}% ({item.attendance.present}/{item.attendance.total})
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTrendColor(item.trend)}`}>
                              {getTrendIcon(item.trend)} {item.trend}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchMemberDetails(item.member._id)}
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-blue-600">
                          No attendance data available for the selected period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Percentage by Member</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              {data?.memberAnalytics && data.memberAnalytics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.memberAnalytics.map(item => ({
                      name: item.member.name,
                      attendance: item.attendance.percentage
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                    <YAxis label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Attendance']} />
                    <Bar dataKey="attendance" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-full text-blue-600">
                  No data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {selectedMember && (
          <TabsContent value="details" className="space-y-4">
            {loadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading member analytics...</span>
                </div>
              </div>
            ) : detailsError ? (
              <div className="flex flex-col items-center justify-center h-64 text-red-500">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p>Error: {detailsError}</p>
                <Button onClick={() => fetchMemberDetails(selectedMember)} className="mt-4">Retry</Button>
              </div>
            ) : memberDetails ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>{memberDetails.member?.name || 'Member'} - Attendance Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="text-sm font-medium text-blue-600">Attendance Rate</div>
                        <div className="text-2xl font-bold">{memberDetails.summary?.attendanceRate || 0}%</div>
                      </div>
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="text-sm font-medium text-blue-600">Events Attended</div>
                        <div className="text-2xl font-bold">{memberDetails.summary?.attendedEvents || 0}/{memberDetails.summary?.totalEvents || 0}</div>
                      </div>
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="text-sm font-medium text-blue-600">Current Streak</div>
                        <div className="text-2xl font-bold">{memberDetails.streaks?.current || 0}</div>
                      </div>
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="text-sm font-medium text-blue-600">Longest Streak</div>
                        <div className="text-2xl font-bold">{memberDetails.streaks?.longest || 0}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Day of Week Patterns</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      {memberDetails.patterns?.dayOfWeek && memberDetails.patterns.dayOfWeek.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={memberDetails.patterns.dayOfWeek}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <XAxis dataKey="day" />
                            <YAxis label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }} />
                            <Tooltip formatter={(value) => [`${value}%`, 'Attendance']} />
                            <Bar dataKey="percentage" fill="#82ca9d" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex justify-center items-center h-full text-blue-600">
                          No day of week data available
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Trends</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      {memberDetails.patterns?.monthly && memberDetails.patterns.monthly.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={memberDetails.patterns.monthly}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <XAxis dataKey="month" />
                            <YAxis label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }} />
                            <Tooltip formatter={(value) => [`${value}%`, 'Attendance']} />
                            <Line type="monotone" dataKey="percentage" stroke="#8884d8" />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex justify-center items-center h-full text-blue-600">
                          No monthly trend data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Attendance History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                              Event
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                              Notes
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {memberDetails.history && memberDetails.history.length > 0 ? (
                            memberDetails.history.map((record, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {record.date ? format(new Date(record.date), 'PPP') : '-'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {record.event?.title || 'Regular Service'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      record.status === 'present'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {record.status || 'unknown'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-blue-600">{record.notes || '-'}</div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-6 py-4 text-center text-sm text-blue-600">
                                No attendance history available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex justify-center items-center h-64 text-blue-600">
                No member details available. Please select a member from the table view.
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}