import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useDebounce } from './use-debounce';
import type { Course, CoursesResponse, CourseFilters } from '@/types/course';

const initialFilters: CourseFilters = {
  search: '',
  isActive: null,
  docenteId: '',
  periodo: '',
  page: 1,
  limit: 10,
};

export function useCourses() {
  const [filters, setFilters] = useState<CourseFilters>(initialFilters);
  
  // Debounce search term to avoid excessive API calls
  const debouncedSearch = useDebounce(filters.search, 500);

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (debouncedSearch) queryParams.append('search', debouncedSearch);
  if (filters.isActive !== null) queryParams.append('isActive', filters.isActive.toString());
  if (filters.docenteId) queryParams.append('docenteId', filters.docenteId);
  if (filters.periodo) queryParams.append('periodo', filters.periodo);
  queryParams.append('page', filters.page.toString());
  queryParams.append('limit', filters.limit.toString());

  // Fetch courses using React Query
  const {
    data,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['courses', debouncedSearch, filters.isActive, filters.docenteId, filters.periodo, filters.page, filters.limit],
    queryFn: async (): Promise<CoursesResponse> => {
      const response = await apiClient.get(`/api/courses?${queryParams.toString()}`);
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });

  // Filter handlers
  const updateFilters = (newFilters: Partial<CourseFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 })); // Reset page when filters change
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

  // Derived state
  const courses = data?.courses || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || 1;
  const totalCourses = data?.totalCourses || 0;
  const hasNext = data?.hasNext || false;
  const hasPrevious = data?.hasPrevious || false;

  return {
    // Data
    courses,
    totalPages,
    currentPage,
    totalCourses,
    hasNext,
    hasPrevious,
    
    // Loading states
    isLoading,
    isError,
    error,
    
    // Filters
    filters,
    updateFilters,
    updateSearch,
    updatePage,
    resetFilters,
    
    // Actions
    refetch,
  };
}
