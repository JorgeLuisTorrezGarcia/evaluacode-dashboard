import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useDebounce } from '@/hooks/use-debounce';
import type { AdminUserFilters, AdminUsersResponse, AdminUserRole } from '@/types/user';

const defaultFilters: Required<Pick<AdminUserFilters, 'page' | 'limit'>> & Omit<AdminUserFilters, 'page' | 'limit'> = {
  search: '',
  role: undefined,
  page: 1,
  limit: 10
};

export function useAdminUsers() {
  const [filters, setFilters] = useState<AdminUserFilters>(defaultFilters);
  const debouncedSearch = useDebounce(filters.search ?? '', 400);

  const queryParams = new URLSearchParams();
  if (debouncedSearch) queryParams.set('search', debouncedSearch);
  if (filters.role) queryParams.set('role', filters.role);
  queryParams.set('page', String(filters.page ?? 1));
  queryParams.set('limit', String(filters.limit ?? 10));

  const query = useQuery({
    queryKey: ['admin-users', debouncedSearch, filters.role, filters.page, filters.limit],
    queryFn: async (): Promise<AdminUsersResponse> => {
      const response = await apiClient.get(`/api/admin/users?${queryParams.toString()}`);
      return response.data.data;
    },
    staleTime: 1000 * 30,
    placeholderData: (previous) => previous
  });

  const updateFilters = (partial: Partial<AdminUserFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...partial,
      page: partial.page ?? 1
    }));
  };

  const updateSearch = (value: string) => {
    updateFilters({ search: value, page: 1 });
  };

  const updateRole = (role?: AdminUserRole) => {
    updateFilters({ role, page: 1 });
  };

  const updatePage = (page: number) => {
    updateFilters({ page });
  };

  return {
    ...query,
    filters,
    users: query.data?.users ?? [],
    pagination: query.data?.pagination,
    updateFilters,
    updateSearch,
    updateRole,
    updatePage
  };
}
