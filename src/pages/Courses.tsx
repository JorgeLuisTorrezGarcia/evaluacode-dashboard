import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CourseFilters } from '@/components/courses/course-filters';
import { CourseTable } from '@/components/courses/course-table';
import { CoursePagination } from '@/components/courses/course-pagination';
import { useCourses } from '@/hooks/use-courses';
import { useToast } from '@/hooks/use-toast';

export default function Courses() {
  const { toast } = useToast();
  const {
    courses,
    totalPages,
    currentPage,
    totalCourses,
    isLoading,
    isError,
    error,
    filters,
    updateFilters,
    updateSearch,
    updatePage,
    resetFilters,
  } = useCourses();

  // Show error message
  React.useEffect(() => {
    if (isError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error?.message ||
          'Error al cargar los cursos. Por favor, inténtalo de nuevo.',
      });
    }
  }, [isError, error, toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cursos</h1>
          <p className="text-muted-foreground">
            Gestiona los cursos disponibles en la plataforma.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Cursos</CardTitle>
          <CardDescription>
            {totalCourses} cursos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CourseFilters
            filters={filters}
            onSearchChange={updateSearch}
            onFilterChange={updateFilters}
            onResetFilters={resetFilters}
          />
          
          <CourseTable
            courses={courses}
            isLoading={isLoading}
          />
          
          <CoursePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={updatePage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
