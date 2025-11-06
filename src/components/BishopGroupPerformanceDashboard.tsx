import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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

interface Leader {
  _id: string;
  name: string;
  email: string;
}

interface Group {
  _id: string;
  name: string;
  leader: Leader;
}

interface GroupStats {
  memberCount: number;
  eventCount: number;
  attendanceRecordCount: number;
  overallAttendanceRate: number;
  trend: string;
}

interface MemberAttendance {
  member: {
    _id: string;
    name: string;
    email: string;
  };
  attendanceRate: number;
  eventsAttended: number;
  totalEvents: number;
}

interface MonthlyPattern {
  month: string;
  attendanceRate: number;
  presentCount: number;
  totalCount: number;
}

interface RecentEvent {
  _id: string;
  title: string;
  date: string;
  attendanceRate: number;
}

interface GroupPerformance {
  group: Group;
  stats: GroupStats;
  memberAttendance: MemberAttendance[];
  monthlyPatterns: MonthlyPattern[];
  recentEvents: RecentEvent[];
}

interface PerformanceData {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  groupPerformance: GroupPerformance[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];
const TREND_COLORS = {
  improving: '#4CAF50',
  stable: '#2196F3',
  declining: '#F44336'
};

export default function BishopGroupPerformanceDashboard() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const url = new URL('/api/bishop/group-performance', window.location.origin);
        url.searchParams.append('startDate', dateRange.startDate);
        url.searchParams.append('endDate', dateRange.endDate);
        if (selectedGroup) {
          url.searchParams.append('groupId', selectedGroup);
        }
        
        const response = await fetch(url.toString());
        
        if (!response.ok) {
          throw new Error('Failed to fetch group performance data');
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
  }, [dateRange, selectedGroup]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGroup(e.target.value || null);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading performance data...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  if (!data || data.groupPerformance.length === 0) {
    return <div className="p-4">No group performance data available.</div>;
  }

  // Prepare data for charts
  const groupAttendanceData = data.groupPerformance.map(item => ({
    name: item.group.name,
    attendanceRate: item.stats.overallAttendanceRate,
    trend: item.stats.trend,
    memberCount: item.stats.memberCount,
    eventCount: item.stats.eventCount
  }));

  // Get the selected group's data or the first group if none selected
  const selectedGroupData = selectedGroup 
    ? data.groupPerformance.find(g => g.group._id === selectedGroup) 
    : data.groupPerformance[0];

  if (!selectedGroupData) {
    return <div className="p-4">Selected group data not available.</div>;
  }

  const monthlyData = selectedGroupData.monthlyPatterns.map(item => ({
    name: item.month,
    attendanceRate: item.attendanceRate
  }));

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Group Performance Dashboard</h1>
      
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
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Select Group</label>
          <select
            value={selectedGroup || ''}
            onChange={handleGroupChange}
            className="w-full p-2 border rounded"
          >
            <option value="">All Groups</option>
            {data.groupPerformance.map(group => (
              <option key={group.group._id} value={group.group._id}>
                {group.group.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
      
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Group Overview</TabsTrigger>
          <TabsTrigger value="details">Group Details</TabsTrigger>
          <TabsTrigger value="trends">Attendance Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Group Attendance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={groupAttendanceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                    <YAxis label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="attendanceRate" 
                      name="Attendance %" 
                      fill="#8884d8" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Group Performance Summary</h3>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="min-w-full bg-white border">
                <thead className="bg-blue-100/50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider bg-blue-100/50 backdrop-blur-sm">Group</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider bg-blue-100/50 backdrop-blur-sm">Leader</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider bg-blue-100/50 backdrop-blur-sm">Members</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider bg-blue-100/50 backdrop-blur-sm">Events</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider bg-blue-100/50 backdrop-blur-sm">Attendance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider bg-blue-100/50 backdrop-blur-sm">Trend</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider bg-blue-100/50 backdrop-blur-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.groupPerformance.map((group) => (
                    <tr key={group.group._id}>
                      <td className="px-6 py-4 whitespace-nowrap">{group.group.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{group.group.leader?.name || 'No Leader'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{group.stats.memberCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{group.stats.eventCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="mr-2">{group.stats.overallAttendanceRate}%</span>
                          <Progress value={group.stats.overallAttendanceRate} className="h-2 w-24" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{ 
                            backgroundColor: TREND_COLORS[group.stats.trend as keyof typeof TREND_COLORS] + '20', 
                            color: TREND_COLORS[group.stats.trend as keyof typeof TREND_COLORS] 
                          }}
                        >
                          {group.stats.trend}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => setSelectedGroup(group.group._id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>{selectedGroupData.group.name} - Monthly Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="attendanceRate" 
                        name="Attendance %" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{selectedGroupData.group.name} - Recent Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-y-auto h-80">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Event</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Attendance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedGroupData.recentEvents.map((event) => (
                        <tr key={event._id}>
                          <td className="px-4 py-2 whitespace-nowrap">{event.title}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {new Date(event.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="mr-2">{event.attendanceRate}%</span>
                              <Progress value={event.attendanceRate} className="h-2 w-16" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>{selectedGroupData.group.name} - Member Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Attendance Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Events Attended</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Total Events</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedGroupData.memberAttendance.map((member) => (
                      <tr key={member.member._id}>
                        <td className="px-6 py-4 whitespace-nowrap">{member.member.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{member.member.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="mr-2">{member.attendanceRate}%</span>
                            <Progress value={member.attendanceRate} className="h-2 w-24" />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{member.eventsAttended}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{member.totalEvents}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Group Attendance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={groupAttendanceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                    <YAxis label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="attendanceRate" 
                      name="Attendance %" 
                      fill="#8884d8" 
                    />
                    <Bar 
                      dataKey="memberCount" 
                      name="Member Count" 
                      fill="#82ca9d" 
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