import { FiChevronLeft, FiChevronRight, FiMoreHorizontal } from "react-icons/fi";

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  maxVisible = 5 
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const half = Math.floor(maxVisible / 2);
    
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pages = getPageNumbers();
  const hasLeftEllipsis = pages[0] > 1;
  const hasRightEllipsis = pages[pages.length - 1] < totalPages;

  return (
    <nav className="flex items-center justify-center gap-2 mt-12" aria-label="Pagination">
      {/* Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
          currentPage === 1
            ? "cursor-not-allowed opacity-50 text-slate-400"
            : "text-slate-200 hover:bg-white/10 hover:text-white"
        }`}
      >
        <FiChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {/* First page */}
      {hasLeftEllipsis && (
        <button
          onClick={() => onPageChange(1)}
          className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          1
        </button>
      )}

      {/* Left ellipsis */}
      {hasLeftEllipsis && (
        <span className="px-2 text-slate-400">
          <FiMoreHorizontal className="h-4 w-4" />
        </span>
      )}

      {/* Page numbers */}
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`rounded-xl px-3.5 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
            page === currentPage
              ? "bg-cyan-500 text-white"
              : "text-slate-200 hover:bg-white/10 hover:text-white"
          }`}
          aria-current={page === currentPage ? "page" : undefined}
        >
          {page}
        </button>
      ))}

      {/* Right ellipsis */}
      {hasRightEllipsis && (
        <span className="px-2 text-slate-400">
          <FiMoreHorizontal className="h-4 w-4" />
        </span>
      )}

      {/* Last page */}
      {hasRightEllipsis && (
        <button
          onClick={() => onPageChange(totalPages)}
          className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          {totalPages}
        </button>
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
          currentPage === totalPages
            ? "cursor-not-allowed opacity-50 text-slate-400"
            : "text-slate-200 hover:bg-white/10 hover:text-white"
        }`}
      >
        <span className="hidden sm:inline">Next</span>
        <FiChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}