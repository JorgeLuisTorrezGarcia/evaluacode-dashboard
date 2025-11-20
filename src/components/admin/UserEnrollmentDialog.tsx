import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import type { Course } from '@/types/course';
import type { AdminUser } from '@/types/user';

interface UserEnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  onEnrolled: () => void;
}

export function UserEnrollmentDialog({ open, onOpenChange, user, onEnrolled }: UserEnrollmentDialogProps) {
  const [selectedCourse, setSelectedCourse] = useState<string>('');

  const { data: coursesResponse, isLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async (): Promise<{ courses: Course[] }> => {
      const response = await apiClient.get('/api/courses?limit=50');
      return response.data.data;
    },
    enabled: open && !!user
  });

  const handleEnroll = async () => {
    if (!user || !selectedCourse) {
      toast({
        title: 'Selecciona un curso',
        description: 'Debes elegir un curso para matricular al estudiante.',
        variant: 'destructive'
      });
      return;
    }

    if (user.role !== 'estudiante') {
      toast({
        title: 'Rol incompatible',
        description: 'Solo los estudiantes pueden ser matriculados en cursos.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await apiClient.post('/api/admin/enrollments', {
        courseId: selectedCourse,
        studentId: user.id
      });

      toast({
        title: 'Estudiante matriculado',
        description: `${user.email} se matriculó correctamente.`
      });

      onEnrolled();
      onOpenChange(false);
      setSelectedCourse('');
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message ??
            'No fue posible matricular al estudiante.'
          : 'No fue posible matricular al estudiante.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Matricular estudiante</DialogTitle>
          <DialogDescription>
            {user ? `Selecciona un curso para matricular a ${user.email}` : 'Selecciona un estudiante'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="course">Curso</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={isLoading}>
              <SelectTrigger id="course">
                <SelectValue placeholder={isLoading ? 'Cargando cursos...' : 'Selecciona un curso'} />
              </SelectTrigger>
              <SelectContent>
                {coursesResponse?.courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.nombre} ({course.codigo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleEnroll} disabled={!selectedCourse || isLoading || !user} className="w-full">
            Matricular
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
