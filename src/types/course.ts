/**
 * Tipos para la gestión de cursos
 */

export interface CourseFile {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  downloadUrl: string;
  category: string;
  description?: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  uploader?: {
    id: string;
    email: string;
  };
}

export interface Course {
  id: string;
  nombre: string;
  descripcion: string;
  codigo: string;
  creditos: number;
  periodo: string;
  semestre: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  docente?: {
    id: string;
    email: string;
    roleName: string;
  };
  stats?: {
    enrollmentCount: number;
    activeStudents: number;
    examCount: number;
    activeExams: number;
  };
  files?: CourseFile[];
}

export interface CoursesResponse {
  courses: Course[];
  totalCourses: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CourseFilters {
  search: string;
  isActive: boolean | null;
  docenteId: string;
  periodo: string;
  page: number;
  limit: number;
}

export interface CourseFormData {
  nombre: string;
  descripcion: string;
  codigo: string;
  creditos: number;
  periodo: string;
  semestre: number;
  isActive: boolean;
}
