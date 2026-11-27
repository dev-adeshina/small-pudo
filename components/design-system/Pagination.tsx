"use client";

type PaginationProps = {
  page: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalItems, pageSize = 10, onPageChange }: PaginationProps) {
  const pageCount = Math.ceil(totalItems / pageSize);
  if (pageCount <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  return (
    <nav className="vl-pagination" aria-label="Pagination">
      <span className="vl-pagination__summary">Showing {start}–{end} of {totalItems}</span>
      <div className="vl-pagination__controls">
        <button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} aria-label="Previous page">Previous</button>
        <span aria-live="polite">Page {page} of {pageCount}</span>
        <button type="button" onClick={() => onPageChange(Math.min(pageCount, page + 1))} disabled={page >= pageCount} aria-label="Next page">Next</button>
      </div>
    </nav>
  );
}
