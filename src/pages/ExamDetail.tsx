import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import type { AxiosErrorResponse } from '@/types/api';
import { useAuthStore } from '@/stores/auth-store';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { QuestionFormModal } from '@/components/questions/question-form-modal';
import { QuestionTypeBadge } from '@/components/questions/question-type-badge';
import { useQuestions, useQuestionMutations } from '@/hooks/use-questions';
import type { QuestionType, Question } from '@/types/question';
import { QUESTION_TYPES } from '@/types/question';
import { ArrowLeft, Edit, Trash2, Clock, Calendar, Users, BookOpen, FileText, Loader2, Plus } from 'lucide-react';

import type { Exam } from '@/types/exam';

const ExamDetailSkeleton = () => (
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

export default function ExamDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isStudent = user?.role === 'estudiante';
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const { data: exam, isLoading, isError } = useQuery<Exam>({
    queryKey: ['exam', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/exams/${id}`);
      return response.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/api/exams/${id}`),
    onSuccess: () => {
      toast({
        title: 'Examen eliminado',
        description: 'El examen ha sido eliminado correctamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      navigate('/exams');
    },
    onError: (error: AxiosErrorResponse) => {
      toast({
        title: 'Error al eliminar el examen',
        description: error.response?.data?.message || 'Ocurrió un error inesperado.',
        variant: 'destructive',
      });
    },
  });

  const canManageExam = user?.role === 'admin' || (user?.role === 'docente' && user.id === exam?.course.docenteId);

  const {
    questions,
    isLoading: isLoadingQuestions,
    error: questionsError,
    filters,
    setSearch,
    setTipo,
    setPage,
    pagination,
    invalidateQuestions
  } = useQuestions({ examId: id ?? '', enabled: Boolean(id) && Boolean(user) && canManageExam });

  const { deleteQuestion } = useQuestionMutations(id ?? '', {
    onSuccess: () => {
      invalidateQuestions();
    }
  });

  const questionSummary = useMemo(() => {
    const source = canManageExam ? questions : exam?.questions ?? [];

    if (!source.length) {
      return {
        totalPoints: 0,
        multiChoice: 0,
        code: 0,
        text: 0,
        fileUpload: 0
      } as const;
    }

    return source.reduce(
      (acc, question) => {
        acc.totalPoints += question.puntos;
        switch (question.tipo) {
          case 'multiple_choice':
            acc.multiChoice += 1;
            break;
          case 'code':
            acc.code += 1;
            break;
          case 'text':
            acc.text += 1;
            break;
          case 'file_upload':
            acc.fileUpload += 1;
            break;
          default:
            break;
        }
        return acc;
      },
      {
        totalPoints: 0,
        multiChoice: 0,
        code: 0,
        text: 0,
        fileUpload: 0
      }
    );
  }, [canManageExam, questions, exam?.questions]);

  const handleCreateQuestion = () => {
    setEditingQuestion(null);
    setIsQuestionModalOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setIsQuestionModalOpen(true);
  };

  const handleModalCompleted = () => {
    setIsQuestionModalOpen(false);
    setEditingQuestion(null);
    invalidateQuestions();
  };

  if (isLoading) return <ExamDetailSkeleton />;
  if (isError || !exam) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive">Error al cargar los detalles del examen.</h2>
        <p className="text-muted-foreground">El examen puede no existir o ha ocurrido un error.</p>
        <Button asChild className="mt-4">
          <Link to="/exams">Volver a exámenes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Button variant="outline" onClick={() => navigate('/exams')} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Volver a Exámenes
      </Button>

      <Card className="shadow-card border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div>
              <CardTitle className="text-3xl font-bold">{exam.titulo}</CardTitle>
              <CardDescription className="mt-2 text-lg">
                Parte de <Link to={`/courses/${exam.course.id}`} className="text-primary hover:underline">{exam.course.nombre}</Link>
              </CardDescription>
            </div>
            <Badge variant={exam.isActive ? 'default' : 'destructive'}>
              {exam.isActive ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold">Descripción</h3>
            <p className="text-muted-foreground">{exam.descripcion || 'No se proporcionó una descripción.'}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t pt-6">
            <div>
              <h4 className="font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" /> Apertura</h4>
              <p className="text-muted-foreground pl-6">{new Date(exam.fechaApertura).toLocaleString()}</p>
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" /> Cierre</h4>
              <p className="text-muted-foreground pl-6">{new Date(exam.fechaCierre).toLocaleString()}</p>
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4" /> Duración</h4>
              <p className="text-muted-foreground pl-6">{exam.duracionMinutos} minutos</p>
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Tipo</h4>
              <p className="text-muted-foreground pl-6 capitalize">{exam.tipo}</p>
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4" /> Puntuación Máx.</h4>
              <p className="text-muted-foreground pl-6">{exam.puntuacionMaxima}</p>
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> Intentos</h4>
              <p className="text-muted-foreground pl-6">{exam.intentosPermitidos}</p>
            </div>
          </div>

          {canManageExam && (
            <div className="flex justify-end gap-4 border-t pt-6">
              <Link to={`/exams/${id}/edit`}>
                <Button variant="outline" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Esto eliminará permanentemente el examen y todos sus envíos.
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

      {isStudent && (
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Preguntas del examen</CardTitle>
            <CardDescription>
              Revisa las consignas antes de comenzar. Debes resolver {exam.questions?.length ?? 0} pregunta(s).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {exam.questions && exam.questions.length > 0 ? (
              <div className="space-y-4">
                {exam.questions.map((question, index) => (
                  <div key={question.id} className="rounded-lg border p-4 shadow-sm bg-muted/20">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {index + 1}
                          </span>
                          <h3 className="text-lg font-semibold">
                            {question.title?.trim() || `Pregunta ${index + 1}`}
                          </h3>
                          <Badge variant="secondary" className="capitalize">
                            {question.tipo.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">
                          {question.prompt || 'Consigna no disponible.'}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p><span className="font-semibold text-foreground">{question.puntos}</span> pts</p>
                        {question.pageNumber !== undefined && question.pageNumber !== null && (
                          <p>Hoja {question.pageNumber}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                Este examen aún no tiene preguntas visibles. Contacta a tu docente si crees que es un error.
              </div>
            )}

            {exam.canTakeExam === false && (
              <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm text-warning-foreground">
                No tienes intentos disponibles en este momento. Consulta con tu docente para más información.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {canManageExam && (
        <Card className="shadow-card border-border/50">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Banco de preguntas</CardTitle>
              <CardDescription>
                Gestiona las preguntas que componen este examen. Total actual: {pagination.totalQuestions}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por título o descripción"
                value={filters.search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-60"
              />
              <Select
                value={filters.tipo ?? 'all'}
                onValueChange={(value) => setTipo(value === 'all' ? null : (value as QuestionType))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {QUESTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCreateQuestion} className="gap-2">
                <Plus className="h-4 w-4" /> Nueva pregunta
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {questionsError && (
              <p className="text-sm text-destructive">No fue posible cargar las preguntas. Intenta nuevamente.</p>
            )}

            {isLoadingQuestions ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando preguntas...
              </div>
            ) : questions.length === 0 ? (
              <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                Aún no se han configurado preguntas para este examen.
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((question) => (
                  <div key={question.id} className="rounded-lg border p-4 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-semibold">{question.title}</h4>
                          <QuestionTypeBadge tipo={question.tipo} />
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">{question.prompt}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span>Puntaje: <span className="font-medium text-foreground">{question.puntos}</span></span>
                          <span>Orden: <span className="font-medium text-foreground">{question.orden}</span></span>
                          <span>Página: <span className="font-medium text-foreground">{question.pageNumber}</span></span>
                          {question.rubrics && question.rubrics.length > 0 && (
                            <span>Rúbricas activas: <span className="font-medium text-foreground">{question.rubrics.length}</span></span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditQuestion(question)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar esta pregunta?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción quitará la pregunta del examen. Podrás crear otra más adelante si lo necesitas.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteQuestion.mutate(question.id)}
                                disabled={deleteQuestion.isPending}
                              >
                                {deleteQuestion.isPending ? 'Eliminando...' : 'Eliminar'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
              <span>
                Página {pagination.currentPage} de {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevious || isLoadingQuestions}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext || isLoadingQuestions}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {canManageExam && (
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Resumen rápido</CardTitle>
            <CardDescription>
              Visualiza la distribución de tipos de pregunta y el puntaje total otorgado en el examen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Puntaje total</p>
                <p className="text-2xl font-semibold">{questionSummary.totalPoints.toFixed(2)}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Selección múltiple</p>
                <p className="text-2xl font-semibold">{questionSummary.multiChoice}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Preguntas de código</p>
                <p className="text-2xl font-semibold">{questionSummary.code}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Respuesta abierta</p>
                <p className="text-2xl font-semibold">{questionSummary.text}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Carga de archivo</p>
                <p className="text-2xl font-semibold">{questionSummary.fileUpload}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {canManageExam && (
        <Card className="shadow-card border-dashed border-border/50 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Respuestas de estudiantes</CardTitle>
            <CardDescription>
              Próximamente aquí podrás monitorear envíos, revisar resultados automáticos y agregar retroalimentación manual.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p>
                Estamos preparando la vista de respuestas. Mientras tanto, puedes gestionar el banco de preguntas y las rúbricas.
              </p>
              <Button variant="outline" className="gap-2" disabled>
                Próximamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {canManageExam && (
        <QuestionFormModal
          open={isQuestionModalOpen}
          onOpenChange={(open) => {
            setIsQuestionModalOpen(open);
            if (!open) setEditingQuestion(null);
          }}
          examId={id ?? ''}
          question={editingQuestion}
          onCompleted={handleModalCompleted}
        />
      )}
    </div>
  );
}
