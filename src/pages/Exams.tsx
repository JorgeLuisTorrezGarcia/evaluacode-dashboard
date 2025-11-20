import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExamFilters } from '@/components/exams/exam-filters';
import { ExamTable } from '@/components/exams/exam-table';
import { ExamPagination } from '@/components/exams/exam-pagination';
import { useExams } from '@/hooks/use-exams';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/use-toast';

export default function Exams() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const {
    exams,
    totalPages,
    currentPage,
    totalExams,
    isLoading,
    isError,
    error,
    filters,
    updateFilters,
    updateSearch,
    updatePage,
    resetFilters,
  } = useExams();

  const canCreateExam = user?.role === 'admin' || user?.role === 'docente';

  React.useEffect(() => {
    if (isError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Error al cargar los exámenes',
      });
    }
  }, [isError, error, toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exámenes</h1>
          <p className="text-muted-foreground">
            Gestiona los exámenes disponibles en la plataforma.
          </p>
        </div>
        {canCreateExam && (
          <Link to="/exams/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo examen
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Exámenes</CardTitle>
          <CardDescription>
            {totalExams} exámenes encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExamFilters
            filters={filters}
            onSearchChange={updateSearch}
            onFilterChange={updateFilters}
            onResetFilters={resetFilters}
          />
          
          <ExamTable
            exams={exams}
            isLoading={isLoading}
          />
          
          <ExamPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={updatePage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
