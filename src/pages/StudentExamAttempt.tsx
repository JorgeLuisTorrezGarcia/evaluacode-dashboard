import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, AlertCircle, ArrowLeft, Loader2, BookOpen, Award } from 'lucide-react';

import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { Exam, ExamQuestion, QuestionDraft, SubmitExamPayload } from '@/types/exam';
import type { UploadedFile } from '@/types/upload';
import { toast } from '@/hooks/use-toast';
import { useUploadFile, useDeleteUpload } from '@/hooks/use-upload';
import { useSubmitExam } from '@/hooks/use-submit-exam';
import { StudentQuestionResponse } from '@/components/exams/StudentQuestionResponse';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { QuestionTypeBadge } from '@/components/questions/question-type-badge';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog';

const ATTEMPT_STORAGE_PREFIX = 'examAttempt:v1:';

const getStorageKey = (examId: string) => `${ATTEMPT_STORAGE_PREFIX}${examId}`;

interface StoredAttemptState {
  startedAt?: string;
  drafts?: Record<string, QuestionDraft>;
}

const loadStoredAttempt = (storageKey: string): StoredAttemptState | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredAttemptState;
    return parsed;
  } catch (error) {
    window.localStorage.removeItem(storageKey);
    return null;
  }
};

const persistAttempt = (storageKey: string, state: StoredAttemptState) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(state));
};

const StudentExamAttemptSkeleton = () => (
  <div className="p-4 sm:p-6 lg:p-8 space-y-6">
    <Skeleton className="h-10 w-64" />
    <Card className="shadow-card">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-6 w-32" />
      </CardContent>
    </Card>
    <Card className="shadow-card">
      <CardHeader>
        <Skeleton className="h-6 w-56" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  </div>
);

const formatTimeLeft = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (value: number) => value.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(minutes)}:${pad(seconds)}`;
};

const INITIAL_TIME_MS = 0;

const StudentExamAttempt = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const storageKey = id ? getStorageKey(id) : null;

  const [startedAt, setStartedAt] = useState<Date | null>(() => {
    if (!storageKey) return null;
    const stored = loadStoredAttempt(storageKey);
    return stored?.startedAt ? new Date(stored.startedAt) : null;
  });
  const [drafts, setDrafts] = useState<Record<string, QuestionDraft>>(() => {
    if (!storageKey) return {};
    const stored = loadStoredAttempt(storageKey);
    return stored?.drafts ?? {};
  });
  const [uploadingQuestionId, setUploadingQuestionId] = useState<string | null>(null);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const [hasTriggeredAutoSubmit, setHasTriggeredAutoSubmit] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  const { data: exam, isLoading, isError } = useQuery<Exam>({
    queryKey: ['exam', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/exams/${id}`);
      return response.data.data;
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  });

  const durationMs = useMemo(() => (exam?.duracionMinutos ?? 0) * 60_000, [exam?.duracionMinutos]);
  const [timeLeft, setTimeLeft] = useState<number>(INITIAL_TIME_MS);
  const uploadMutation = useUploadFile();
  const deleteMutation = useDeleteUpload();
  const submitMutation = useSubmitExam(id, {
    onSuccess: () => {
      if (storageKey) {
        window.localStorage.removeItem(storageKey);
      }
      setDrafts({});
      setStartedAt(null);
      setAutoSubmitting(false);
      navigate(`/exams/${id}`, { replace: true });
    },
    onError: () => {
      setAutoSubmitting(false);
      setHasTriggeredAutoSubmit(false);
    }
  });

  const persistState = useCallback(() => {
    if (!storageKey) return;
    persistAttempt(storageKey, {
      startedAt: startedAt ? startedAt.toISOString() : undefined,
      drafts
    });
  }, [storageKey, startedAt, drafts]);

  useEffect(() => {
    persistState();
  }, [persistState]);

  const prepareAnswer = useCallback((question: ExamQuestion, draft?: QuestionDraft) => {
    switch (question.tipo) {
      case 'multiple_choice': {
        if (question.config?.allowMultiple) {
          const values = Array.isArray(draft?.value) ? draft?.value.filter(Boolean) : [];
          return {
            response: values.length ? JSON.stringify(values) : null,
            attachments: [] as string[]
          };
        }
        const value = typeof draft?.value === 'string' ? draft.value.trim() : '';
        return {
          response: value ? value : null,
          attachments: [] as string[]
        };
      }
      case 'file_upload': {
        const files = draft?.files ?? [];
        return {
          response: files.length
            ? JSON.stringify(
                files.map((file) => ({
                  publicId: file.publicId,
                  url: file.secureUrl,
                  name: file.originalFilename ?? file.publicId
                }))
              )
            : null,
          attachments: files.map((file) => file.secureUrl)
        };
      }
      case 'text':
      case 'code':
      default: {
        const value = typeof draft?.value === 'string' ? draft.value.trim() : '';
        return {
          response: value ? value : null,
          attachments: [] as string[]
        };
      }
    }
  }, []);

  const handleDraftChange = useCallback((updatedDraft: QuestionDraft) => {
    setDrafts((prev) => ({
      ...prev,
      [updatedDraft.questionId]: {
        ...updatedDraft,
        questionId: updatedDraft.questionId
      }
    }));
  }, []);

  const handleUploadFile = useCallback(
    async (question: ExamQuestion, file: File) => {
      if (!id) return;
      setUploadingQuestionId(question.id);
      try {
        const uploaded = await uploadMutation.mutateAsync({ file, examId: id });
        setDrafts((prev) => {
          const current = prev[question.id] ?? {
            questionId: question.id,
            value:
              question.tipo === 'multiple_choice' && question.config?.allowMultiple
                ? []
                : ''
          };
          const files = current.files ?? [];
          return {
            ...prev,
            [question.id]: {
              ...current,
              files: [...files, uploaded]
            }
          };
        });
      } finally {
        setUploadingQuestionId(null);
      }
    },
    [id, uploadMutation]
  );

  const handleRemoveFile = useCallback(
    async (questionId: string, file: UploadedFile) => {
      try {
        await deleteMutation.mutateAsync({ publicId: file.publicId });
        setDrafts((prev) => {
          const current = prev[questionId];
          if (!current) return prev;
          const files = (current.files ?? []).filter((item) => item.publicId !== file.publicId);
          return {
            ...prev,
            [questionId]: {
              ...current,
              files
            }
          };
        });
      } catch (error) {
        // El hook ya muestra un toast, solo mantenemos el estado
      }
    },
    [deleteMutation]
  );

  const handleSubmit = useCallback(
    (options?: { auto?: boolean }) => {
      if (!exam || submitMutation.isPending) {
        return;
      }

      const missingLabels: string[] = [];
      const answers: SubmitExamPayload['answers'] = [];
      const attachments: string[] = [];

      exam.questions?.forEach((question, index) => {
        const draft = drafts[question.id];
        const { response, attachments: questionAttachments } = prepareAnswer(question, draft);

        if (!response) {
          missingLabels.push(`Pregunta ${index + 1}`);
          return;
        }

        if (questionAttachments?.length) {
          attachments.push(...questionAttachments);
        }

        answers.push({
          questionId: question.id,
          response,
          timeSpent: draft?.timeSpent
        });
      });

      if (missingLabels.length > 0) {
        toast({
          title: 'Faltan respuestas',
          description: `Completa: ${missingLabels.join(', ')}`,
          variant: 'destructive'
        });
        setAutoSubmitting(false);
        return;
      }

      const totalTimeSpent = startedAt ? Math.round((Date.now() - startedAt.getTime()) / 1000) : undefined;

      const payload: SubmitExamPayload = {
        answers,
        totalTimeSpent,
        ...(attachments.length ? { additionalFiles: Array.from(new Set(attachments)) } : {})
      };

      submitMutation.mutate(payload);
    },
    [drafts, exam, prepareAnswer, startedAt, submitMutation]
  );

  const summary = useMemo(() => {
    if (!exam?.questions?.length) {
      return {
        totalPoints: 0,
        questionCount: 0
      } as const;
    }

    return exam.questions.reduce(
      (acc, question) => {
        acc.totalPoints += question.puntos;
        acc.questionCount += 1;
        return acc;
      },
      {
        totalPoints: 0,
        questionCount: 0
      }
    );
  }, [exam?.questions]);

  const hasTimeLimit = durationMs > 0;

  useEffect(() => {
    if (!durationMs) {
      setTimeLeft(durationMs);
      return;
    }

    if (!startedAt) {
      setTimeLeft(durationMs);
      return;
    }

    const updateTime = () => {
      const elapsed = Date.now() - startedAt.getTime();
      setTimeLeft(Math.max(durationMs - elapsed, 0));
    };

    updateTime();
    const intervalId = window.setInterval(() => {
      updateTime();
      if (hasTimeLimit && startedAt) {
        const elapsed = Date.now() - startedAt.getTime();
        if (elapsed >= durationMs && !hasTriggeredAutoSubmit && !submitMutation.isPending) {
          setHasTriggeredAutoSubmit(true);
          setAutoSubmitting(true);
          handleSubmit({ auto: true });
        }
      }
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [durationMs, startedAt, hasTimeLimit, hasTriggeredAutoSubmit, submitMutation.isPending, handleSubmit]);

  // Handle exam availability and start time initialization
  useEffect(() => {
    if (!exam || !storageKey) return;

    if (!startedAt) {
      if (!exam.canTakeExam) {
        toast({
          title: 'No puedes iniciar este examen',
          description: 'Has alcanzado el máximo de intentos o el examen no está disponible.',
          variant: 'destructive'
        });
        navigate(`/exams/${id}`, { replace: true });
        return;
      }

      const now = new Date();
      setStartedAt(now);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, JSON.stringify({ startedAt: now.toISOString(), drafts }));
      }
    }
  }, [exam, startedAt, storageKey, navigate, id, drafts]);

  // Warn user before leaving tab/window if there are pending drafts
  useEffect(() => {
    if (!storageKey) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (submitMutation.isPending) return;
      const hasDrafts = Object.keys(drafts).length > 0;
      if (hasDrafts) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [drafts, storageKey, submitMutation.isPending]);

  useEffect(() => {
    if (!exam?.titulo) return;
    document.title = `${exam.titulo} • Intento de examen`;
  }, [exam?.titulo]);

  useEffect(() => {
    if (user && user.role !== 'estudiante') {
      toast({
        title: 'Acceso restringido',
        description: 'Solo estudiantes pueden resolver exámenes.',
        variant: 'destructive'
      });
      navigate('/exams', { replace: true });
    }
  }, [user, navigate]);

  const isTimeExpired = hasTimeLimit && timeLeft <= 0;
  const timerLabel = hasTimeLimit ? formatTimeLeft(timeLeft) : 'Sin límite de tiempo';
  const progressValue = hasTimeLimit && durationMs ? ((durationMs - timeLeft) / durationMs) * 100 : 0;

  if (isLoading) {
    return <StudentExamAttemptSkeleton />;
  }

  if (isError || !exam) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-destructive">No se pudo cargar el examen.</h2>
        <p className="text-muted-foreground">Intenta regresar a la lista de exámenes e ingresar nuevamente.</p>
        <Button onClick={() => navigate('/exams')}>Volver a exámenes</Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            if (submitMutation.isPending) return;
            const confirmLeave = window.confirm(
              '¿Deseas abandonar el intento? Se eliminará tu progreso guardado en este dispositivo.'
            );
            if (confirmLeave) {
              if (storageKey) {
                window.localStorage.removeItem(storageKey);
              }
              navigate(`/exams/${id}`);
            }
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al detalle
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Inicio: {startedAt ? new Date(startedAt).toLocaleTimeString() : 'Pendiente'}
        </div>
      </div>

      <Card className="shadow-card border-border/50">
        <CardHeader className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-2xl font-semibold text-foreground">{exam.titulo}</CardTitle>
              <CardDescription>
                Parte del curso {exam.course.nombre}. Duración estimada de {exam.duracionMinutos} minutos.
              </CardDescription>
            </div>
            <Badge variant={exam.isActive ? 'default' : 'destructive'} className="self-start">
              {exam.isActive ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
          <Separator />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Preguntas: {summary.questionCount}
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Puntaje máximo: {summary.totalPoints}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className={`font-semibold ${isTimeExpired ? 'text-destructive' : 'text-foreground'}`}>
                Tiempo restante: {timerLabel}
              </span>
              {hasTimeLimit && (
                <Progress value={Math.min(100, Math.max(0, progressValue))} className="h-2" />
              )}
            </div>
          </div>
          {isTimeExpired && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              El tiempo límite ha finalizado. Tus respuestas se enviarán automáticamente al confirmar.
            </div>
          )}
        </CardHeader>
      </Card>

      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Responde las preguntas</CardTitle>
          <CardDescription>
            Tus respuestas se guardan automáticamente en este dispositivo. Envía el examen cuando finalices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {exam.questions && exam.questions.length > 0 ? (
            exam.questions.map((question, index) => (
              <div key={question.id} className="space-y-4">
                <div className="rounded-lg border border-border/60 bg-background/60 p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="h-8 w-8 rounded-full p-0 text-center leading-8 font-semibold">
                          {index + 1}
                        </Badge>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {question.title?.trim() || `Pregunta ${index + 1}`}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <QuestionTypeBadge tipo={question.tipo} />
                            <span>• {question.puntos} pts</span>
                            {question.pageNumber ? <span>• Hoja {question.pageNumber}</span> : null}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {question.prompt || 'Consigna no disponible.'}
                      </p>
                    </div>
                  </div>
                </div>

                <StudentQuestionResponse
                  question={question}
                  draft={drafts[question.id]}
                  disabled={submitMutation.isPending || autoSubmitting}
                  isUploading={uploadingQuestionId === question.id && uploadMutation.isPending}
                  onChange={handleDraftChange}
                  onUploadFile={(file) => handleUploadFile(question, file)}
                  onRemoveFile={(file) => handleRemoveFile(question.id, file)}
                />
              </div>
            ))
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground">
              Este examen aún no cuenta con preguntas publicadas.
            </div>
          )}
          <div className="flex flex-col gap-2 border-t pt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Asegúrate de haber respondido todas las preguntas antes de enviar. Recibirás una confirmación inmediata.
              </p>
              <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    size="lg"
                    className="gap-2"
                    disabled={submitMutation.isPending || autoSubmitting}
                  >
                    {submitMutation.isPending || autoSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Enviar examen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar envío</AlertDialogTitle>
                    <AlertDialogDescription>
                      Revisa que todas tus respuestas estén completas. Una vez envíes el examen no podrás modificarlo.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Seguir revisando</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        setIsSubmitDialogOpen(false);
                        setAutoSubmitting(false);
                        handleSubmit();
                      }}
                    >
                      Enviar ahora
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentExamAttempt;
