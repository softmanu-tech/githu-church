import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Member {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface AttendanceStats {
  present: number;
  absent: number;
  total: number;
  percentage: number;
}

interface MemberAnalytics {
  member: Member;
  attendance: AttendanceStats;
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
  memberAnalytics: MemberAnalytics[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
const TREND_COLORS = {
  improved: '#4CAF50',
  stable: '#2196F3',
  declined: '#F44336',
  'insufficient data': '#9E9E9E'
};

export default function LeaderAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/leader/analytics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Unknown error occurred');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dateRange]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-300">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold">Leader Analytics Dashboard</h1>
            <p className="text-blue-100 text-sm sm:text-base">Analyzing member data...</p>
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

  if (error) {
    return (
      <div className="min-h-screen bg-blue-300 flex items-center justify-center px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md text-center">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-blue-300 flex items-center justify-center px-4">
        <div className="bg-blue-200/90 backdrop-blur-md rounded-lg p-6 border border-blue-300 text-center">
          <p className="text-blue-800">No analytics data available.</p>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const attendanceDistribution = [
    { name: 'Present', value: data.groupStats.averageAttendance },
    { name: 'Absent', value: 100 - data.groupStats.averageAttendance }
  ];

  const memberAttendanceData = data.memberAnalytics.map(item => ({
    name: item.member.name.split(' ')[0], // First name only for chart
    attendance: item.attendance.percentage,
    trend: item.trend
  }));

  const trendDistribution = data.memberAnalytics.reduce((acc, item) => {
    acc[item.trend] = (acc[item.trend] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const trendChartData = Object.entries(trendDistribution).map(([trend, count]) => ({
    name: trend,
    value: count
  }));

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Group Analytics Dashboard</h1>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input
            type="date"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateChange}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.groupStats.totalMembers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.groupStats.totalEvents}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attendance Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.groupStats.totalAttendanceRecords}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.groupStats.averageAttendance}%</div>
            <Progress value={data.groupStats.averageAttendance} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Member Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendanceDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }: any) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
                      >
                        {attendanceDistribution.map((entry, index) => (
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
            
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={trendChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {trendChartData.map((entry) => (
                          <Cell 
                            key={`cell-${entry.name}`} 
                            fill={TREND_COLORS[entry.name as keyof typeof TREND_COLORS]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Member Attendance Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={memberAttendanceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                    <YAxis label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="attendance" name="Attendance %" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Member Details</h3>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="min-w-full bg-white border">
                <thead className="bg-blue-100/50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider bg-blue-100/50 backdrop-blur-sm">Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider bg-blue-100/50 backdrop-blur-sm">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider bg-blue-100/50 backdrop-blur-sm">Attendance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider bg-blue-100/50 backdrop-blur-sm">Trend</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider bg-blue-100/50 backdrop-blur-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.memberAnalytics.map((item) => (
                    <tr key={item.member._id}>
                      <td className="px-6 py-4 whitespace-nowrap">{item.member.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.member.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="mr-2">{item.attendance.percentage}%</span>
                          <Progress value={item.attendance.percentage} className="h-2 w-24" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{ backgroundColor: TREND_COLORS[item.trend as keyof typeof TREND_COLORS] + '20', 
                                  color: TREND_COLORS[item.trend as keyof typeof TREND_COLORS] }}
                        >
                          {item.trend}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a 
                          href={`/leader/member-details/${item.member._id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Details
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Member Attendance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={memberAttendanceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                    <YAxis label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="attendance" 
                      name="Attendance %" 
                      fill="#8884d8" 
                      // Color bars based on trend
                      fillOpacity={0.8}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}