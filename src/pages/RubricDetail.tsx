import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/auth-store';
import type { AxiosErrorResponse } from '@/types/api';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Edit, Trash2, ClipboardList } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Criterion {
  id: string;
  titulo: string;
  descripcion: string;
  puntajeMaximo: number;
}

interface Rubric {
  id: string;
  nombre: string;
  descripcion: string;
  exam: {
    id: string;
    titulo: string;
    course: {
      docenteId: string;
    }
  };
  criterios: Criterion[];
}

const RubricDetailSkeleton = () => (
  <div className="p-8">
    <Skeleton className="h-8 w-48 mb-8" />
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4 mt-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  </div>
);

export default function RubricDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: rubric, isLoading, isError } = useQuery<Rubric>({
    queryKey: ['rubric', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/rubrics/${id}`);
      return response.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/api/rubrics/${id}`),
    onSuccess: () => {
      toast({
        title: 'Rúbrica eliminada',
        description: 'La rúbrica ha sido eliminada correctamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['rubrics'] });
      navigate('/rubrics');
    },
    onError: (error: AxiosErrorResponse) => {
      toast({
        title: 'Error al eliminar la rúbrica',
        description: error.response?.data?.message || 'Ocurrió un error inesperado.',
        variant: 'destructive',
      });
    },
  });

  const canManage = user?.role === 'admin' || (user?.role === 'docente' && user.id === rubric?.exam.course.docenteId);

  if (isLoading) return <RubricDetailSkeleton />;
  if (isError || !rubric) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive">Error al cargar los detalles de la rúbrica.</h2>
        <p className="text-muted-foreground">La rúbrica puede no existir o ha ocurrido un error.</p>
        <Button asChild className="mt-4">
          <Link to="/rubrics">Volver a Rúbricas</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Button variant="outline" onClick={() => navigate('/rubrics')} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Volver a Rúbricas
      </Button>

      <Card className="shadow-card border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div>
              <CardTitle className="text-3xl font-bold">{rubric.nombre}</CardTitle>
              <CardDescription className="mt-2 text-lg">
                Asociada al examen: <Link to={`/exams/${rubric.exam.id}`} className="text-primary hover:underline">{rubric.exam.titulo}</Link>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold">Descripción</h3>
            <p className="text-muted-foreground">{rubric.descripcion || 'No se proporcionó una descripción.'}</p>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-4">Criterios de Evaluación</h3>
            <div className="space-y-4">
              {rubric.criterios.length > 0 ? (
                rubric.criterios.map((criterion) => (
                  <div key={criterion.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold">{criterion.titulo}</h4>
                      <span className="font-bold text-primary">{criterion.puntajeMaximo} pts</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{criterion.descripcion}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No hay criterios definidos para esta rúbrica.</p>
              )}
            </div>
          </div>

          {canManage && (
            <div className="flex justify-end gap-4 border-t pt-6">
              <Link to={`/rubrics/${id}/edit`}>
                <Button variant="outline" className="flex items-center gap-2" asChild>
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" onClick={() => deleteMutation.mutate()} className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Esto eliminará permanentemente la rúbrica.
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
        </CardContent>
      </Card>
    </div>
  );
}
