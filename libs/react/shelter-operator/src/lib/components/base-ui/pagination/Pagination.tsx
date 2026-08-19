import { Button } from '../buttons/buttons';

interface PaginationProps {
  page: number;
  totalPages: number;
  resultCount?: number;
  onPageChange: (p: number) => void;
}

export function Pagination({
  page,
  totalPages,
  resultCount,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="relative flex justify-center mt-4 space-x-2">
      {resultCount && (
        <span className="absolute left-0 flex items-center px-4 text-sm text-[#747A82]">
          {resultCount} results
        </span>
      )}

      <Button
        variant="primary-sm"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        ‹ Prev
      </Button>
      <span className="flex items-center px-4 text-sm text-[#747A82]">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="primary-sm"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
      >
        Next ›
      </Button>
    </div>
  );
}
