function EmptyMatches({ title, message }) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-700 bg-slate-800/50 p-10 text-center">
      <h2 className="mb-3 text-2xl font-semibold text-white">{title}</h2>
      <p className="text-slate-400">{message}</p>
    </div>
  );
}

export default EmptyMatches;