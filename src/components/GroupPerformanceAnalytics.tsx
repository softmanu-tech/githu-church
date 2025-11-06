import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton } from './ui/ultra-fast-skeleton';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/button';
// import { DatePickerWithRange } from './ui/date-range-picker';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface GroupPerformance {
  group: {
    _id: string;
    name: string;
    leader: {
      _id: string;
      name: string;
      email: string;
    } | null;
  };
  stats: {
    memberCount: number;
    eventCount: number;
    attendanceRecordCount: number;
    overallAttendanceRate: number;
    trend: string;
  };
  memberAttendance: Array<{
    member: {
      _id: string;
      name: string;
      email: string;
    };
    attendanceRate: number;
    eventsAttended: number;
    totalEvents: number;
  }>;
  monthlyPatterns: Array<{
    month: string;
    attendanceRate: number;
    presentCount: number;
    totalCount: number;
  }>;
  recentEvents: Array<{
    _id: string;
    title: string;
    date: string;
    attendanceRate: number;
  }>;
}

interface GroupPerformanceData {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  groupPerformance: GroupPerformance[];
}

export default function GroupPerformanceAnalytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GroupPerformanceData | null>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 90)),
    to: new Date(),
  });
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<any | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  useEffect(() => {
    fetchGroupPerformance();
  }, [dateRange]);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupComparison();
    }
  }, [selectedGroup, dateRange]);

  const fetchGroupPerformance = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/bishop/group-performance?startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`
      );
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        if (result.data.groupPerformance.length > 0 && !selectedGroup) {
          setSelectedGroup(result.data.groupPerformance[0].group._id);
        }
      } else {
        console.error('Failed to fetch group performance:', result.error);
      }
    } catch (error) {
      console.error('Error fetching group performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupComparison = async () => {
    setLoadingComparison(true);
    try {
      const response = await fetch(
        `/api/bishop/group-comparison?startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`
      );
      const result = await response.json();
      if (result.success) {
        setComparisonData(result.data);
      } else {
        console.error('Failed to fetch group comparison:', result.error);
      }
    } catch (error) {
      console.error('Error fetching group comparison:', error);
    } finally {
      setLoadingComparison(false);
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-500';
      case 'declining':
        return 'text-red-500';
      default:
        return 'text-blue-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '↑';
      case 'declining':
        return '↓';
      default:
        return '→';
    }
  };

  const getSelectedGroupData = () => {
    if (!data || !selectedGroup) return null;
    return data.groupPerformance.find(g => g.group._id === selectedGroup) || null;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-300">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold">Group Performance Analytics</h1>
            <p className="text-blue-100 text-sm sm:text-base">Analyzing group performance...</p>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <UltraFastCardSkeleton key={i} />
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <UltraFastChartSkeleton />
            <UltraFastChartSkeleton />
          </div>

          {/* Table Skeleton */}
          <UltraFastTableSkeleton />
        </div>
      </div>
    );
  }

  const selectedGroupData = getSelectedGroupData();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Group Performance Analytics</h2>
        {/* <DatePickerWithRange
          date={dateRange}
          setDate={(range) => setDateRange(range)}
        /> */}
      </div>

      {data && data.groupPerformance.length > 0 && (
        <>
          <div className="flex items-center space-x-4">
            <div className="w-[250px]">
              <Select
                value={selectedGroup || ''}
                onValueChange={(value) => setSelectedGroup(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {data.groupPerformance.map((group) => (
                    <SelectItem key={group.group._id} value={group.group._id}>
                      {group.group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedGroupData && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedGroupData.stats.memberCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedGroupData.stats.eventCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedGroupData.stats.overallAttendanceRate}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getTrendColor(selectedGroupData.stats.trend)}`}>
                    {getTrendIcon(selectedGroupData.stats.trend)} {selectedGroupData.stats.trend}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Group Overview</TabsTrigger>
              <TabsTrigger value="members">Member Performance</TabsTrigger>
              <TabsTrigger value="trends">Attendance Trends</TabsTrigger>
              <TabsTrigger value="comparison">Group Comparison</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {selectedGroupData && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Group Leader</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="text-lg font-medium">
                          {selectedGroupData.group.leader ? selectedGroupData.group.leader.name : 'No leader assigned'}
                        </div>
                        <div className="text-sm text-blue-600">
                          {selectedGroupData.group.leader ? selectedGroupData.group.leader.email : ''}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                                Event
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                                Attendance Rate
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedGroupData.recentEvents.map((event) => (
                              <tr key={event._id.toString()}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{event.title}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-blue-600">
                                    {format(new Date(event.date), 'PPP')}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{event.attendanceRate}%</div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Attendance Patterns</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={selectedGroupData.monthlyPatterns}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <XAxis dataKey="month" angle={-45} textAnchor="end" height={70} />
                          <YAxis label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value) => [`${value}%`, 'Attendance Rate']} />
                          <Line type="monotone" dataKey="attendanceRate" stroke="#8884d8" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="members" className="space-y-4">
              {selectedGroupData && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Member Attendance Rates</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={selectedGroupData.memberAttendance}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <XAxis 
                            dataKey="member.name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={70} 
                          />
                          <YAxis label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value) => [`${value}%`, 'Attendance Rate']} />
                          <Bar dataKey="attendanceRate" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Member Attendance Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
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
                                Attendance Rate
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                                Events Attended
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedGroupData.memberAttendance.map((member) => (
                              <tr key={member.member._id.toString()}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{member.member.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-blue-600">{member.member.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{member.attendanceRate}%</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {member.eventsAttended}/{member.totalEvents}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              {selectedGroupData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Present', value: selectedGroupData.monthlyPatterns.reduce((sum, month) => sum + month.presentCount, 0) },
                            { name: 'Absent', value: selectedGroupData.monthlyPatterns.reduce((sum, month) => sum + (month.totalCount - month.presentCount), 0) }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
                          outerRadius={150}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Present', value: 0 },
                            { name: 'Absent', value: 0 }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Count']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              {loadingComparison ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing comparison data...</span>
                </div>
              ) : comparisonData ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Church-wide Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <div className="text-sm font-medium text-blue-600">Total Groups</div>
                          <div className="text-2xl font-bold">{comparisonData.churchStats.totalGroups}</div>
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <div className="text-sm font-medium text-blue-600">Total Members</div>
                          <div className="text-2xl font-bold">{comparisonData.churchStats.totalMembers}</div>
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <div className="text-sm font-medium text-blue-600">Total Events</div>
                          <div className="text-2xl font-bold">{comparisonData.churchStats.totalEvents}</div>
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <div className="text-sm font-medium text-blue-600">Average Attendance</div>
                          <div className="text-2xl font-bold">
                            {Math.round(comparisonData.churchStats.averageGroupAttendanceRate)}%
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Group Comparison</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={comparisonData.groupComparison}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <XAxis 
                            dataKey="group.name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={70} 
                          />
                          <YAxis label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value, name) => {
                            if (name === 'attendanceRate') return [`${value}%`, 'Attendance Rate'];
                            return [value, name];
                          }} />
                          <Bar dataKey="attendanceRate" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Attendance Trends Over Time</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={comparisonData.attendanceTrends}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <XAxis dataKey="month" angle={-45} textAnchor="end" height={70} />
                          <YAxis label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value) => [`${value}%`, 'Attendance Rate']} />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="churchAverage" 
                            stroke="#8884d8" 
                            name="Church Average" 
                          />
                          {selectedGroupData && (
                            <Line 
                              type="monotone" 
                              dataKey={`groupRates[${comparisonData.groupComparison.findIndex(
                                (g: any) => g.group._id === selectedGroupData.group._id
                              )}].attendanceRate`} 
                              stroke="#82ca9d" 
                              name={selectedGroupData.group.name} 
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div>No comparison data available</div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}