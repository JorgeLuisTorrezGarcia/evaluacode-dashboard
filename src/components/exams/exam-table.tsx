import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
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
import type { Exam } from '@/types/exam';

interface ExamTableProps {
  exams: Exam[];
  isLoading?: boolean;
}

export function ExamTable({ exams, isLoading }: ExamTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead className="hidden sm:table-cell">Curso</TableHead>
              <TableHead className="hidden md:table-cell">Tipo</TableHead>
              <TableHead className="hidden lg:table-cell">Apertura</TableHead>
              <TableHead className="hidden lg:table-cell">Cierre</TableHead>
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
                  <div className="h-4 bg-muted rounded animate-pulse w-20" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="h-6 bg-muted rounded-full animate-pulse w-16" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="h-4 bg-muted rounded animate-pulse w-24" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="h-4 bg-muted rounded animate-pulse w-24" />
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

  if (exams.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead className="hidden sm:table-cell">Curso</TableHead>
              <TableHead className="hidden md:table-cell">Tipo</TableHead>
              <TableHead className="hidden lg:table-cell">Apertura</TableHead>
              <TableHead className="hidden lg:table-cell">Cierre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FileText className="h-8 w-8" />
                  <p>No se encontraron exámenes que coincidan con los filtros aplicados.</p>
                </div>
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
            <TableHead>Título</TableHead>
            <TableHead className="hidden sm:table-cell">Curso</TableHead>
            <TableHead className="hidden md:table-cell">Tipo</TableHead>
            <TableHead className="hidden lg:table-cell">Apertura</TableHead>
            <TableHead className="hidden lg:table-cell">Cierre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exams.map((exam) => (
            <TableRow key={exam.id}>
              <TableCell className="font-medium">
                <div>
                  <div>{exam.titulo}</div>
                  {exam.descripcion && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {exam.descripcion}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {exam.course.nombre}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="outline">
                  {exam.tipo === 'teorico' ? 'Teórico' : 
                   exam.tipo === 'practico' ? 'Práctico' : 'Mixto'}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {new Date(exam.fechaApertura).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {new Date(exam.fechaCierre).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </TableCell>
              <TableCell>
                <Badge variant={exam.isActive ? 'default' : 'destructive'}>
                  {exam.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Link to={`/exams/${exam.id}`}>
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
