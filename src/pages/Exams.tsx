import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, Clock } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useState } from 'react';

interface Exam {
  id: string;
  title: string;
  description: string;
  courseId: string;
  status: 'draft' | 'active' | 'closed';
  duration: number;
  totalPoints: number;
  createdAt: string;
  course?: {
    name: string;
    code: string;
  };
}

export default function Exams() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');

  const { data: examsData, isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const response = await apiClient.get('/api/exams');
      return response.data.data;
    },
  });

  const filteredExams = examsData?.exams?.filter((exam: Exam) =>
    exam.title.toLowerCase().includes(search.toLowerCase()) ||
    exam.course?.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const canCreateExam = user?.role === 'admin' || user?.role === 'docente';

  const getStatusColor = (status: Exam['status']) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'draft':
        return 'bg-warning text-warning-foreground';
      case 'closed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exams</h1>
          <p className="text-muted-foreground mt-2">View and manage your exams</p>
        </div>
        {canCreateExam && (
          <Link to="/exams/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Exam
            </Button>
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search exams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Exams List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shadow-card border-border/50 animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : filteredExams.length === 0 ? (
        <Card className="shadow-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No exams found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search ? 'Try adjusting your search' : 'Get started by creating your first exam'}
            </p>
            {canCreateExam && !search && (
              <Link to="/exams/new">
                <Button>Create Exam</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredExams.map((exam: Exam) => (
            <Link key={exam.id} to={`/exams/${exam.id}`}>
              <Card className="shadow-card border-border/50 hover:shadow-elegant transition-all cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <CardTitle className="group-hover:text-primary transition-colors">
                          {exam.title}
                        </CardTitle>
                      </div>
                      <CardDescription className="line-clamp-2 ml-11">
                        {exam.description}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(exam.status)}>
                      {exam.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground ml-11">
                    {exam.course && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{exam.course.code}</span>
                        <span>-</span>
                        <span>{exam.course.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{exam.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{exam.totalPoints} points</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
