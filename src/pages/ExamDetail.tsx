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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Edit, Trash2, Clock, Calendar, Users, BookOpen, FileText, Loader2, Plus, ArrowRightCircle, AlertCircle, ExternalLink } from 'lucide-react';

import type { Exam, ExamQuestion, ExamSubmission, ExamSubmissionAnswer } from '@/types/exam';

type QuestionLookup = Record<string, (ExamQuestion & { index: number })>;
type SubmissionWithAttempt = ExamSubmission & { attemptNumber: number };

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

  const canStartAttempt = isStudent && Boolean(exam?.canTakeExam);

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

  const questionLookup = useMemo<QuestionLookup>(() => {
    if (!exam?.questions?.length) return {};

    return exam.questions.reduce((acc, question, index) => {
      acc[question.id] = { ...question, index: index + 1 };
      return acc;
    }, {} as QuestionLookup);
  }, [exam?.questions]);

  const submissionsWithAttempts = useMemo<SubmissionWithAttempt[]>(() => {
    if (!canManageExam || !exam?.submissions?.length) return [];

    const sorted = [...exam.submissions].sort(
      (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    );

    return sorted.map((submission, index) => ({
      ...submission,
      attemptNumber: index + 1
    }));
  }, [canManageExam, exam?.submissions]);

  const submissionsDisplay = useMemo(() => [...submissionsWithAttempts].reverse(), [submissionsWithAttempts]);

  const submissionStats = useMemo(() => {
    if (submissionsWithAttempts.length === 0) {
      return {
        total: 0,
        graded: 0,
        averagePercent: null as number | null,
        latestSubmittedAt: null as string | null
      };
    }

    const gradedSubmissions = submissionsWithAttempts.filter(
      (submission) => typeof submission.finalScore === 'number' && typeof submission.maxScore === 'number'
    );

    const totalScore = gradedSubmissions.reduce((sum, submission) => sum + (submission.finalScore ?? 0), 0);
    const totalMaxScore = gradedSubmissions.reduce((sum, submission) => sum + (submission.maxScore ?? 0), 0);

    const averagePercent = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : null;

    return {
      total: submissionsWithAttempts.length,
      graded: gradedSubmissions.length,
      averagePercent,
      latestSubmittedAt: submissionsWithAttempts[submissionsWithAttempts.length - 1]?.submittedAt ?? null
    };
  }, [submissionsWithAttempts]);

  const renderAnswerContent = useMemo(
    () =>
      function renderAnswerContent(answer: ExamSubmissionAnswer) {
        const question = questionLookup[answer.questionId];

        if (!answer.rawText) {
          return <span className="text-muted-foreground italic">Sin respuesta enviada.</span>;
        }

        if (!question) {
          return <p className="whitespace-pre-wrap text-sm text-foreground">{answer.rawText}</p>;
        }

        if (question.tipo === 'file_upload') {
          try {
            const files = JSON.parse(answer.rawText) as Array<{
              url?: string;
              secureUrl?: string;
              publicId?: string;
              name?: string;
              originalFilename?: string;
            }>;

            if (Array.isArray(files) && files.length > 0) {
              return (
                <ul className="space-y-2 text-sm">
                  {files.map((file, index) => {
                    const link = file.url ?? file.secureUrl;
                    const label = file.name ?? file.originalFilename ?? `Archivo ${index + 1}`;

                    return link ? (
                      <li key={`${file.publicId ?? link}-${index}`}>
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {label}
                        </a>
                      </li>
                    ) : (
                      <li key={`${file.publicId ?? label}-${index}`} className="text-muted-foreground">
                        {label}
                      </li>
                    );
                  })}
                </ul>
              );
            }
          } catch (error) {
            // Si falla el parseo mostramos el contenido crudo
          }

          return <p className="whitespace-pre-wrap text-sm text-foreground">{answer.rawText}</p>;
        }

        if (question.tipo === 'multiple_choice') {
          const options = question.config?.options ?? [];

          try {
            const parsed = JSON.parse(answer.rawText);
            const values: string[] = Array.isArray(parsed)
              ? parsed
              : typeof parsed === 'string'
              ? [parsed]
              : [];

            if (values.length > 0) {
              return (
                <div className="flex flex-wrap gap-2">
                  {values.map((value) => {
                    const option = options.find((opt) => opt.value === value);
                    return (
                      <Badge key={value} variant="secondary" className="capitalize">
                        {option?.label ?? value}
                      </Badge>
                    );
                  })}
                </div>
              );
            }
          } catch (error) {
            // No es JSON, usamos el texto crudo
          }

          const option = options.find((opt) => opt.value === answer.rawText);
          return (
            <Badge variant="secondary" className="capitalize">
              {option?.label ?? answer.rawText}
            </Badge>
          );
        }

        if (question.tipo === 'code') {
          return (
            <pre className="mt-2 max-h-[320px] overflow-auto rounded-md bg-muted p-3 text-sm font-mono whitespace-pre-wrap">{answer.rawText}</pre>
          );
        }

        return <p className="whitespace-pre-wrap text-sm text-foreground">{answer.rawText}</p>;
      },
    [questionLookup]
  );

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
          {isStudent && (
            <div className="flex flex-col gap-2 sm:items-end">
              <Button
                size="lg"
                className="gap-2"
                disabled={!exam.canTakeExam}
                onClick={() => navigate(`/exams/${id}/tomar`)}
              >
                <ArrowRightCircle className="h-4 w-4" />
                {exam.canTakeExam ? 'Comenzar intento' : 'Sin intentos disponibles'}
              </Button>
              {!exam.canTakeExam && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  Has alcanzado el máximo de intentos o el examen no está activo.
                </div>
              )}
            </div>
          )}
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
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Respuestas de estudiantes</CardTitle>
            <CardDescription>
              Monitorea los envíos realizados y revisa cada respuesta para retroalimentar o calificar manualmente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total de envíos</p>
                <p className="text-2xl font-semibold">{submissionStats.total}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Último envío</p>
                <p className="text-sm font-semibold text-foreground">
                  {submissionStats.latestSubmittedAt
                    ? new Date(submissionStats.latestSubmittedAt).toLocaleString()
                    : 'Sin envíos'}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Calificados</p>
                <p className="text-2xl font-semibold">{submissionStats.graded}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Promedio (calificados)</p>
                <p className="text-2xl font-semibold">
                  {submissionStats.graded > 0 && submissionStats.averagePercent !== null
                    ? `${submissionStats.averagePercent.toFixed(1)}%`
                    : '—'}
                </p>
              </div>
            </div>

            {submissionsDisplay.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-muted/40 p-8 text-center text-muted-foreground">
                Aún no se registran envíos. Cuando los estudiantes envíen sus respuestas aparecerán aquí.
              </div>
            ) : (
              <Accordion type="single" collapsible className="divide-y rounded-lg border">
                {submissionsDisplay.map((submission) => {
                  const answers = [...submission.answers].sort((a, b) => {
                    const orderA = questionLookup[a.questionId]?.index ?? 0;
                    const orderB = questionLookup[b.questionId]?.index ?? 0;
                    return orderA - orderB;
                  });
                  const isGraded = typeof submission.finalScore === 'number' && typeof submission.maxScore === 'number';

                  return (
                    <AccordionItem key={submission.id} value={submission.id} className="border-0">
                      <AccordionTrigger className="px-4 py-3 text-left">
                        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap items-center gap-2 text-left">
                            <Badge variant="secondary">Intento {submission.attemptNumber}</Badge>
                            <span className="font-semibold text-foreground">
                              {submission.student?.email ?? 'Estudiante desconocido'}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:items-end">
                            <span>{new Date(submission.submittedAt).toLocaleString()}</span>
                            {isGraded ? (
                              <span className="font-semibold text-foreground">
                                {submission.finalScore.toFixed(2)} / {submission.maxScore.toFixed(2)} pts
                              </span>
                            ) : (
                              <span>Pendiente de calificar</span>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 px-4 pb-4">
                          {answers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No se registraron respuestas.</p>
                          ) : (
                            answers.map((answer) => {
                              const question = questionLookup[answer.questionId];
                              return (
                                <div key={answer.id} className="rounded-lg border bg-muted/30 p-4">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="space-y-1">
                                      <p className="text-sm font-semibold text-foreground">
                                        Pregunta {question?.index ?? '?'}: {question?.title ?? 'Sin título'}
                                      </p>
                                      {question?.prompt && (
                                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                          {question.prompt}
                                        </p>
                                      )}
                                    </div>
                                    {question && (
                                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <Badge variant="outline" className="capitalize">
                                          {question.tipo.replace('_', ' ')}
                                        </Badge>
                                        <span>{question.puntos} pts</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-3 text-sm text-foreground">{renderAnswerContent(answer)}</div>
                                </div>
                              );
                            })
                          )}
                          <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                              {isGraded
                                ? 'Este intento ya cuenta con una calificación registrada.'
                                : 'Este intento está pendiente de evaluación manual.'}
                            </p>
                            <Button
                              variant={isGraded ? 'secondary' : 'default'}
                              className="gap-2"
                              onClick={() => navigate(`/exams/${id}/submissions/${submission.id}/review`)}
                            >
                              <ExternalLink className="h-4 w-4" />
                              {isGraded ? 'Ver evaluación' : 'Evaluar intento'}
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
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
