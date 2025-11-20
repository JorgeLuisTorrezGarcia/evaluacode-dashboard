import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Trash2, Users, BookOpen } from 'lucide-react';
import apiClient from '@/lib/api-client';
import type { AxiosErrorResponse } from '@/types/api';
import { useAuthStore } from '@/stores/auth-store';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import type { Course } from '@/types/course';
import CourseTabs from '@/components/courses/course-tabs';

const CourseDetailSkeleton = () => (
  <div className="p-8">
    <Skeleton className="h-8 w-48 mb-8" />
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-end gap-4 mt-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: course, isLoading, isError } = useQuery<Course>({
    queryKey: ['course', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/courses/${id}`);
      return response.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/api/courses/${id}`),
    onSuccess: () => {
      toast({
        title: 'Curso eliminado',
        description: 'El curso ha sido eliminado correctamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      navigate('/courses');
    },
    onError: (error: AxiosErrorResponse) => {
      toast({
        title: 'Error al eliminar el curso',
        description: error.response?.data?.message || 'Ocurrió un error inesperado.',
        variant: 'destructive',
      });
    },
  });

  const canManageCourse = user?.role === 'admin' || (user?.role === 'docente' && user.id === course?.docente?.id);

  if (isLoading) return <CourseDetailSkeleton />;
  if (isError || !course) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive">Error al cargar los detalles del curso.</h2>
        <p className="text-muted-foreground">El curso puede no existir o ha ocurrido un error.</p>
        <Button asChild className="mt-4">
          <Link to="/courses">Volver a cursos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Button variant="outline" onClick={() => navigate('/courses')} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Volver a Cursos
      </Button>

      {/* Course Header */}
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div>
              <CardTitle className="text-3xl font-bold">{course.nombre}</CardTitle>
              <CardDescription className="mt-2 text-lg">{course.codigo}</CardDescription>
              {course.descripcion && (
                <p className="text-muted-foreground mt-4">{course.descripcion}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={course.isActive ? 'default' : 'destructive'}>
                {course.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
              {canManageCourse && (
                <div className="flex gap-2">
                  <Link to={`/courses/${id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente el curso.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                          {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Course Tabs */}
      <CourseTabs course={course} />
    </div>
  );
}
