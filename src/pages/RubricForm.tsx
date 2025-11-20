import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import type { AxiosErrorResponse } from '@/types/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';

const criterionSchema = z.object({
  titulo: z.string().min(1, 'El título del criterio es requerido'),
  descripcion: z.string().optional(),
  puntajeMaximo: z.number().positive('El puntaje debe ser positivo'),
});

const rubricSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  descripcion: z.string().optional(),
  courseId: z.string().optional(),
  examId: z.string().min(1, 'El examen es requerido'),
  criterios: z.array(criterionSchema).optional(),
});

type RubricFormValues = z.infer<typeof rubricSchema>;

interface Course {
  id: string;
  nombre: string;
}

interface Exam {
  id: string;
  titulo: string;
}

export default function RubricForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);
  const [selectedCourse, setSelectedCourse] = useState<string | undefined>();

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['courses', 'all'],
    queryFn: async () => {
      const response = await apiClient.get('/api/courses?limit=1000');
      return response.data.data.courses;
    },
  });

  const { data: exams = [] } = useQuery<Exam[]>({
    queryKey: ['exams', 'byCourse', selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return [];
      const response = await apiClient.get(`/api/exams?courseId=${selectedCourse}&limit=1000`);
      return response.data.data.exams;
    },
    enabled: !!selectedCourse,
  });

  const { data: rubricData } = useQuery({
    queryKey: ['rubric', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/rubrics/${id}`);
      return response.data.data;
    },
    enabled: isEditMode,
  });

  const form = useForm<RubricFormValues>({
    resolver: zodResolver(rubricSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      criterios: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'criterios',
  });

  useEffect(() => {
    if (rubricData) {
      form.reset(rubricData);
      setSelectedCourse(rubricData.courseId);
    }
  }, [rubricData, form]);

  const mutation = useMutation({
    mutationFn: async (data: RubricFormValues) => {
      const url = isEditMode ? `/api/rubrics/${id}` : '/api/rubrics';
      const method = isEditMode ? 'put' : 'post';
      const response = await apiClient[method](url, data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: `Rúbrica ${isEditMode ? 'actualizada' : 'creada'}`,
        description: `La rúbrica ha sido ${isEditMode ? 'actualizada' : 'creada'} correctamente.`,
      });
      queryClient.invalidateQueries({ queryKey: ['rubrics'] });
      queryClient.invalidateQueries({ queryKey: ['rubric', id] });
      navigate('/rubrics');
    },
    onError: (error: AxiosErrorResponse) => {
      toast({
        title: `Error al ${isEditMode ? 'actualizar' : 'crear'} la rúbrica`,
        description: error.response?.data?.message || 'Ocurrió un error inesperado.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: RubricFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="max-w-4xl mx-auto shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl">{isEditMode ? 'Editar Rúbrica' : 'Crear Nueva Rúbrica'}</CardTitle>
          <CardDescription>
            {isEditMode ? 'Actualiza los detalles de la rúbrica.' : 'Rellena el formulario para añadir una nueva rúbrica.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Rúbrica</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Rúbrica para Ensayo Final" {...field} />
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
                      <Textarea placeholder="Una breve descripción de la rúbrica" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Curso</FormLabel>
                      <Select onValueChange={(value) => { field.onChange(value); setSelectedCourse(value); }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un curso" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>{course.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="examId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Examen</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCourse || exams.length === 0}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un examen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {exams.map((exam) => (
                            <SelectItem key={exam.id} value={exam.id}>{exam.titulo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Criterios de Evaluación</h3>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <Card key={field.id} className="p-4 relative">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`criterios.${index}.titulo`}
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Título del Criterio</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`criterios.${index}.puntajeMaximo`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Puntaje Máx.</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
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
                        name={`criterios.${index}.descripcion`}
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Descripción del Criterio (Opcional)</FormLabel>
                            <FormControl><Textarea {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="button" variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </Card>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ titulo: '', descripcion: '', puntajeMaximo: 10 })}
                  className="w-full border-dashed mt-4"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Agregar criterio
                </Button>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/rubrics')}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditMode ? 'Actualizar' : 'Crear'} Rúbrica
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
