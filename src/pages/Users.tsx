import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAdminUsers } from '@/hooks/use-admin-users';
import { useToast } from '@/hooks/use-toast';
import type { AdminUser, AdminUserRole } from '@/types/user';
import { UserEnrollmentDialog } from '@/components/admin/UserEnrollmentDialog';

const ROLE_LABELS: Record<AdminUserRole, string> = {
  admin: 'Administrador',
  docente: 'Docente',
  estudiante: 'Estudiante'
};

const ROLE_FILTER_OPTIONS: Array<{ label: string; value: 'all' | AdminUserRole }> = [
  { label: 'Todos', value: 'all' },
  { label: ROLE_LABELS.admin, value: 'admin' },
  { label: ROLE_LABELS.docente, value: 'docente' },
  { label: ROLE_LABELS.estudiante, value: 'estudiante' }
];

export default function Users() {
  const { toast } = useToast();
  const {
    users,
    isLoading,
    isError,
    error,
    filters,
    pagination,
    updateSearch,
    updateRole,
    updatePage,
    refetch
  } = useAdminUsers();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (isError) {
      toast({
        variant: 'destructive',
        title: 'Error al cargar usuarios',
        description: error instanceof Error ? error.message : 'Intenta nuevamente más tarde.'
      });
    }
  }, [error, isError, toast]);

  const totalUsers = pagination?.total ?? 0;

  const handleEnrollClick = (user: AdminUser) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedUser(null);
    }
  };

  const tableContent = useMemo(() => {
    if (isLoading) {
      return (
        <TableBody>
          {[...Array(5)].map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="h-4 w-48 bg-muted rounded animate-pulse" />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              </TableCell>
              <TableCell className="hidden lg:table-cell text-right">
                <div className="h-4 w-16 bg-muted rounded animate-pulse ml-auto" />
              </TableCell>
              <TableCell className="text-right">
                <div className="h-9 w-24 bg-muted rounded animate-pulse ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      );
    }

    if (users.length === 0) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
              No se encontraron usuarios con los filtros aplicados.
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    return (
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">
              <div className="flex flex-col">
                <span>{user.email}</span>
                <span className="text-xs text-muted-foreground">
                  Registrado el {new Date(user.createdAt).toLocaleString()}
                </span>
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Nunca'}
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Cursos asignados: {user.stats.coursesAsDocente}</div>
                <div>Matriculas activas: {user.stats.enrollments}</div>
              </div>
            </TableCell>
            <TableCell className="hidden lg:table-cell text-right">
              <span className="text-sm text-muted-foreground">{user.id}</span>
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                size="sm"
                disabled={user.role !== 'estudiante'}
                onClick={() => handleEnrollClick(user)}
              >
                Matricular
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    );
  }, [isLoading, users]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de usuarios</h1>
        <p className="text-muted-foreground">
          Controla los perfiles registrados y matricula estudiantes en los cursos disponibles.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Usuarios registrados</CardTitle>
          <CardDescription>
            {totalUsers} usuarios encontrados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label htmlFor="search" className="text-sm font-medium text-muted-foreground">
                Buscar por correo
              </label>
              <Input
                id="search"
                placeholder="admin@evaluacode.com"
                value={filters.search ?? ''}
                onChange={(event) => updateSearch(event.target.value)}
              />
            </div>
            <div className="w-full md:w-56">
              <label htmlFor="role" className="text-sm font-medium text-muted-foreground">
                Filtrar por rol
              </label>
              <Select
                value={filters.role ?? 'all'}
                onValueChange={(value) =>
                  updateRole(value === 'all' ? undefined : (value as AdminUserRole))
                }
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_FILTER_OPTIONS.map((option) => (
                    <SelectItem key={option.label} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Rol</TableHead>
                  <TableHead className="hidden md:table-cell">Último acceso</TableHead>
                  <TableHead className="hidden lg:table-cell">Actividad</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">ID</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              {tableContent}
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Página {pagination?.page ?? 1} de {pagination?.totalPages ?? 1}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination?.hasPrev}
                onClick={() => pagination?.hasPrev && updatePage((pagination?.page ?? 1) - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination?.hasNext}
                onClick={() => pagination?.hasNext && updatePage((pagination?.page ?? 1) + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <UserEnrollmentDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        user={selectedUser}
        onEnrolled={() => refetch()}
      />
    </div>
  );
}
