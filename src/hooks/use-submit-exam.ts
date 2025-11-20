import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import apiClient from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import type { ApiResponse } from '@/types/api';
import type { SubmitExamPayload, SubmitExamResponse } from '@/types/exam';

interface UseSubmitExamOptions {
  onSuccess?: (response: SubmitExamResponse) => void;
  onError?: (error: AxiosError) => void;
}

export function useSubmitExam(examId?: string, options?: UseSubmitExamOptions) {
  return useMutation<SubmitExamResponse, AxiosError<{ message?: string }>, SubmitExamPayload>({
    mutationFn: async (payload) => {
      if (!examId) {
        throw new Error('Exam ID is required to submit an attempt');
      }

      const response = await apiClient.post<ApiResponse<SubmitExamResponse>>(
        `/api/exams/${examId}/submit`,
        payload
      );

      return response.data.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Examen enviado',
        description: 'Tus respuestas fueron registradas correctamente. Puedes revisar el detalle del examen.',
      });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message ?? 'No se pudo enviar el examen.';
      toast({
        title: 'Error al enviar',
        description: message,
        variant: 'destructive'
      });
      options?.onError?.(error);
    }
  });
}
