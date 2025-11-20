import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Course } from '@/types/course';

interface CourseTableProps {
  courses: Course[];
  isLoading?: boolean;
}

export function CourseTable({ courses, isLoading }: CourseTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">Código</TableHead>
              <TableHead className="hidden md:table-cell">Periodo</TableHead>
              <TableHead className="hidden lg:table-cell">Semestre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="h-4 bg-muted rounded animate-pulse w-16" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="h-4 bg-muted rounded animate-pulse w-20" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="h-4 bg-muted rounded animate-pulse w-8" />
                </TableCell>
                <TableCell>
                  <div className="h-6 bg-muted rounded-full animate-pulse w-16" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="h-8 bg-muted rounded animate-pulse w-16 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">Código</TableHead>
              <TableHead className="hidden md:table-cell">Periodo</TableHead>
              <TableHead className="hidden lg:table-cell">Semestre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No se encontraron cursos que coincidan con los filtros aplicados.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead className="hidden sm:table-cell">Código</TableHead>
            <TableHead className="hidden md:table-cell">Periodo</TableHead>
            <TableHead className="hidden lg:table-cell">Semestre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.id}>
              <TableCell className="font-medium">
                <div>
                  <div className="font-medium">{course.nombre}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1">
                    {course.descripcion}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {course.codigo}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {course.periodo}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {course.semestre}
              </TableCell>
              <TableCell>
                <Badge
                  variant={course.isActive ? 'default' : 'destructive'}
                >
                  {course.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Link to={`/courses/${course.id}`}>
                  <Button variant="outline" size="sm">
                    Ver
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
