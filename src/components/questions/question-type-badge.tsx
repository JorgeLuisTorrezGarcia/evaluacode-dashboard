import { Badge } from '@/components/ui/badge';
import { QUESTION_TYPES, QuestionType } from '@/types/question';

const LABELS: Record<QuestionType, string> = {
  text: 'Respuesta abierta',
  code: 'Código',
  file_upload: 'Archivo',
  multiple_choice: 'Selección múltiple'
};

const VARIANTS: Record<QuestionType, 'default' | 'secondary' | 'outline'> = {
  text: 'secondary',
  code: 'default',
  file_upload: 'outline',
  multiple_choice: 'default'
};

export interface QuestionTypeBadgeProps {
  tipo: QuestionType;
}

export function QuestionTypeBadge({ tipo }: QuestionTypeBadgeProps) {
  if (!QUESTION_TYPES.includes(tipo)) {
    return <Badge variant="secondary">Desconocido</Badge>;
  }

  return <Badge variant={VARIANTS[tipo]}>{LABELS[tipo]}</Badge>;
}
