import * as React from "react";

import { supabase } from "@/lib/supabase";

import { useToast } from "@/components/ui/use-toast";

import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import Selectable from "@/components/ui/CustomSelect/Select";
import { Loading } from "@/components";

import { getColumns } from "./columns";

import { MusicDTO, MusicTagsDTO } from "@/dtos";

import { TAGS_MOCK } from "@/MOCK_DATA";

import Select from "node_modules/react-select/dist/declarations/src/Select";
import { GroupBase } from "react-select";
import { ChevronDown, RotateCw } from "lucide-react";

type MusicTableProps = {
  data: MusicTagsDTO[];
  onRefresh: () => void;
};

export function MusicTable({ data, onRefresh }: MusicTableProps) {
  const isLoading = false;

  const { toast } = useToast();

  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "title",
      desc: false,
    },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const [editingCell, setEditingCell] = React.useState<{
    rowId: string;
    column: string;
    isEditing: boolean;
  }>({} as { rowId: string; column: string; isEditing: boolean });

  const selectedTags =
    React.createRef<Select<unknown, boolean, GroupBase<unknown>>>();

  const updateTitle = React.useCallback(async ({ id, title }: MusicDTO) => {
    try {
      const { error } = await supabase
        .from("music")
        .update({ title })
        .eq("id", id);
      if (error) throw new Error(error.message);

      toast({
        title: `Changed music title to '${title}'`,
      });
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: error.name,
          description: error.message,
          variant: "destructive",
        });
      }
    }
  }, []);

  const updateTags = React.useCallback(
    async ({ id, title, tags }: MusicTagsDTO) => {
      try {
        const { error } = await supabase.rpc("update_music_tags", {
          p_music_id: id,
          p_new_tags: tags,
        });
        if (error) throw new Error(error.message);

        toast({
          title: `'${title}' tags have been updated`,
        });
      } catch (error) {
        if (error instanceof Error) {
          toast({
            title: error.name,
            description: error.message,
            variant: "destructive",
          });
        }
      }
    },
    [],
  );

  const onDelete = React.useCallback(async (id: string, title: string) => {
    try {
      const { data, error } = await supabase
        .from("music")
        .delete()
        .eq("id", id);
      if (error) throw new Error(error.message);

      console.log(data);

      toast({
        title: `Music '${title}' has been successfully deleted`,
      });
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: error.name,
          description: error.message,
          variant: "destructive",
        });
      }
    }
  }, []);

  const columns = React.useMemo(
    () =>
      getColumns({
        selectedTags,
        editingCell,
        setEditingCell,
        updateTitle,
        updateTags,
        onDelete,
      }),
    [editingCell, onDelete, selectedTags, updateTags, updateTitle],
  );

  const tags = TAGS_MOCK;

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  const tableRow = isLoading ? (
    <TableRow>
      <TableCell colSpan={columns.length} className="h-24 text-center">
        <Loading iconClasses="h-6 w-6" />
      </TableCell>
    </TableRow>
  ) : (
    <TableRow>
      <TableCell colSpan={columns.length} className="h-24 text-center">
        No results.
      </TableCell>
    </TableRow>
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-8 py-4">
        <div className="flex flex-1 gap-4">
          <Input
            placeholder={"Filter titles..."}
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("title")?.setFilterValue(event.target.value)
            }
            className="max-w-72"
          />

          <Selectable
            isMulti
            placeholder={"Filter tags..."}
            options={tags.map((t) => {
              return { label: t.name, value: t.name };
            })}
            onChange={(event) => {
              table
                .getColumn("tags")
                ?.setFilterValue(
                  (event as { label: string; value: string }[]).map(
                    (e) => e.value,
                  ),
                );
            }}
            className="flex-1"
          />
        </div>

        <div className="flex items-center justify-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" className="group" onClick={onRefresh}>
            <RotateCw className="h-4 w-4 font-medium group-hover:animate-spin-once" />
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length
              ? table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : tableRow}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} item(s) found
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
