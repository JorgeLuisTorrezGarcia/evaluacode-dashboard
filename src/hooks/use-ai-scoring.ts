import { useMutation } from '@tanstack/react-query';

import apiClient from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import type { QuestionType } from '@/types/question';

interface GenerateAiScoreVariables {
  questionId: string;
  studentAnswer?: string | null;
  maxPoints: number;
  questionType: QuestionType;
  questionPrompt?: string;
  rubric?: string;
  context?: string;
  model?: string;
}

interface GenerateAiScoreOptions {
  onSuccess?: (score: number, reasoning?: string) => void;
}

interface GenerateAiScoreParams {
  examId: string;
  submissionId: string;
}

export interface AiScoreResponse {
  score: number;
  reasoning: string;
  confidence: number;
  model: string;
}

export function useAiScoring(
  { examId, submissionId }: GenerateAiScoreParams,
  options?: GenerateAiScoreOptions
) {
  return useMutation<AiScoreResponse, Error, GenerateAiScoreVariables>({
    mutationFn: async (variables) => {
      if (!examId || !submissionId) {
        throw new Error('Identificadores de examen o envío inválidos.');
      }

      const response = await apiClient.post(
        `/api/exams/${examId}/submissions/${submissionId}/ai-score`,
        variables
      );

      return response.data?.data as AiScoreResponse;
    },
    onSuccess: (response, variables) => {
      if (!response || typeof response.score !== 'number') {
        toast({
          title: 'Respuesta inválida',
          description: 'La IA no pudo generar una calificación válida.',
          variant: 'destructive'
        });
        return;
      }

      // Validar que el puntaje no exceda el máximo
      if (response.score < 0 || response.score > variables.maxPoints) {
        toast({
          title: 'Calificación fuera de rango',
          description: `La IA generó ${response.score} pts, pero el máximo es ${variables.maxPoints} pts.`,
          variant: 'destructive'
        });
        return;
      }

      options?.onSuccess?.(response.score, response.reasoning);

      toast({
        title: 'Calificación generada',
        description: `Puntaje sugerido: ${response.score}/${variables.maxPoints} pts. Puedes ajustarlo si es necesario.`,
        duration: 6000
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'No se pudo generar la calificación automática.';

      toast({
        title: 'Error en calificación IA',
        description: message,
        variant: 'destructive'
      });
    }
  });
}
