function EmptyChat() {
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-900/70 p-6">
      <div className="max-w-md rounded-[28px] border border-white/10 bg-slate-800/70 p-8 text-center shadow-[0_20px_70px_-34px_rgba(0,0,0,0.95)]">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-violet-500/15 text-4xl">💬</div>
        <h2 className="mt-6 text-2xl font-semibold text-white">Welcome to SkillSync Chat</h2>
        <p className="mt-3 text-sm leading-7 text-slate-400">Select a conversation from the sidebar and start collaborating with your learning partners.</p>
      </div>
    </div>
  );
}

export default EmptyChat;