export interface QuestionGradeInput {
  questionId: string;
  score: number;
  feedback?: string;
}

export interface GradeSubmissionPayload {
  questionGrades: QuestionGradeInput[];
  generalFeedback?: string;
  bonus?: number;
}

export interface GradeSubmissionResponse {
  submissionId: string;
  studentEmail: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  gradedAt: string;
  gradedBy?: string;
}
