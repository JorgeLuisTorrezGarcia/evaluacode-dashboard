export type AdminUserRole = 'admin' | 'docente' | 'estudiante';

export interface AdminUserStats {
  coursesAsDocente: number;
  enrollments: number;
}

export interface AdminUser {
  id: string;
  email: string;
  role: AdminUserRole;
  createdAt: string;
  lastLogin: string | null;
  stats: AdminUserStats;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  pagination: Pagination;
}

export interface AdminUserFilters {
  search?: string;
  role?: AdminUserRole;
  page?: number;
  limit?: number;
}

export interface EnrollStudentPayload {
  courseId: string;
  studentId: string;
}
