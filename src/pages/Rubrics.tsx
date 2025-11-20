import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Plus, Search, ClipboardList } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useDebounce } from '@/hooks/use-debounce';

interface Rubric {
  id: string;
  nombre: string;
  descripcion: string;
  courseId: string;
  examId: string;
  course?: {
    nombre: string;
  };
  exam?: {
    titulo: string;
  };
}

interface RubricsResponse {
  items: Rubric[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function Rubrics() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, isError } = useQuery<RubricsResponse>({
    queryKey: ['rubrics', page, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
      });
      if (debouncedSearch) params.append('search', debouncedSearch);

      const response = await apiClient.get('/api/rubrics', { params });
      return response.data.data;
    },
    placeholderData: (previousData) => previousData,
  });

  const canCreate = user?.role === 'admin' || user?.role === 'docente';
  const rubrics = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Rúbricas</h1>
          <p className="text-muted-foreground mt-1">
            Explora, gestiona y crea rúbricas de evaluación.
          </p>
        </div>
        {canCreate && (
          <Link to="/rubrics/new">
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Crear Rúbrica
            </Button>
          </Link>
        )}
      </div>

      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle>Lista de Rúbricas</CardTitle>
          <CardDescription>
            Una lista de todas las rúbricas en el sistema.
          </CardDescription>
          <div className="flex items-center gap-4 pt-4">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">Examen Asociado</TableHead>
                  <TableHead className="hidden md:table-cell">Curso</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4} className="h-12 text-center">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-destructive"
                    >
                      No se pudieron cargar las rúbricas.
                    </TableCell>
                  </TableRow>
                ) : rubrics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <ClipboardList className="h-8 w-8 text-muted-foreground" />
                        <p>No se encontraron rúbricas.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rubrics.map((rubric) => (
                    <TableRow key={rubric.id}>
                      <TableCell className="font-medium">{rubric.nombre}</TableCell>
                      <TableCell className="hidden sm:table-cell">{rubric.exam?.titulo}</TableCell>
                      <TableCell className="hidden md:table-cell">{rubric.course?.nombre}</TableCell>
                      <TableCell className="text-right">
                        <Link to={`/rubrics/${rubric.id}`}>
                          <Button variant="outline" size="sm">
                            Ver
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  size="sm"
                  className={
                    page <= 1 ? 'pointer-events-none opacity-50' : ''
                  }
                >
                  <PaginationPrevious />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <span className="p-2 text-sm">
                  Página {pagination?.page ?? page} de {pagination?.totalPages ?? 1}
                </span>
              </PaginationItem>
              <PaginationItem>
                <Button
                  onClick={() =>
                    setPage((p) =>
                      pagination ? Math.min(pagination.totalPages || 1, p + 1) : p + 1
                    )
                  }
                  size="sm"
                  className={
                    page >= (pagination?.totalPages || 1)
                      ? 'pointer-events-none opacity-50'
                      : ''
                  }
                >
                  <PaginationNext />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardContent>
      </Card>
    </div>
  );
}
