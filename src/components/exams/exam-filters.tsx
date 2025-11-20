import { Search, ListFilter } from 'lucide-react';
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
import type { ExamFilters as Filters } from '@/types/exam';

interface ExamFiltersProps {
  filters: Filters;
  onSearchChange: (search: string) => void;
  onFilterChange: (newFilters: Partial<Filters>) => void;
  onResetFilters: () => void;
}

export function ExamFilters({
  filters,
  onSearchChange,
  onFilterChange,
  onResetFilters,
}: ExamFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar exámenes por título..."
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 w-full sm:w-auto">
            <ListFilter className="h-4 w-4" />
            Filtrar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Filtrar por tipo</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={filters.tipo === 'teorico'}
            onCheckedChange={() => onFilterChange({ tipo: filters.tipo === 'teorico' ? null : 'teorico' })}
          >
            Teórico
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.tipo === 'practico'}
            onCheckedChange={() => onFilterChange({ tipo: filters.tipo === 'practico' ? null : 'practico' })}
          >
            Práctico
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.tipo === 'mixto'}
            onCheckedChange={() => onFilterChange({ tipo: filters.tipo === 'mixto' ? null : 'mixto' })}
          >
            Mixto
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
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
    </div>
  );
}
