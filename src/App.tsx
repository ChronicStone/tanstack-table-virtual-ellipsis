import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { faker } from '@faker-js/faker';

// ============ Ellipsis Component ============
interface EllipsisProps {
  children: React.ReactNode;
}

const Ellipsis: React.FC<EllipsisProps> = ({ children }) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const isOverflow = textRef.current.scrollWidth > textRef.current.clientWidth;
        setIsOverflowing(isOverflow);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [children]);

  return (
    <div className="relative">
      <div
        ref={textRef}
        className="truncate cursor-default"
        onMouseEnter={() => isOverflowing && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </div>
      {isOverflowing && showTooltip && (
        <div className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg -top-10 left-0 whitespace-nowrap max-w-md">
          {children}
          <div className="absolute w-2 h-2 bg-gray-900 rotate-45 -bottom-1 left-4"></div>
        </div>
      )}
    </div>
  );
};

// ============ Types ============
type EmployeeStatus = 'Active' | 'On Leave' | 'Remote';

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  description: string;
  status: EmployeeStatus;
}

// ============ Data Generation ============
const generateEmployees = (count: number): Employee[] => {
  faker.seed(123);
  const statuses: EmployeeStatus[] = ['Active', 'On Leave', 'Remote'];
  const departments = ['Engineering', 'Product', 'Sales', 'Design', 'Analytics', 'Executive', 'Marketing', 'HR'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: faker.person.jobTitle(),
    department: faker.helpers.arrayElement(departments),
    description: faker.lorem.sentence({ min: 5, max: 15 }),
    status: faker.helpers.arrayElement(statuses),
  }));
};

// ============ Pagination Controls Component ============
interface PaginationControlsProps {
  table: ReturnType<typeof useReactTable<Employee>>;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({ table }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} 
          {' '}({table.getFilteredRowModel().rows.length} total rows)
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <select
          value={table.getState().pagination.pageSize}
          onChange={e => table.setPageSize(Number(e.target.value))}
          className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[10, 25, 50, 100, 200, 500, 1000].map(size => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
        
        <div className="flex gap-1">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            ««
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            «
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            »
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            »»
          </button>
        </div>
        
        <span className="text-sm text-gray-700">Go to:</span>
        <input
          type="number"
          min="1"
          max={table.getPageCount()}
          defaultValue={table.getState().pagination.pageIndex + 1}
          onChange={e => {
            const page = e.target.value ? Number(e.target.value) - 1 : 0;
            table.setPageIndex(page);
          }}
          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

// ============ Main App ============
export default function App() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  const data = useMemo(() => generateEmployees(10000), []);

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 60,
        maxSize: 60,
        cell: info => <span className="font-medium">{info.getValue<number>()}</span>
      },
      {
        accessorKey: 'name',
        header: 'Name',
        size: 150,
        maxSize: 150,
        cell: info => <Ellipsis>{info.getValue<string>()}</Ellipsis>
      },
      {
        accessorKey: 'email',
        header: 'Email',
        size: 200,
        maxSize: 200,
        cell: info => <Ellipsis>{info.getValue<string>()}</Ellipsis>
      },
      {
        accessorKey: 'role',
        header: 'Role',
        size: 180,
        maxSize: 180,
        cell: info => <Ellipsis>{info.getValue<string>()}</Ellipsis>
      },
      {
        accessorKey: 'department',
        header: 'Department',
        size: 120,
        maxSize: 120,
        cell: info => <Ellipsis>{info.getValue<string>()}</Ellipsis>
      },
      {
        accessorKey: 'description',
        header: 'Description',
        size: 280,
        maxSize: 280,
        cell: info => <Ellipsis>{info.getValue<string>()}</Ellipsis>
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        maxSize: 100,
        cell: info => {
          const status = info.getValue<EmployeeStatus>();
          const colorMap = {
            Active: 'bg-green-100 text-green-800',
            'On Leave': 'bg-yellow-100 text-yellow-800',
            Remote: 'bg-blue-100 text-blue-800',
          };
          return (
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorMap[status]}`}>
              {status}
            </span>
          );
        }
      }
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const { rows } = table.getRowModel();
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 53,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom = virtualRows.length > 0 
    ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Directory</h1>
          <p className="text-gray-600 mb-4">10,000 employees with virtualization, sorting, and pagination</p>
          
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Search all columns..."
            className="px-4 py-2 border border-gray-300 rounded-lg w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div 
            ref={tableContainerRef}
            className="overflow-auto"
            style={{ height: '600px' }}
          >
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        style={{ 
                          width: `${header.getSize()}px`,
                          maxWidth: `${header.getSize()}px`
                        }}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-2">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: ' 🔼',
                            desc: ' 🔽',
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paddingTop > 0 && (
                  <tr>
                    <td style={{ height: `${paddingTop}px` }} />
                  </tr>
                )}
                {virtualRows.map(virtualRow => {
                  const row = rows[virtualRow.index];
                  return (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map(cell => (
                        <td
                          key={cell.id}
                          className="px-4 py-4 text-sm text-gray-900"
                          style={{ 
                            maxWidth: `${cell.column.getSize()}px`
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {paddingBottom > 0 && (
                  <tr>
                    <td style={{ height: `${paddingBottom}px` }} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <PaginationControls table={table} />
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p className="font-semibold mb-2">✨ Features:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>10,000 rows generated with Faker.js</li>
            <li>Virtual scrolling for performance (@tanstack/react-virtual)</li>
            <li>Pagination with customizable page size</li>
            <li>Column sorting (click headers)</li>
            <li>Global search filtering</li>
            <li>Ellipsis tooltips on overflow</li>
          </ul>
        </div>
      </div>
    </div>
  );
}