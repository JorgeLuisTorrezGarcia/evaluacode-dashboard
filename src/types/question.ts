export const QUESTION_TYPES = ['text', 'code', 'file_upload', 'multiple_choice'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export interface QuestionOption {
  label: string;
  value: string;
  isCorrect: boolean;
}

export interface QuestionConfig {
  responseLength?: 'short' | 'paragraph';
  maxLength?: number;
  language?: string;
  starterCode?: string;
  allowedMimeTypes?: string[];
  maxFiles?: number;
  options?: QuestionOption[];
  allowMultiple?: boolean;
  [key: string]: unknown;
}

export interface QuestionRubricSummary {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Question {
  id: string;
  examId: string;
  pageNumber: number;
  tipo: QuestionType;
  title: string;
  prompt: string;
  puntos: number;
  orden: number;
  bbox: Record<string, unknown> | null;
  config: QuestionConfig | null;
  rubrics?: QuestionRubricSummary[];
  exam?: {
    id: string;
    title: string;
    type: string;
    course?: {
      id: string;
      nombre: string;
      docenteId: string;
    } | null;
  } | null;
  course?: {
    id: string;
    nombre: string;
    docenteId: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestionsResponse {
  questions: Question[];
  totalQuestions: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface QuestionFilters {
  search: string;
  tipo: QuestionType | null;
  page: number;
  limit: number;
}

export interface CreateQuestionPayload {
  examId: string;
  pageNumber: number;
  tipo: QuestionType;
  title: string;
  prompt: string;
  puntos: number;
  orden: number;
  bbox?: Record<string, unknown> | null;
  config?: QuestionConfig | null;
}

export interface UpdateQuestionPayload {
  id: string;
  pageNumber?: number;
  tipo?: QuestionType;
  title?: string;
  prompt?: string;
  puntos?: number;
  orden?: number;
  bbox?: Record<string, unknown> | null;
  config?: QuestionConfig | null;
}

export interface CreateRubricPayload {
  questionId: string;
  examId?: string;
  name: string;
  estructuraJson: Record<string, unknown>;
  isActive?: boolean;
}

export interface UpdateRubricPayload extends Partial<CreateRubricPayload> {
  id: string;
  questionId?: never;
}
