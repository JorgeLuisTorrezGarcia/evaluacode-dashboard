import { useAuthStore } from '@/stores/auth-store';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Upload, Users, TrendingUp, Clock } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuthStore();

  const { data: healthData } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await apiClient.get('/api/health');
      return response.data.data;
    },
  });

  const getRoleGreeting = () => {
    switch (user?.role) {
      case 'admin':
        return 'Administrator Dashboard';
      case 'docente':
        return 'Teacher Dashboard';
      case 'estudiante':
        return 'Student Dashboard';
      default:
        return 'Dashboard';
    }
  };

  const quickActions = user?.role === 'docente' ? [
    { title: 'Create Exam', icon: FileText, href: '/exams/new', color: 'primary' },
    { title: 'Manage Courses', icon: BookOpen, href: '/courses', color: 'success' },
    { title: 'Grade Submissions', icon: TrendingUp, href: '/exams/grade', color: 'warning' },
  ] : user?.role === 'estudiante' ? [
    { title: 'My Courses', icon: BookOpen, href: '/courses', color: 'primary' },
    { title: 'Take Exam', icon: FileText, href: '/exams', color: 'success' },
    { title: 'View Grades', icon: TrendingUp, href: '/grades', color: 'warning' },
  ] : [
    { title: 'Manage Users', icon: Users, href: '/users', color: 'primary' },
    { title: 'All Courses', icon: BookOpen, href: '/courses', color: 'success' },
    { title: 'System Health', icon: TrendingUp, href: '/system', color: 'warning' },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{getRoleGreeting()}</h1>
        <p className="text-muted-foreground mt-2">Welcome back, {user?.email}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">+2 from last month</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Exams</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground mt-1">3 pending review</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground mt-1">+12% from last week</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Grade</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85.4%</div>
            <p className="text-xs text-success mt-1">+5.2% improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.title} to={action.href}>
              <Card className="shadow-card border-border/50 hover:shadow-elegant transition-shadow cursor-pointer group">
                <CardContent className="flex items-center p-6">
                  <div className={`mr-4 rounded-lg p-3 bg-${action.color}/10`}>
                    <action.icon className={`h-6 w-6 text-${action.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest actions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                <div className="rounded-full bg-primary/10 p-2">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Exam submission graded</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      {healthData && (
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current platform health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm">Database: {healthData.services?.database || 'Connected'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-muted" />
                <span className="text-sm">Redis: {healthData.services?.redis || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-muted" />
                <span className="text-sm">AI Engine: {healthData.services?.ai_engine || 'Unknown'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
