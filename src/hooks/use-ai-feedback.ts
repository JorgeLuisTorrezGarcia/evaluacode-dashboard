import { useMutation } from '@tanstack/react-query';

import apiClient from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';

interface GenerateAiFeedbackVariables {
  questionId: string;
  studentAnswer?: string | null;
  context?: string;
  model?: string;
}

interface GenerateAiFeedbackOptions {
  onSuccess?: (feedback: string) => void;
}

interface GenerateAiFeedbackParams {
  examId: string;
  submissionId: string;
}

export function useGenerateAiFeedback(
  { examId, submissionId }: GenerateAiFeedbackParams,
  options?: GenerateAiFeedbackOptions
) {
  return useMutation({
    mutationFn: async (variables: GenerateAiFeedbackVariables) => {
      if (!examId || !submissionId) {
        throw new Error('Identificadores de examen o envío inválidos.');
      }

      const response = await apiClient.post(
        `/api/exams/${examId}/submissions/${submissionId}/ai-feedback`,
        variables
      );

      return response.data?.data?.feedback as string;
    },
    onSuccess: (feedback) => {
      if (!feedback) {
        toast({
          title: 'Sin retroalimentación',
          description: 'No se recibió retroalimentación de la IA.',
          variant: 'destructive'
        });
        return;
      }

      options?.onSuccess?.(feedback);
      toast({
        title: 'Retroalimentación generada',
        description: 'Se generó una sugerencia automática. Puedes editarla antes de guardar.',
        duration: 6000
      });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'No se pudo generar retroalimentación automática.';
      toast({
        title: 'Error con Gemini',
        description: message,
        variant: 'destructive'
      });
    }
  });
}
