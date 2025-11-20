import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Course } from '@/types/course';
import { useAuthStore } from '@/stores/auth-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  FileText, 
  BookOpen, 
  GraduationCap, 
  Upload, 
  Settings,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import FileUpload from '@/components/courses/file-upload';

interface CourseTabsProps {
  course: Course & {
    enrollments?: Array<{
      id: string;
      student: {
        id: string;
        email: string;
        createdAt: string;
      };
      enrolledAt: string;
      status: string;
      finalGrade?: number | null;
    }>;
    exams?: Array<{
      id: string;
      title?: string;
      descripcion?: string;
      fechaApertura: string;
      fechaCierre: string;
      duracionMinutos: number;
      intentosPermitidos: number;
      isActive: boolean;
      createdAt: string;
    }>;
    students?: Array<{
      id: string;
      email: string;
      createdAt: string;
    }>;
    files?: Array<{
      id: string;
      fileName: string;
      originalName: string;
      fileSize: number;
      mimeType: string;
      category: string;
      description?: string;
      isPublic: boolean;
      createdAt: string;
    }>;
    enrollmentCount?: number;
  };
  initialTab?: string;
}

export default function CourseTabs({ course, initialTab = 'overview' }: CourseTabsProps) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Determine user permissions
  const isDocente = user?.role === 'docente' && user.id === course.docente?.id;
  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'estudiante';
  const canManage = isDocente || isAdmin;

  // Get available tabs based on role
  const getAvailableTabs = () => {
    const baseTabs = [
      { id: 'overview', label: 'Resumen', icon: BookOpen },
    ];

    if (canManage) {
      baseTabs.push(
        { id: 'students', label: 'Estudiantes', icon: Users },
        { id: 'exams', label: 'Exámenes', icon: FileText },
        { id: 'files', label: 'Archivos', icon: Upload },
        { id: 'rubrics', label: 'Rúbricas', icon: Settings }
      );
    } else if (isStudent) {
      baseTabs.push(
        { id: 'exams', label: 'Mis Exámenes', icon: FileText },
        { id: 'files', label: 'Materiales', icon: Upload }
      );
    }

    return baseTabs;
  };

  const tabs = getAvailableTabs();

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estudiantes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{course.enrollmentCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Estudiantes matriculados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Exámenes</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{course.exams?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Exámenes creados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Archivos</CardTitle>
                <Upload className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{course.files?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Recursos disponibles
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Período</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{course.periodo}</div>
                <p className="text-xs text-muted-foreground">
                  Semestre {course.semestre} • {course.creditos} créditos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {course.exams?.slice(0, 3).map((exam) => (
                  <div key={exam.id} className="flex items-start gap-4">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{exam.title || 'Examen sin título'}</p>
                      <p className="text-xs text-muted-foreground">
                        Creado {format(new Date(exam.createdAt), 'PPp', { locale: es })}
                      </p>
                    </div>
                    <Badge variant={exam.isActive ? 'default' : 'secondary'}>
                      {exam.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                ))}
                {(!course.exams || course.exams.length === 0) && (
                  <p className="text-sm text-muted-foreground">No hay actividad reciente</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        {canManage && (
          <TabsContent value="students" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Estudiantes Matriculados</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Matricular Estudiante
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {course.enrollments?.map((enrollment) => (
                    <div key={enrollment.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{enrollment.student.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Matriculado {format(new Date(enrollment.enrolledAt), 'PPp', { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                          {enrollment.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                        {enrollment.finalGrade && (
                          <Badge variant="outline">
                            {enrollment.finalGrade}/100
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!course.enrollments || course.enrollments.length === 0) && (
                    <div className="p-8 text-center">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No hay estudiantes matriculados</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Exams Tab */}
        <TabsContent value="exams" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {canManage ? 'Gestión de Exámenes' : 'Mis Exámenes'}
            </h3>
            {canManage && (
              <Button onClick={() => navigate(`/courses/${course.id}/exams/new`)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Examen
              </Button>
            )}
          </div>

          <div className="grid gap-4">
            {course.exams?.map((exam) => (
              <Card key={exam.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">
                        {exam.title || 'Examen sin título'}
                      </CardTitle>
                      {exam.descripcion && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {exam.descripcion}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={exam.isActive ? 'default' : 'secondary'}>
                        {exam.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                      {new Date() < new Date(exam.fechaApertura) && (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          Próximamente
                        </Badge>
                      )}
                      {new Date() > new Date(exam.fechaCierre) && (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Cerrado
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Apertura</p>
                      <p className="font-medium">
                        {format(new Date(exam.fechaApertura), 'PPp', { locale: es })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cierre</p>
                      <p className="font-medium">
                        {format(new Date(exam.fechaCierre), 'PPp', { locale: es })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duración</p>
                      <p className="font-medium">
                        {exam.duracionMinutos > 0 
                          ? `${exam.duracionMinutos} minutos`
                          : 'Sin límite'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Intentos permitidos: {exam.intentosPermitidos}
                    </p>
                    <div className="flex gap-2">
                      {isStudent && (
                        <Button size="sm" variant="outline">
                          Ver Detalles
                        </Button>
                      )}
                      {canManage && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/exams/${exam.id}/edit?courseId=${course.id}`)}
                          >
                            Editar
                          </Button>
                          <Button size="sm" variant="outline">
                            Rúbricas
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!course.exams || course.exams.length === 0) && (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay exámenes disponibles</p>
                  {canManage && (
                    <Button className="mt-4" onClick={() => navigate(`/courses/${course.id}/exams/new`)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Primer Examen
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {canManage ? 'Gestión de Archivos' : 'Materiales del Curso'}
            </h3>
            {canManage && (
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Subir Archivo
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {course.files?.filter(file => isStudent ? file.isPublic : true)
                  .map((file) => (
                    <div key={file.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Upload className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{file.originalName}</p>
                          <p className="text-sm text-muted-foreground">
                            {file.description || 'Sin descripción'} • {(file.fileSize / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{file.category}</Badge>
                        {!file.isPublic && canManage && (
                          <Badge variant="secondary">Privado</Badge>
                        )}
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={file.downloadUrl ?? file.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                          >
                            Descargar
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                {(!course.files || course.files.length === 0) && (
                  <div className="p-8 text-center">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay archivos disponibles</p>
                    {canManage && (
                      <Button className="mt-4" onClick={() => setIsUploadDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Subir Primer Archivo
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rubrics Tab */}
        {canManage && (
          <TabsContent value="rubrics" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Rúbricas de Evaluación</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crear Rúbrica
              </Button>
            </div>

            <Card>
              <CardContent className="p-8 text-center">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Las rúbricas permiten configurar criterios de evaluación automática con IA</p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Rúbrica
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {canManage && (
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Subir archivo al curso</DialogTitle>
              <DialogDescription>
                Comparte materiales, asignaciones o recursos adicionales con tus estudiantes.
              </DialogDescription>
            </DialogHeader>
            <FileUpload
              courseId={course.id}
              onUploadComplete={() => setIsUploadDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
