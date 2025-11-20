import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import apiClient from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import type {
  CreateQuestionPayload,
  CreateRubricPayload,
  Question,
  QuestionFilters,
  QuestionsResponse,
  UpdateQuestionPayload,
  UpdateRubricPayload
} from '@/types/question';
import type { ApiResponse } from '@/types/api';

const DEFAULT_FILTERS: QuestionFilters = {
  search: '',
  tipo: null,
  page: 1,
  limit: 10
};

interface UseQuestionsOptions {
  examId?: string;
  initialFilters?: Partial<QuestionFilters>;
  enabled?: boolean;
}

export function useQuestions({ examId, initialFilters, enabled = true }: UseQuestionsOptions) {
  const [filters, setFilters] = useState<QuestionFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters
  });

  const queryClient = useQueryClient();

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.append('page', filters.page.toString());
    params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.tipo) params.append('tipo', filters.tipo);
    return params.toString();
  }, [filters]);

  const shouldFetch = Boolean(examId) && enabled;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<QuestionsResponse, AxiosError>({
    queryKey: ['examQuestions', examId, filters],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<QuestionsResponse>>(
        `/api/exams/${examId}/questions?${queryParams}`
      );
      return response.data.data;
    },
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData
  });

  const questions = data?.questions ?? [];

  const setSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  };

  const setPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const setLimit = (limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  const setTipo = (tipo: QuestionFilters['tipo']) => {
    setFilters((prev) => ({ ...prev, tipo, page: 1 }));
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const invalidateQuestions = () => {
    if (examId) {
      queryClient.invalidateQueries({ queryKey: ['examQuestions', examId] });
    }
  };

  return {
    questions,
    pagination: {
      totalQuestions: data?.totalQuestions ?? 0,
      totalPages: data?.totalPages ?? 1,
      currentPage: data?.currentPage ?? 1,
      hasNext: data?.hasNext ?? false,
      hasPrevious: data?.hasPrevious ?? false
    },
    filters,
    setSearch,
    setPage,
    setLimit,
    setTipo,
    resetFilters,
    refetch,
    invalidateQuestions,
    isLoading,
    isError,
    error
  };
}

export function useQuestion(questionId?: string, enabled = true) {
  return useQuery({
    queryKey: ['question', questionId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Question>>(`/api/questions/${questionId}`);
      return response.data.data;
    },
    enabled: Boolean(questionId) && enabled,
    staleTime: 1000 * 60 * 5
  });
}

interface MutationOptions {
  onSuccess?: (question: Question) => void;
}

export function useQuestionMutations(examId?: string, options?: MutationOptions) {
  const queryClient = useQueryClient();

  const handleError = (error: AxiosError<{ message?: string }>) => {
    const message = error.response?.data?.message ?? 'Ocurrió un error inesperado. Inténtalo más tarde.';
    toast({
      title: 'Error',
      description: message,
      variant: 'destructive'
    });
  };

  const invalidate = () => {
    if (examId) {
      queryClient.invalidateQueries({ queryKey: ['examQuestions', examId] });
    }
  };

  const createQuestion = useMutation({
    mutationFn: async (payload: CreateQuestionPayload) => {
      const response = await apiClient.post<ApiResponse<Question>>('/api/questions', payload);
      return response.data.data;
    },
    onSuccess: (question) => {
      toast({
        title: 'Pregunta creada',
        description: 'La pregunta se registró correctamente.'
      });
      options?.onSuccess?.(question);
      invalidate();
    },
    onError: handleError
  });

  const updateQuestion = useMutation({
    mutationFn: async (payload: UpdateQuestionPayload) => {
      const { id, ...data } = payload;
      const response = await apiClient.put<ApiResponse<Question>>(`/api/questions/${id}`, data);
      return response.data.data;
    },
    onSuccess: (question) => {
      toast({
        title: 'Pregunta actualizada',
        description: 'Los cambios se guardaron correctamente.'
      });
      options?.onSuccess?.(question);
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['question', question.id] });
    },
    onError: handleError
  });

  const deleteQuestion = useMutation({
    mutationFn: async (questionId: string) => {
      await apiClient.delete(`/api/questions/${questionId}`);
      return questionId;
    },
    onSuccess: () => {
      toast({
        title: 'Pregunta eliminada',
        description: 'La pregunta fue eliminada del examen.'
      });
      invalidate();
    },
    onError: handleError
  });

  return {
    createQuestion,
    updateQuestion,
    deleteQuestion
  };
}

export function useRubricMutations(examId?: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (examId) {
      queryClient.invalidateQueries({ queryKey: ['examQuestions', examId] });
    }
  };

  const handleError = (error: AxiosError<{ message?: string }>) => {
    const message = error.response?.data?.message ?? 'Ocurrió un error al procesar la rúbrica.';
    toast({
      title: 'Error',
      description: message,
      variant: 'destructive'
    });
  };

  const createRubric = useMutation({
    mutationFn: async (payload: CreateRubricPayload) => {
      const response = await apiClient.post<ApiResponse<Question>>(`/api/questions/${payload.questionId}/rubrics`, payload);
      return response.data.data;
    },
    onSuccess: () => {
      toast({
        title: 'Rúbrica creada',
        description: 'La rúbrica se registró correctamente.'
      });
      invalidate();
    },
    onError: handleError
  });

  const updateRubric = useMutation({
    mutationFn: async (payload: UpdateRubricPayload) => {
      const { id, ...data } = payload;
      const response = await apiClient.put<ApiResponse<Question>>(`/api/questions/rubrics/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      toast({
        title: 'Rúbrica actualizada',
        description: 'Los cambios en la rúbrica se guardaron.'
      });
      invalidate();
    },
    onError: handleError
  });

  return {
    createRubric,
    updateRubric
  };
}
