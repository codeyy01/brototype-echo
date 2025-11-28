import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, TrendingUp, Users, FileText } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';

interface TicketStats {
  totalOpen: number;
  resolvedThisMonth: number;
  totalStudents: number;
  byCategory: { name: string; value: number; categoryKey: string }[];
  byStatus: { status: string; count: number }[];
}

// Category color mapping
const CATEGORY_COLORS: Record<string, string> = {
  'academic_labs': '#3b82f6',      // Blue
  'infrastructure_wifi': '#6366f1', // Indigo
  'hostel_mess': '#f97316',        // Orange
  'sanitation_hygiene': '#10b981', // Emerald
  'administrative': '#8b5cf6',     // Purple
  'other': '#94a3b8',              // Gray (default for legacy data)
};

export default function AdminAnalytics() {
  const [stats, setStats] = useState<TicketStats>({
    totalOpen: 0,
    resolvedThisMonth: 0,
    totalStudents: 0,
    byCategory: [],
    byStatus: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Get all tickets
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*');

      if (ticketsError) throw ticketsError;

      // Get all student roles
      const { data: studentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');

      if (rolesError) throw rolesError;

      // Calculate total open tickets (open + in_progress)
      const totalOpen = tickets?.filter(
        (t) => t.status === 'open' || t.status === 'in_progress'
      ).length || 0;

      // Calculate resolved this month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const resolvedThisMonth = tickets?.filter((t) => {
        if (t.status !== 'resolved') return false;
        const updatedDate = new Date(t.updated_at);
        return updatedDate >= firstDayOfMonth;
      }).length || 0;

      // Count total students
      const totalStudents = studentRoles?.length || 0;

      // Group by category with human-readable labels
      const categoryMap: Record<string, number> = {};
      const categoryLabels: Record<string, string> = {
        'academic_labs': 'Academic & Labs',
        'infrastructure_wifi': 'Infrastructure & Wi-Fi',
        'hostel_mess': 'Hostel & Mess',
        'sanitation_hygiene': 'Sanitation & Hygiene',
        'administrative': 'Administrative',
        'other': 'Other',
      };
      
      tickets?.forEach((t) => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + 1;
      });
      const byCategory = Object.entries(categoryMap).map(([name, value]) => ({
        name: categoryLabels[name] || name.charAt(0).toUpperCase() + name.slice(1),
        value,
        categoryKey: name, // Keep original key for color mapping
      }));

      // Group by status for bar chart
      const statusMap: Record<string, number> = {
        open: 0,
        resolved: 0,
      };
      tickets?.forEach((t) => {
        if (t.status === 'open' || t.status === 'in_progress') {
          statusMap.open += 1;
        } else if (t.status === 'resolved') {
          statusMap.resolved += 1;
        }
      });
      const byStatus = [
        { status: 'Open', count: statusMap.open },
        { status: 'Resolved', count: statusMap.resolved },
      ];

      setStats({
        totalOpen,
        resolvedThisMonth,
        totalStudents,
        byCategory,
        byStatus,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">High-level overview of platform health</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Open Tickets</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOpen}</div>
              <p className="text-xs text-muted-foreground">
                Open & In Progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolvedThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleString('default', { month: 'long' })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart: Complaints by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Complaints by Category</CardTitle>
            </CardHeader>
            <CardContent className="w-full h-80">
              <ChartContainer
                config={{
                  academic_labs: {
                    label: 'Academic & Labs',
                    color: '#3b82f6',
                  },
                  infrastructure_wifi: {
                    label: 'Infrastructure & Wi-Fi',
                    color: '#6366f1',
                  },
                  hostel_mess: {
                    label: 'Hostel & Mess',
                    color: '#f97316',
                  },
                  sanitation_hygiene: {
                    label: 'Sanitation & Hygiene',
                    color: '#10b981',
                  },
                  administrative: {
                    label: 'Administrative',
                    color: '#8b5cf6',
                  },
                  other: {
                    label: 'Other',
                    color: '#94a3b8',
                  },
                }}
                className="h-full w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.byCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      dataKey="value"
                    >
                      {stats.byCategory.map((entry) => (
                        <Cell key={`cell-${entry.categoryKey}`} fill={CATEGORY_COLORS[entry.categoryKey] || CATEGORY_COLORS.other} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Bar Chart: Activity Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
            </CardHeader>
            <CardContent className="w-full h-80">
              <ChartContainer
                config={{
                  count: {
                    label: 'Tickets',
                    color: 'hsl(199 89% 48%)',
                  },
                }}
                className="h-full w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.byStatus}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(200 89% 93%)" />
                    <XAxis dataKey="status" stroke="hsl(215 16% 47%)" />
                    <YAxis stroke="hsl(215 16% 47%)" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="count" fill="hsl(199 89% 48%)" name="Tickets" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
