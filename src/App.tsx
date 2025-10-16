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
  type ColumnResizeMode,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { faker } from '@faker-js/faker';
import {
  MantineProvider,
  TextInput,
  Pagination,
  Select,
  Badge,
  Tooltip,
  Text,
} from '@mantine/core';
import { IconSearch, IconChevronUp, IconChevronDown } from '@tabler/icons-react';
import '@mantine/core/styles.css';

// ============ Ellipsis Component with Mantine Tooltip ============
interface EllipsisProps {
  children: React.ReactNode;
  columnWidth?: number;
}

const Ellipsis: React.FC<EllipsisProps> = ({ children, columnWidth }) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const isOverflow = textRef.current.scrollWidth > textRef.current.clientWidth;
        setIsOverflowing(isOverflow);
      }
    };

    checkOverflow();
    
    // Use ResizeObserver to detect when the container size changes
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (textRef.current) {
      resizeObserver.observe(textRef.current);
    }

    window.addEventListener('resize', checkOverflow);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, [children, columnWidth]); // Re-check when children or columnWidth changes

  const content = (
    <div
      ref={textRef}
      style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        cursor: 'default'
      }}
    >
      {children}
    </div>
  );

  if (!isOverflowing) {
    return content;
  }

  return (
    <Tooltip label={children} position="top" withArrow>
      {content}
    </Tooltip>
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

// ============ Main App ============
export default function App() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange');

  const data = useMemo(() => generateEmployees(10000), []);

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 60,
        maxSize: 60,
        cell: info => <Text fw={500}>{info.getValue<number>()}</Text>
      },
      {
        accessorKey: 'name',
        header: 'Name',
        size: 150,
        maxSize: 150,
        cell: info => <Ellipsis columnWidth={info.column.getSize()}>{info.getValue<string>()}</Ellipsis>
      },
      {
        accessorKey: 'email',
        header: 'Email',
        size: 200,
        maxSize: 200,
        cell: info => <Ellipsis columnWidth={info.column.getSize()}>{info.getValue<string>()}</Ellipsis>
      },
      {
        accessorKey: 'role',
        header: 'Role',
        size: 180,
        maxSize: 180,
        cell: info => <Ellipsis columnWidth={info.column.getSize()}>{info.getValue<string>()}</Ellipsis>
      },
      {
        accessorKey: 'department',
        header: 'Department',
        size: 120,
        maxSize: 120,
        cell: info => <Ellipsis columnWidth={info.column.getSize()}>{info.getValue<string>()}</Ellipsis>
      },
      {
        accessorKey: 'description',
        header: 'Description',
        size: 280,
        maxSize: 280,
        cell: info => <Ellipsis columnWidth={info.column.getSize()}>{info.getValue<string>()}</Ellipsis>
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        maxSize: 100,
        cell: info => {
          const status = info.getValue<EmployeeStatus>();
          const colorMap = {
            Active: 'green',
            'On Leave': 'yellow',
            Remote: 'blue',
          };
          return (
            <Badge color={colorMap[status]} variant="light">
              {status}
            </Badge>
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
    columnResizeMode,
    enableColumnResizing: true,
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
    <MantineProvider>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Directory</h1>
            <p className="text-gray-600 mb-4">10,000 employees with virtualization, sorting, and pagination</p>
            
            <TextInput
              placeholder="Search all columns..."
              leftSection={<IconSearch size={16} />}
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
              className="max-w-md"
            />
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div
              ref={tableContainerRef}
              className="overflow-auto"
              style={{ height: 600 }}
            >
              <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 relative select-none"
                          style={{ 
                            width: header.getSize(),
                          }}
                        >
                          <div
                            onClick={header.column.getToggleSortingHandler()}
                            className="cursor-pointer pr-2 flex items-center gap-2"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getIsSorted() === 'asc' && <IconChevronUp size={14} />}
                            {header.column.getIsSorted() === 'desc' && <IconChevronDown size={14} />}
                          </div>
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none transition-colors"
                            style={{
                              background: header.column.getIsResizing() ? '#228be6' : 'rgba(0, 0, 0, 0.03)',
                            }}
                            onMouseEnter={(e) => {
                              if (!header.column.getIsResizing()) {
                                (e.target as HTMLElement).style.background = 'rgba(34, 139, 230, 0.15)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!header.column.getIsResizing()) {
                                (e.target as HTMLElement).style.background = 'rgba(0, 0, 0, 0.03)';
                              }
                            }}
                          >
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-5 bg-gray-400 rounded-full" />
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
                            className="px-4 py-3 text-sm text-gray-900"
                            style={{ 
                              width: cell.column.getSize(),
                              maxWidth: cell.column.getSize(),
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
            
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                  {' '}({table.getFilteredRowModel().rows.length} total rows)
                </span>
                <Select
                  value={String(table.getState().pagination.pageSize)}
                  onChange={value => table.setPageSize(Number(value))}
                  data={['10', '25', '50', '100', '200']}
                  className="w-28"
                />
              </div>
              
              <Pagination
                value={table.getState().pagination.pageIndex + 1}
                onChange={page => table.setPageIndex(page - 1)}
                total={table.getPageCount()}
                boundaries={1}
                siblings={1}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-900 mb-2">✨ Features:</p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>10,000 rows generated with Faker.js</li>
              <li>Virtual scrolling for performance (@tanstack/react-virtual)</li>
              <li>Mantine UI components throughout</li>
              <li>Column sorting with icons</li>
              <li>Resizable columns (drag column edges)</li>
              <li>Global search filtering</li>
              <li>Mantine Tooltip on ellipsis overflow</li>
            </ul>
          </div>
        </div>
      </div>
    </MantineProvider>
  );
}