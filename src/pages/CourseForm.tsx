import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
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
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const courseSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  codigo: z.string().min(2, 'El código debe tener al menos 2 caracteres').regex(/^[A-Z0-9-]+$/, 'Solo letras mayúsculas, números y guiones'),
  descripcion: z.string().optional(),
  periodo: z.string().min(4, 'El período es requerido'),
  semestre: z.number().int().min(1, 'Semestre debe ser mínimo 1').max(12, 'Semestre debe ser máximo 12'),
  creditos: z.number().int().min(1, 'Créditos debe ser mínimo 1').max(10, 'Créditos debe ser máximo 10'),
});

type CourseFormValues = z.infer<typeof courseSchema>;

const FormSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-24 w-full" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
);

export default function CourseForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  const { data: courseData, isLoading: isLoadingCourse } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/courses/${id}`);
      return response.data.data;
    },
    enabled: isEditMode,
  });

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      nombre: '',
      codigo: '',
      descripcion: '',
      periodo: '2024-1',
      semestre: 1,
      creditos: 1,
    },
  });

  useEffect(() => {
    if (isEditMode && courseData) {
      form.reset(courseData);
    }
  }, [courseData, isEditMode, form]);

  const mutation = useMutation({
    mutationFn: async (data: CourseFormValues) => {
      const url = isEditMode ? `/api/courses/${id}` : '/api/courses';
      const method = isEditMode ? 'put' : 'post';
      const response = await apiClient[method](url, data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: `Curso ${isEditMode ? 'actualizado' : 'creado'}`,
        description: `El curso ha sido ${isEditMode ? 'actualizado' : 'creado'} correctamente.`,
      });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      navigate(isEditMode ? `/courses/${id}` : '/courses');
    },
    onError: (error: AxiosErrorResponse) => {
      toast({
        title: `Error al ${isEditMode ? 'actualizar' : 'crear'} el curso`,
        description: error.response?.data?.message || 'Ocurrió un error inesperado.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CourseFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="max-w-3xl mx-auto shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl">{isEditMode ? 'Editar Curso' : 'Crear Nuevo Curso'}</CardTitle>
          <CardDescription>
            {isEditMode ? 'Actualiza los detalles del curso.' : 'Rellena el formulario para añadir un nuevo curso.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCourse && isEditMode ? (
            <FormSkeleton />
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Curso</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Programación Avanzada" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código del Curso</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: PROG301" {...field} />
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
                        <Textarea placeholder="Una breve descripción del curso" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="periodo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Periodo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: 2024-1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="semestre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semestre</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Ej: 3" 
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
                    name="creditos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Créditos</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Ej: 4" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(isEditMode ? `/courses/${id}` : '/courses')}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isEditMode ? 'Guardar Cambios' : 'Crear Curso'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
