export interface Exam {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: 'teorico' | 'practico' | 'mixto';
  fechaApertura: string;
  fechaCierre: string;
  duracionMinutos: number;
  intentosPermitidos: number;
  puntuacionMaxima: number;
  isActive: boolean;
  status?: 'upcoming' | 'active' | 'closed';
  canTakeExam?: boolean;
  course: {
    id: string;
    nombre: string;
    codigo: string;
    docenteId: string;
  };
  docente?: {
    id: string;
    email: string;
    roleName: string;
  };
  stats?: {
    submissionCount: number;
    questionCount: number;
  };
  questions?: ExamQuestion[];
}

export interface ExamQuestion {
  id: string;
  orden: number;
  tipo: string;
  puntos: number;
  title?: string;
  prompt?: string;
  pageNumber?: number | null;
}

export interface ExamsResponse {
  exams: Exam[];
  totalExams: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ExamFilters {
  search: string;
  tipo: 'teorico' | 'practico' | 'mixto' | null;
  isActive: boolean | null;
  courseId: string;
  docenteId: string;
  page: number;
  limit: number;
}
