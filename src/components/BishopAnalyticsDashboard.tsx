import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface AnalyticsData {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  groupPerformance: GroupPerformance[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

export default function BishopAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 90)),
    endDate: new Date()
  });
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let url = `/api/bishop/group-performance?startDate=${dateRange.startDate.toISOString()}&endDate=${dateRange.endDate.toISOString()}`;
      if (selectedGroup) {
        url += `&groupId=${selectedGroup}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, selectedGroup]);

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-300">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold">Church Analytics</h1>
            <p className="text-blue-100 text-sm sm:text-base">Processing church analytics...</p>
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
  if (error) return (
    <div className="min-h-screen bg-blue-300 flex items-center justify-center px-4">
      <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md text-center">
        <strong>Error:</strong> {error}
      </div>
    </div>
  );
  if (!data) return (
    <div className="min-h-screen bg-blue-300 flex items-center justify-center px-4">
      <div className="bg-blue-200/90 backdrop-blur-md rounded-lg p-6 border border-blue-300 text-center">
        <p className="text-blue-800">No analytics data available</p>
      </div>
    </div>
  );

  // Prepare data for charts
  const groupAttendanceData = data.groupPerformance.map(group => ({
    name: group.group.name,
    attendanceRate: group.stats.overallAttendanceRate
  }));

  const trendCounts = data.groupPerformance.reduce((acc, group) => {
    acc[group.stats.trend] = (acc[group.stats.trend] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const trendData = Object.entries(trendCounts).map(([trend, count]) => ({
    name: trend.charAt(0).toUpperCase() + trend.slice(1),
    value: count
  }));

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Group Performance Analytics</h1>
        
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <span>Group:</span>
            <Select
              value={selectedGroup || 'all'}
              onValueChange={(value) => setSelectedGroup(value === 'all' ? null : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {data.groupPerformance.map(group => (
                  <SelectItem key={group.group._id} value={group.group._id}>
                    {group.group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span>Start:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.startDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRange.startDate}
                  onSelect={(date: any) => date && setDateRange({ ...dateRange, startDate: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex items-center space-x-2">
            <span>End:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.endDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRange.endDate}
                  onSelect={(date: any) => date && setDateRange({ ...dateRange, endDate: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="groups">Group Comparison</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.groupPerformance.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.groupPerformance.reduce((sum, group) => sum + group.stats.memberCount, 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.groupPerformance.reduce((sum, group) => sum + group.stats.eventCount, 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    data.groupPerformance.reduce((sum, group) => sum + group.stats.overallAttendanceRate, 0) / 
                    data.groupPerformance.length
                  )}%
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Group Attendance Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={groupAttendanceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="attendanceRate" fill="#8884d8" name="Attendance %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Group Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={trendData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {trendData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <CardTitle>Group Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>Group performance statistics</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Group Name</TableHead>
                    <TableHead>Leader</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Attendance Rate</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.groupPerformance.map((group) => (
                    <TableRow key={group.group._id}>
                      <TableCell className="font-medium">{group.group.name}</TableCell>
                      <TableCell>{group.group.leader?.name || 'No Leader'}</TableCell>
                      <TableCell>{group.stats.memberCount}</TableCell>
                      <TableCell>{group.stats.eventCount}</TableCell>
                      <TableCell>{group.stats.overallAttendanceRate}%</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          group.stats.trend === 'improving' ? 'bg-green-100 text-green-800' :
                          group.stats.trend === 'declining' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {group.stats.trend.charAt(0).toUpperCase() + group.stats.trend.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/bishop/group-details/${group.group._id}`}>
                            View Details
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    {/* This would be populated with time-series data from the API */}
                    <Line type="monotone" dataKey="attendanceRate" stroke="#8884d8" name="Church Average" />
                    {data.groupPerformance.slice(0, 5).map((group, index) => (
                      <Line 
                        key={group.group._id}
                        type="monotone" 
                        dataKey={`groupRates[${index}].attendanceRate`}
                        stroke={COLORS[index % COLORS.length]}
                        name={group.group.name}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}