import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft, Award, User, CalendarClock, Sparkles } from 'lucide-react';

import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useGradeSubmission } from '@/hooks/use-grade-submission';
import { useGenerateAiFeedback } from '@/hooks/use-ai-feedback';
import { toast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { Exam, ExamQuestion, ExamSubmission, ExamSubmissionAnswer } from '@/types/exam';
import type { GradeSubmissionPayload } from '@/types/grade';

interface QuestionGradeState {
  score: string;
  feedback: string;
}

type GradesState = Record<string, QuestionGradeState>;

const INITIAL_GRADE_STATE: QuestionGradeState = {
  score: '',
  feedback: ''
};

const formatAnswerForPrompt = (question: ExamQuestion | undefined, answer: ExamSubmissionAnswer) => {
  if (!answer.rawText) return '';

  if (!question) return answer.rawText;

  if (question.tipo === 'file_upload') {
    try {
      const files = JSON.parse(answer.rawText) as Array<{ name?: string; url?: string; secureUrl?: string }>;
      if (Array.isArray(files)) {
        return files
          .map((file, idx) => `${file.name ?? `Archivo ${idx + 1}`}: ${file.url ?? file.secureUrl ?? 'sin URL'}`)
          .join('\n');
      }
    } catch (error) {
      return answer.rawText;
    }
  }

  if (question.tipo === 'multiple_choice') {
    try {
      const parsed = JSON.parse(answer.rawText);
      if (Array.isArray(parsed)) {
        return parsed.join(', ');
      }
      if (typeof parsed === 'string') {
        return parsed;
      }
    } catch (error) {
      return answer.rawText;
    }
  }

  return answer.rawText;
};

export default function SubmissionReview() {
  const { examId, submissionId } = useParams<{ examId: string; submissionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: exam, isLoading, isError } = useQuery<Exam>({
    queryKey: ['exam', examId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/exams/${examId}`);
      return response.data.data;
    },
    enabled: Boolean(examId)
  });

  useEffect(() => {
    if (!user) return;
    if (user.role === 'estudiante') {
      toast({
        title: 'Acceso denegado',
        description: 'Solo docentes o administradores pueden evaluar envíos.',
        variant: 'destructive'
      });
      navigate('/exams', { replace: true });
    }
  }, [user, navigate]);

  const submission = useMemo(() => {
    if (!exam?.submissions?.length || !submissionId) return null;
    return exam.submissions.find((item) => item.id === submissionId) ?? null;
  }, [exam?.submissions, submissionId]);

  const questionLookup = useMemo(() => {
    if (!exam?.questions?.length) return {} as Record<string, ExamQuestion & { index: number }>;
    return exam.questions.reduce((acc, question, index) => {
      acc[question.id] = { ...question, index: index + 1 };
      return acc;
    }, {} as Record<string, ExamQuestion & { index: number }>);
  }, [exam?.questions]);

  const sortedAnswers = useMemo(() => {
    if (!submission) return [] as ExamSubmissionAnswer[];
    return [...submission.answers].sort((a, b) => {
      const orderA = questionLookup[a.questionId]?.index ?? 0;
      const orderB = questionLookup[b.questionId]?.index ?? 0;
      return orderA - orderB;
    });
  }, [submission, questionLookup]);

  const [grades, setGrades] = useState<GradesState>({});
  const [generalFeedback, setGeneralFeedback] = useState('');
  const [bonus, setBonus] = useState('0');
  const [aiTargetQuestionId, setAiTargetQuestionId] = useState<string | null>(null);

  useEffect(() => {
    if (!sortedAnswers.length) return;
    setGrades(() => {
      const next: GradesState = {};
      sortedAnswers.forEach((answer) => {
        next[answer.questionId] = {
          score:
            answer.manualScore !== undefined && answer.manualScore !== null
              ? String(answer.manualScore)
              : INITIAL_GRADE_STATE.score,
          feedback: answer.manualFeedback ?? INITIAL_GRADE_STATE.feedback
        };
      });
      return next;
    });
  }, [sortedAnswers]);

  useEffect(() => {
    if (!submission) return;
    setGeneralFeedback(submission.generalFeedback ?? '');
    setBonus(
      submission.bonusAwarded !== undefined && submission.bonusAwarded !== null
        ? String(submission.bonusAwarded)
        : '0'
    );
  }, [submission]);

  const gradeMutation = useGradeSubmission(examId ?? '', {
    onSuccess: () => {
      navigate(`/exams/${examId}`);
    }
  });

  const aiFeedbackMutation = useGenerateAiFeedback(
    { examId: examId ?? '', submissionId: submissionId ?? '' },
    {
      onSuccess: (feedback) => {
        if (!aiTargetQuestionId) return;
        setGrades((prev) => {
          const current = prev[aiTargetQuestionId] ?? { ...INITIAL_GRADE_STATE };
          return {
            ...prev,
            [aiTargetQuestionId]: {
              ...current,
              feedback
            }
          };
        });
        setAiTargetQuestionId(null);
      }
    }
  );

  const remainingPoints = useMemo(() => {
    if (!submission || !exam?.questions) return { total: 0, max: 0 };

    let total = 0;
    let max = 0;

    sortedAnswers.forEach((answer) => {
      const question = questionLookup[answer.questionId];
      const gradeValue = Number(grades[answer.questionId]?.score ?? 0);
      if (question) {
        max += question.puntos;
        if (!Number.isNaN(gradeValue)) {
          total += gradeValue;
        }
      }
    });

    const bonusValue = Number(bonus);
    if (!Number.isNaN(bonusValue)) {
      total += bonusValue;
      max += bonusValue;
    }

    return { total, max };
  }, [sortedAnswers, questionLookup, grades, bonus, exam?.questions, submission]);

  const renderAnswerContent = (answer: ExamSubmissionAnswer) => {
    const question = questionLookup[answer.questionId];

    if (!answer.rawText) {
      return <span className="italic text-muted-foreground">Sin respuesta enviada.</span>;
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
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
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
        // Mostrar contenido crudo si el JSON no es válido
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
        // Mostrar texto crudo si no se puede parsear
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
  };

  const handleGradeChange = (questionId: string, field: keyof QuestionGradeState, value: string) => {
    setGrades((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value
      }
    }));
  };

  const handleSubmit = () => {
    if (!exam || !submission || !examId || !submissionId) return;

    const questionGrades = sortedAnswers.map((answer) => {
      const question = questionLookup[answer.questionId];
      const gradeState = grades[answer.questionId] ?? INITIAL_GRADE_STATE;
      const numericScore = Number(gradeState.score);

      if (Number.isNaN(numericScore)) {
        throw new Error(`Debes ingresar un puntaje válido para la pregunta ${question?.index ?? '?'}`);
      }

      if (question && numericScore > question.puntos) {
        throw new Error(`El puntaje asignado supera el máximo permitido (${question.puntos})`);
      }

      return {
        questionId: answer.questionId,
        score: numericScore,
        feedback: gradeState.feedback?.trim() ? gradeState.feedback.trim() : undefined
      };
    });

    const payload: GradeSubmissionPayload = {
      questionGrades,
      generalFeedback: generalFeedback.trim() ? generalFeedback.trim() : undefined,
      bonus: Number(bonus) || 0
    };

    gradeMutation.mutate({ submissionId, payload });
  };

  useEffect(() => {
    if (!gradeMutation.isError) return;
    const error = gradeMutation.error as unknown as Error | undefined;
    if (error?.message) {
      toast({
        title: 'Revisa la calificación',
        description: error.message,
        variant: 'destructive'
      });
    }
  }, [gradeMutation.isError, gradeMutation.error]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError || !exam) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive">No fue posible cargar el examen.</h2>
        <p className="text-muted-foreground">Regresa al listado y vuelve a intentarlo.</p>
        <Button className="mt-6" onClick={() => navigate('/exams')}>
          Volver a exámenes
        </Button>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive">El envío no existe o pertenece a otro examen.</h2>
        <Button className="mt-6" onClick={() => navigate(`/exams/${examId}`)}>
          Volver al examen
        </Button>
      </div>
    );
  }

  const hasErrors = gradeMutation.isError;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="outline" className="gap-2" onClick={() => navigate(`/exams/${examId}`)}>
          <ArrowLeft className="h-4 w-4" /> Volver al examen
        </Button>
        <Badge variant="secondary" className="capitalize">
          {exam.tipo}
        </Badge>
      </div>

      <Card className="shadow-card border-border/50">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold">Evaluación del envío</CardTitle>
          <CardDescription>
            Revisa las respuestas de <strong>{submission.student?.email ?? 'Estudiante'}</strong> y asigna una calificación.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
            <User className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Estudiante</p>
              <p className="font-semibold text-foreground">{submission.student?.email ?? 'No registrado'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
            <CalendarClock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Fecha de envío</p>
              <p className="font-semibold text-foreground">{new Date(submission.submittedAt).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
            <Award className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Resultado actual</p>
              {typeof submission.finalScore === 'number' && typeof submission.maxScore === 'number' ? (
                <p className="font-semibold text-foreground">
                  {submission.finalScore.toFixed(2)} / {submission.maxScore.toFixed(2)} pts
                </p>
              ) : (
                <p className="font-semibold text-warning-foreground">Pendiente de calificar</p>
              )}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">Puntaje propuesto</p>
            <p className="text-2xl font-semibold text-foreground">
              {remainingPoints.total.toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground"> / {remainingPoints.max.toFixed(2)} pts</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Respuestas del estudiante</CardTitle>
          <CardDescription>
            Analiza cada respuesta y asigna un puntaje de acuerdo con las rúbricas o criterios definidos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {sortedAnswers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No se encontraron respuestas registradas.</p>
          ) : (
            sortedAnswers.map((answer) => {
              const question = questionLookup[answer.questionId];
              const gradeState = grades[answer.questionId] ?? INITIAL_GRADE_STATE;
              return (
                <div key={answer.id} className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        Pregunta {question?.index ?? '?'}: {question?.title ?? 'Sin título'}
                      </p>
                      {question?.prompt && (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{question.prompt}</p>
                      )}
                    </div>
                    {question && (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="capitalize">
                          {question.tipo.replace('_', ' ')}
                        </Badge>
                        <span>{question.puntos} pts máx.</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 space-y-4">
                    <div className="rounded-md border bg-background p-3 text-sm text-foreground">
                      {renderAnswerContent(answer)}
                    </div>

                    {(answer.manualScore !== null && answer.manualScore !== undefined) ||
                    (answer.manualFeedback && answer.manualFeedback.trim().length > 0) ? (
                      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                        <p className="font-semibold text-primary">
                          Calificación registrada: {answer.manualScore?.toFixed(2) ?? '—'} / {question?.puntos ?? '—'} pts
                        </p>
                        {answer.manualFeedback && (
                          <p className="mt-1 text-primary/80 whitespace-pre-wrap">
                            {answer.manualFeedback}
                          </p>
                        )}
                      </div>
                    ) : null}

                    <Tabs defaultValue="grade" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="grade">Calificación</TabsTrigger>
                        <TabsTrigger value="feedback">Retroalimentación</TabsTrigger>
                      </TabsList>
                      <TabsContent value="grade" className="space-y-3 border px-4 py-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <label className="text-sm font-medium text-foreground" htmlFor={`score-${answer.questionId}`}>
                            Puntaje obtenido
                          </label>
                          <div className="flex items-center gap-2">
                            <Input
                              id={`score-${answer.questionId}`}
                              type="number"
                              inputMode="decimal"
                              step="0.5"
                              min={0}
                              max={question?.puntos ?? undefined}
                              value={gradeState.score}
                              onChange={(event) => handleGradeChange(answer.questionId, 'score', event.target.value)}
                            />
                            <span className="text-sm text-muted-foreground">/ {question?.puntos ?? '—'} pts</span>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="feedback" className="space-y-3 border px-4 py-3">
                        <label className="text-sm font-medium text-foreground" htmlFor={`feedback-${answer.questionId}`}>
                          Comentarios para el estudiante
                        </label>
                        <Textarea
                          id={`feedback-${answer.questionId}`}
                          value={gradeState.feedback}
                          onChange={(event) => handleGradeChange(answer.questionId, 'feedback', event.target.value)}
                          placeholder="Describe qué se hizo bien y qué debe mejorar..."
                          rows={3}
                        />
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs text-muted-foreground">
                            ¿Necesitas inspiración? Solicita una sugerencia automática basada en la respuesta del estudiante.
                          </p>
                          <Button
                            type="button"
                            variant="secondary"
                            className="gap-2"
                            disabled={aiFeedbackMutation.isPending && aiTargetQuestionId === answer.questionId}
                            onClick={() => {
                              setAiTargetQuestionId(answer.questionId);
                              aiFeedbackMutation.mutate({
                                questionId: answer.questionId,
                                studentAnswer: formatAnswerForPrompt(question, answer),
                                context: generalFeedback.trim() ? generalFeedback : undefined
                              });
                            }}
                          >
                            {aiFeedbackMutation.isPending && aiTargetQuestionId === answer.questionId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                            Generar con IA
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Resumen de calificación</CardTitle>
          <CardDescription>
            Define observaciones generales y puntos adicionales si corresponde antes de guardar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="general-feedback">
                Retroalimentación general
              </label>
              <Textarea
                id="general-feedback"
                value={generalFeedback}
                onChange={(event) => setGeneralFeedback(event.target.value)}
                placeholder="Mensaje global para el estudiante..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="bonus">
                Bonificación
              </label>
              <Input
                id="bonus"
                type="number"
                inputMode="decimal"
                step="0.5"
                min={0}
                value={bonus}
                onChange={(event) => setBonus(event.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Los puntos de bonificación se sumarán tanto al puntaje obtenido como al máximo.
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              <p>Puntaje total asignado: <span className="font-semibold text-foreground">{remainingPoints.total.toFixed(2)} pts</span></p>
              <p>Máximo considerado (incl. bono): <span className="font-semibold text-foreground">{remainingPoints.max.toFixed(2)} pts</span></p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate(`/exams/${examId}`)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  try {
                    handleSubmit();
                  } catch (error) {
                    const message = error instanceof Error ? error.message : 'Revisa los puntajes ingresados.';
                    toast({
                      title: 'Calificación inválida',
                      description: message,
                      variant: 'destructive'
                    });
                  }
                }}
                disabled={gradeMutation.isPending || sortedAnswers.length === 0}
                className="gap-2"
              >
                {gradeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Guardar calificación
              </Button>
            </div>
          </div>
          {hasErrors && (
            <p className="text-sm text-destructive">Ocurrió un problema. Verifica los puntajes y vuelve a intentarlo.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
