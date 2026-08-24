function Pagination({ meta, onPageChange }) {
  if (!meta || meta.totalPages <= 1) return null;

  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
      <button
        disabled={!meta.hasPrevPage}
        onClick={() => onPageChange(meta.page - 1)}
        className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>

      <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-200">
        Page {meta.page} of {meta.totalPages}
      </span>

      <button
        disabled={!meta.hasNextPage}
        onClick={() => onPageChange(meta.page + 1)}
        className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}

export default Pagination;