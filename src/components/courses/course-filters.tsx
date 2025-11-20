import { Search, ListFilter, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import type { CourseFilters as Filters } from '@/types/course';

interface CourseFiltersProps {
  filters: Filters;
  onSearchChange: (search: string) => void;
  onFilterChange: (newFilters: Partial<Filters>) => void;
  onResetFilters: () => void;
}

export function CourseFilters({
  filters,
  onSearchChange,
  onFilterChange,
  onResetFilters,
}: CourseFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar cursos por nombre, código o descripción..."
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 w-full sm:w-auto">
            <ListFilter className="h-4 w-4" />
            Filtrar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={filters.isActive === true}
            onCheckedChange={() => onFilterChange({ isActive: filters.isActive === true ? null : true })}
          >
            Activo
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.isActive === false}
            onCheckedChange={() => onFilterChange({ isActive: filters.isActive === false ? null : false })}
          >
            Inactivo
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem onCheckedChange={onResetFilters}>
            Limpiar filtros
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* New Course Button */}
      <Link to="/courses/new">
        <Button className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Nuevo curso
        </Button>
      </Link>
    </div>
  );
}
