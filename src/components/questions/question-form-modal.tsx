import { useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import type { Question, QuestionType } from '@/types/question';
import { QUESTION_TYPES } from '@/types/question';
import { useQuestionMutations } from '@/hooks/use-questions';

const questionFormSchema = z.object({
  examId: z.string(),
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  prompt: z.string().min(10, 'Describe con más detalle la pregunta'),
  tipo: z.enum(QUESTION_TYPES),
  puntos: z.string().superRefine((value, ctx) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ingresa un número válido' });
      return;
    }
    if (parsed < 0.1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Los puntos deben ser positivos' });
    }
  }),
  orden: z.string().superRefine((value, ctx) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ingresa un número entero' });
      return;
    }
    if (parsed < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El orden no puede ser negativo' });
    }
  }),
  pageNumber: z.string().superRefine((value, ctx) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ingresa un número entero' });
      return;
    }
    if (parsed < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La página debe ser 1 o mayor' });
    }
  }),
  configJson: z.string(),
  bboxJson: z.string()
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

const questionFormResolver = zodResolver(questionFormSchema) as Resolver<QuestionFormValues>;

interface QuestionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string;
  question?: Question | null;
  onCompleted?: () => void;
}

export function QuestionFormModal({
  open,
  onOpenChange,
  examId,
  question,
  onCompleted
}: QuestionFormModalProps) {
  const mode = question ? 'edit' : 'create';

  const form = useForm<QuestionFormValues>({
    resolver: questionFormResolver,
    defaultValues: {
      examId,
      title: question?.title ?? '',
      prompt: question?.prompt ?? '',
      tipo: (question?.tipo ?? 'text') as QuestionType,
      puntos: String(question?.puntos ?? 1),
      orden: String(question?.orden ?? 0),
      pageNumber: String(question?.pageNumber ?? 1),
      configJson: question?.config ? JSON.stringify(question.config, null, 2) : '',
      bboxJson: question?.bbox ? JSON.stringify(question.bbox, null, 2) : ''
    }
  });

  const { createQuestion, updateQuestion } = useQuestionMutations(examId, {
    onSuccess: () => {
      onCompleted?.();
      onOpenChange(false);
    }
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      examId,
      title: question?.title ?? '',
      prompt: question?.prompt ?? '',
      tipo: (question?.tipo ?? 'text') as QuestionType,
      puntos: String(question?.puntos ?? 1),
      orden: String(question?.orden ?? 0),
      pageNumber: String(question?.pageNumber ?? 1),
      configJson: question?.config ? JSON.stringify(question.config, null, 2) : '',
      bboxJson: question?.bbox ? JSON.stringify(question.bbox, null, 2) : ''
    });
  }, [open, examId, question, form]);

  const parseJsonField = (value?: string) => {
    if (value === undefined) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch (error) {
      throw new Error('JSON inválido. Revisa la sintaxis.');
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    let config;
    let bbox;

    try {
      config = parseJsonField(values.configJson);
    } catch (error) {
      form.setError('configJson', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'Config JSON inválido'
      });
      return;
    }

    try {
      bbox = parseJsonField(values.bboxJson);
    } catch (error) {
      form.setError('bboxJson', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'BBox JSON inválido'
      });
      return;
    }

    const payload = {
      examId,
      pageNumber: Number(values.pageNumber),
      tipo: values.tipo,
      title: values.title,
      prompt: values.prompt,
      puntos: Number(values.puntos),
      orden: Number(values.orden),
      config: config ?? null,
      bbox: bbox ?? null
    } as const;

    if (mode === 'create') {
      await createQuestion.mutateAsync(payload);
      form.reset({
        examId,
        title: '',
        prompt: '',
        tipo: 'text',
        puntos: '1',
        orden: '0',
        pageNumber: '1',
        configJson: '',
        bboxJson: ''
      });
      return;
    }

    if (question) {
      await updateQuestion.mutateAsync({ id: question.id, ...payload });
    }
  });

  const isSubmitting = createQuestion.isPending || updateQuestion.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Nueva pregunta' : 'Editar pregunta'}</DialogTitle>
          <DialogDescription>
            Define el enunciado y ajusta configuraciones avanzadas en formato JSON.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título interno</FormLabel>
                    <FormControl>
                      <Input placeholder="Pregunta 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de pregunta</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Respuesta abierta</SelectItem>
                        <SelectItem value="code">Código</SelectItem>
                        <SelectItem value="file_upload">Carga de archivo</SelectItem>
                        <SelectItem value="multiple_choice">Selección múltiple</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enunciado</FormLabel>
                  <FormControl>
                    <Textarea rows={5} placeholder="Describe la consigna para los estudiantes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="puntos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puntaje</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="orden"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orden</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pageNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de página</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Configuración avanzada</h3>
                <p className="text-sm text-muted-foreground">
                  Complementa la pregunta con parámetros opcionales como límites de respuesta, código inicial o
                  coordenadas para exámenes escaneados. Puedes dejar estos campos vacíos si no aplican.
                </p>
              </div>
              <FormField
                control={form.control}
                name="configJson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Config JSON (opcional)</FormLabel>
                    <FormControl>
                      <Textarea rows={6} placeholder="{ &quot;language&quot;: &quot;javascript&quot; }" {...field} />
                    </FormControl>
                    <FormDescription>
                      Usa este JSON para definir parámetros específicos del tipo de pregunta (máximos, opciones,
                      starterCode, etc.). Déjalo vacío para utilizar la configuración por defecto.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bboxJson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bounding box JSON (opcional)</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="{ &quot;x&quot;: 120, &quot;y&quot;: 200, &quot;width&quot;: 300, &quot;height&quot;: 150 }" {...field} />
                    </FormControl>
                    <FormDescription>
                      Define las coordenadas en la página para vincular la pregunta con una zona del examen físico. Déjalo
                      vacío si no necesitas esta referencia.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear pregunta' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
