import { ReactElement, ReactNode } from 'react';

type TableHeader = string | ReactNode;

type TableProps<T> = {
  data: T[];
  header: TableHeader[];
  renderCell: (row: T, columnIndex: number) => ReactElement | string;
  action?: (row: T) => ReactElement;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
};

export function Table<T>({
  data,
  header,
  renderCell,
  action,
  page,
  totalPages,
  onPageChange,
}: TableProps<T>): ReactElement {
  return (
    <div className="overflow-x-auto w-full rounded-lg">
      <table className="min-w-[800px] w-full text-left text-sm">
        <thead>
          <tr className="bg-primary-95">
            {header.map((title, index) => (
              <th
                key={index}
                className="text-sm py-4 px-8 font-normal whitespace-nowrap"
              >
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={(row as any).id ?? rowIndex}
              className="border-b border-neutral-90"
            >
              {header.map((_, colIndex) => (
                <td key={colIndex} className={`px-8 py-4 whitespace-nowrap`}>
                  {colIndex === header.length - 1 ? (
                    <div className="flex items-center justify-between w-full max-w-[200px]">
                      {renderCell(row, colIndex)}
                      {action && <span>{action(row)}</span>}
                    </div>
                  ) : (
                    renderCell(row, colIndex)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {!!totalPages && totalPages > 1 && page && onPageChange && (
        <div className="flex justify-center mt-4 space-x-1 w-full">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded border border-neutral-300 text-sm disabled:opacity-50"
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-3 py-1 rounded text-sm border ${
                page === p
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'border-neutral-300 hover:bg-neutral-100'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded border border-neutral-300 text-sm disabled:opacity-50"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
