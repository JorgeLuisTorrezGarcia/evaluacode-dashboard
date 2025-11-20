import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useDebounce } from './use-debounce';
import type { ExamsResponse, ExamFilters } from '@/types/exam';

const initialFilters: ExamFilters = {
  search: '',
  tipo: null,
  isActive: null,
  courseId: '',
  docenteId: '',
  page: 1,
  limit: 10,
};

export function useExams() {
  const [filters, setFilters] = useState<ExamFilters>(initialFilters);
  
  const debouncedSearch = useDebounce(filters.search, 500);

  const queryParams = new URLSearchParams();
  if (debouncedSearch) queryParams.append('search', debouncedSearch);
  if (filters.tipo) queryParams.append('tipo', filters.tipo);
  if (filters.isActive !== null) queryParams.append('isActive', filters.isActive.toString());
  if (filters.courseId) queryParams.append('courseId', filters.courseId);
  if (filters.docenteId) queryParams.append('docenteId', filters.docenteId);
  queryParams.append('page', filters.page.toString());
  queryParams.append('limit', filters.limit.toString());

  const {
    data,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['exams', debouncedSearch, filters.tipo, filters.isActive, filters.courseId, filters.docenteId, filters.page, filters.limit],
    queryFn: async (): Promise<ExamsResponse> => {
      const response = await apiClient.get(`/api/exams?${queryParams.toString()}`);
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData,
  });

  const updateFilters = (newFilters: Partial<ExamFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const updateSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const updatePage = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const exams = data?.exams || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || 1;
  const totalExams = data?.totalExams || 0;

  return {
    exams,
    totalPages,
    currentPage,
    totalExams,
    isLoading,
    isError,
    error,
    filters,
    updateFilters,
    updateSearch,
    updatePage,
    resetFilters,
    refetch,
  };
}
