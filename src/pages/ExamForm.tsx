import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import type { AxiosErrorResponse } from '@/types/api';
import { useCourses } from '@/hooks/use-courses';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';

const examSchema = z.object({
  courseId: z.string().min(1, 'El curso es requerido'),
  titulo: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  descripcion: z.string().optional(),
  tipo: z.enum(['teorico', 'practico', 'mixto']),
  fechaApertura: z.date(),
  fechaCierre: z.date(),
  duracionMinutos: z.number().int().min(0, 'La duración debe ser 0 o positiva'),
  puntuacionMaxima: z.number().min(1, 'La puntuación máxima debe ser mínimo 1'),
  intentosPermitidos: z.number().int().min(1, 'Se requiere al menos 1 intento'),
  isActive: z.boolean().default(true),
}).refine((data) => data.fechaCierre > data.fechaApertura, {
  message: "La fecha de cierre debe ser posterior a la de apertura",
  path: ["fechaCierre"],
});

type ExamFormValues = z.infer<typeof examSchema>;

export default function ExamForm() {
  const { id, courseId: courseIdFromParams } = useParams<{ id?: string; courseId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);
  const courseIdFromQuery = searchParams.get('courseId');
  const courseContextId = courseIdFromParams ?? courseIdFromQuery ?? '';
  const isCourseScoped = Boolean(courseContextId);

  const { courses } = useCourses();

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      courseId: courseContextId,
      titulo: '',
      descripcion: '',
      tipo: 'mixto',
      fechaApertura: new Date(),
      fechaCierre: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días después
      duracionMinutos: 60,
      puntuacionMaxima: 100,
      intentosPermitidos: 1,
      isActive: true,
    },
  });

  useEffect(() => {
    if (isCourseScoped) {
      form.setValue('courseId', courseContextId);
    }
  }, [form, courseContextId, isCourseScoped]);

  const mutation = useMutation({
    mutationFn: async (data: ExamFormValues) => {
      const payload = {
        ...data,
        fechaApertura: data.fechaApertura.toISOString(),
        fechaCierre: data.fechaCierre.toISOString(),
      };
      
      const url = isEditMode ? `/api/exams/${id}` : '/api/exams';
      const method = isEditMode ? 'put' : 'post';
      const response = await apiClient[method](url, payload);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: `Examen ${isEditMode ? 'actualizado' : 'creado'}`,
        description: `El examen ha sido ${isEditMode ? 'actualizado' : 'creado'} correctamente.`,
      });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      if (isCourseScoped) {
        queryClient.invalidateQueries({ queryKey: ['course', courseContextId] });
        navigate(`/courses/${courseContextId}?tab=exams`);
      } else {
        navigate('/exams');
      }
    },
    onError: (error: AxiosErrorResponse) => {
      toast({
        title: `Error al ${isEditMode ? 'actualizar' : 'crear'} el examen`,
        description: error.response?.data?.message || 'Ocurrió un error inesperado.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ExamFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="max-w-4xl mx-auto shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl">{isEditMode ? 'Editar Examen' : 'Crear Nuevo Examen'}</CardTitle>
          <CardDescription>
            {isEditMode ? 'Actualiza los detalles del examen.' : 'Rellena el formulario para añadir un nuevo examen.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Curso</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={isCourseScoped}
                    >
                      <FormControl>
                        <SelectTrigger disabled={isCourseScoped}>
                          <SelectValue placeholder="Selecciona un curso" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses?.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.nombre} ({course.codigo})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isCourseScoped && (
                      <FormDescription>
                        Este examen se asociará a <strong>{courses?.find((course) => course.id === courseContextId)?.nombre ?? 'este curso'}</strong>.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título del Examen</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Examen Parcial de Programación" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Una breve descripción del examen" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="teorico">Teórico</SelectItem>
                          <SelectItem value="practico">Práctico</SelectItem>
                          <SelectItem value="mixto">Mixto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duracionMinutos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración (minutos)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="60" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        0 = Sin límite de tiempo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fechaApertura"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Apertura</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Elige una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fechaCierre"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Cierre</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Elige una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="puntuacionMaxima"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Puntuación Máxima</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="100" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="intentosPermitidos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intentos Permitidos</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Activo</FormLabel>
                      <FormDescription>
                        Si está marcado, el examen será visible para los estudiantes.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/exams')}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditMode ? 'Guardar Cambios' : 'Crear Examen'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
