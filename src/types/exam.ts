import type { QuestionConfig, QuestionType } from './question';
import type { UploadedFile } from './upload';

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
  submissions?: ExamSubmission[];
}

export interface ExamQuestion {
  id: string;
  orden: number;
  tipo: QuestionType;
  puntos: number;
  title?: string;
  prompt?: string;
  pageNumber?: number | null;
  config?: QuestionConfig | null;
  bbox?: Record<string, unknown> | null;
}

export type QuestionDraftValue = string | string[] | null;

export interface QuestionDraft {
  questionId: string;
  value: QuestionDraftValue;
  timeSpent?: number;
  files?: UploadedFile[];
}

export interface SubmitExamAnswer {
  questionId: string;
  response: string;
  timeSpent?: number;
}

export interface SubmitExamPayload {
  answers: SubmitExamAnswer[];
  totalTimeSpent?: number;
  additionalFiles?: string[];
}

export interface SubmitExamResponse {
  submissionId: string;
  submittedAt: string;
  totalTimeSpent?: number;
  attemptNumber: number;
  maxAttempts: number;
}

export interface ExamSubmissionAnswer {
  id: string;
  questionId: string;
  rawText: string | null;
  manualScore?: number | null;
  manualFeedback?: string | null;
  question?: {
    id: string;
    puntos: number;
  };
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  submittedAt: string;
  finalScore?: number | null;
  maxScore?: number | null;
  generalFeedback?: string | null;
  bonusAwarded?: number | null;
  student?: {
    id: string;
    email: string;
  };
  answers: ExamSubmissionAnswer[];
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
