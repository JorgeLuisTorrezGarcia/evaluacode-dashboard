import { useMutation, useQueryClient } from '@tanstack/react-query';

import apiClient from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import type { AxiosErrorResponse } from '@/types/api';
import type { GradeSubmissionPayload } from '@/types/grade';

interface UseGradeSubmissionOptions {
  onSuccess?: () => void;
}

interface GradeSubmissionParams {
  examId: string;
  submissionId: string;
  payload: GradeSubmissionPayload;
}

export function useGradeSubmission(examId: string, options?: UseGradeSubmissionOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ submissionId, payload }: Omit<GradeSubmissionParams, 'examId'>) => {
      const response = await apiClient.post(`/api/exams/${examId}/grade`, payload, {
        params: { submissionId }
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Calificación registrada',
        description: 'La retroalimentación se guardó correctamente.'
      });
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      options?.onSuccess?.();
    },
    onError: (error: AxiosErrorResponse) => {
      toast({
        title: 'Error al calificar',
        description: error.response?.data?.message ?? 'No fue posible guardar la calificación.',
        variant: 'destructive'
      });
    }
  });
}
