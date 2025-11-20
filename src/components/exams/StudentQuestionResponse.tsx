import { ChangeEvent, useMemo, useState } from 'react';
import { Loader2, Paperclip, Trash2, UploadCloud } from 'lucide-react';

import type { ExamQuestion, QuestionDraft } from '@/types/exam';
import type { UploadedFile } from '@/types/upload';

import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StudentQuestionResponseProps {
  question: ExamQuestion;
  draft?: QuestionDraft;
  disabled?: boolean;
  isUploading?: boolean;
  onChange: (draft: QuestionDraft) => void;
  onUploadFile: (file: File) => Promise<void>;
  onRemoveFile: (file: UploadedFile) => Promise<void>;
}

export function StudentQuestionResponse({
  question,
  draft,
  disabled = false,
  isUploading = false,
  onChange,
  onUploadFile,
  onRemoveFile
}: StudentQuestionResponseProps) {
  const allowMultiple = question.tipo === 'multiple_choice' && Boolean(question.config?.allowMultiple);
  const options = useMemo(() => question.config?.options ?? [], [question.config?.options]);
  const maxFiles = question.tipo === 'file_upload' ? question.config?.maxFiles ?? 3 : 0;
  const allowedMimeTypes = question.tipo === 'file_upload' ? question.config?.allowedMimeTypes : undefined;

  const [isProcessingRemoval, setIsProcessingRemoval] = useState<string | null>(null);

  const ensureDraft = (override?: Partial<QuestionDraft>): QuestionDraft => {
    const base: QuestionDraft = draft ?? {
      questionId: question.id,
      value: allowMultiple ? [] : ''
    };

    if (question.tipo === 'file_upload' && !base.files) {
      base.files = [];
    }

    return {
      ...base,
      ...override
    };
  };

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    onChange(
      ensureDraft({
        value: event.target.value
      })
    );
  };

  const handleChoiceChange = (value: string) => {
    if (allowMultiple) {
      const current = Array.isArray(draft?.value) ? draft?.value : [];
      const exists = current.includes(value);
      const next = exists ? current.filter((item) => item !== value) : [...current, value];

      onChange(
        ensureDraft({
          value: next
        })
      );
      return;
    }

    onChange(
      ensureDraft({
        value
      })
    );
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;

    const existingFiles = ensureDraft().files ?? [];
    const remainingSlots = maxFiles ? Math.max(maxFiles - existingFiles.length, 0) : event.target.files.length;

    if (remainingSlots === 0) {
      event.target.value = '';
      return;
    }

    const selectedFiles = Array.from(event.target.files).slice(0, remainingSlots);

    for (const file of selectedFiles) {
      await onUploadFile(file);
    }

    event.target.value = '';
  };

  const handleRemoveFile = async (file: UploadedFile) => {
    try {
      setIsProcessingRemoval(file.publicId);
      await onRemoveFile(file);
    } finally {
      setIsProcessingRemoval(null);
    }
  };

  const renderMultipleChoice = () => {
    if (!options.length) {
      return (
        <p className="rounded-md border border-dashed border-border/50 bg-muted/40 p-4 text-sm text-muted-foreground">
          Esta pregunta aún no tiene opciones configuradas. Comunícate con tu docente.
        </p>
      );
    }

    if (allowMultiple) {
      const selectedValues = Array.isArray(draft?.value) ? draft?.value : [];

      return (
        <div className="space-y-3">
          {options.map((option) => {
            const checked = selectedValues.includes(option.value);
            return (
              <label
                key={option.value}
                className={cn(
                  'flex items-start gap-3 rounded-md border border-border/60 bg-background/80 p-3 transition hover:border-border',
                  disabled && 'opacity-70'
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => handleChoiceChange(option.value)}
                  disabled={disabled}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium text-foreground">{option.label}</span>
                  <span className="block text-sm text-muted-foreground">{option.value}</span>
                </span>
              </label>
            );
          })}
        </div>
      );
    }

    const selectedValue = typeof draft?.value === 'string' ? draft?.value : '';

    return (
      <RadioGroup value={selectedValue} onValueChange={handleChoiceChange} className="space-y-3" disabled={disabled}>
        {options.map((option) => (
          <Label
            key={option.value}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-md border border-border/60 bg-background/80 p-3 transition hover-border-border',
              disabled && 'opacity-70'
            )}
          >
            <RadioGroupItem value={option.value} disabled={disabled} className="mt-1" />
            <span>
              <span className="font-medium text-foreground">{option.label}</span>
              <span className="block text-sm text-muted-foreground">{option.value}</span>
            </span>
          </Label>
        ))}
      </RadioGroup>
    );
  };

  const renderFileUpload = () => {
    const files = ensureDraft().files ?? [];
    const remainingSlots = maxFiles ? Math.max(maxFiles - files.length, 0) : undefined;

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor={`question-file-${question.id}`} className="flex items-center gap-2 text-sm font-medium">
            <UploadCloud className="h-4 w-4" />
            {remainingSlots !== undefined ? `Puedes adjuntar hasta ${remainingSlots} archivo(s) más` : 'Adjunta tus archivos'}
          </Label>
          {allowedMimeTypes && allowedMimeTypes.length > 0 && (
            <span className="text-xs text-muted-foreground">Tipos permitidos: {allowedMimeTypes.join(', ')}</span>
          )}
        </div>
        <Input
          id={`question-file-${question.id}`}
          type="file"
          multiple={Boolean(remainingSlots && remainingSlots > 1)}
          accept={allowedMimeTypes?.join(',')}
          disabled={disabled || isUploading || remainingSlots === 0}
          onChange={handleFileUpload}
        />
        <div className="space-y-2">
          {files.length > 0 ? (
            files.map((file) => (
              <div
                key={file.publicId}
                className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background/80 p-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{file.originalFilename ?? file.publicId}</p>
                    <p className="text-xs text-muted-foreground">{Math.round(file.bytes / 1024)} KB</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  disabled={disabled || isProcessingRemoval === file.publicId}
                  onClick={() => handleRemoveFile(file)}
                >
                  {isProcessingRemoval === file.publicId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Quitar
                </Button>
              </div>
            ))
          ) : (
            <p className="rounded-md border border-dashed border-border/50 bg-muted/40 p-4 text-sm text-muted-foreground">
              Aún no has adjuntado archivos.
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {question.tipo === 'text' && (
        <div className="space-y-2">
          <Label htmlFor={`question-text-${question.id}`} className="text-sm font-medium">
            Respuesta
          </Label>
          <Textarea
            id={`question-text-${question.id}`}
            rows={question.config?.responseLength === 'paragraph' ? 6 : 4}
            placeholder="Escribe tu respuesta..."
            value={typeof draft?.value === 'string' ? draft?.value : ''}
            onChange={handleTextChange}
            disabled={disabled}
          />
          {question.config?.maxLength && (
            <p className="text-xs text-muted-foreground">
              Máximo {question.config.maxLength} caracteres
            </p>
          )}
        </div>
      )}

      {question.tipo === 'code' && (
        <div className="space-y-2">
          <Label htmlFor={`question-code-${question.id}`} className="text-sm font-medium">
            Código fuente
          </Label>
          <Textarea
            id={`question-code-${question.id}`}
            rows={10}
            placeholder="Escribe tu solución en código..."
            value={typeof draft?.value === 'string' ? draft?.value : ''}
            onChange={handleTextChange}
            disabled={disabled}
          />
          {question.config?.language && (
            <p className="text-xs text-muted-foreground">Lenguaje sugerido: {question.config.language}</p>
          )}
          {question.config?.starterCode && (
            <details className="rounded-md border border-border/50 bg-muted/30 p-3 text-sm">
              <summary className="cursor-pointer font-medium text-foreground">Ver código base sugerido</summary>
              <pre className="mt-2 overflow-x-auto rounded bg-background p-3 text-xs text-muted-foreground">
                {question.config.starterCode}
              </pre>
            </details>
          )}
        </div>
      )}

      {question.tipo === 'multiple_choice' && renderMultipleChoice()}

      {question.tipo === 'file_upload' && renderFileUpload()}
    </div>
  );
}
