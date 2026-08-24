function EditProfile() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),_transparent_45%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)] px-4 py-8">
      <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-slate-900/70 p-8 text-center shadow-[0_24px_80px_-28px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">Profile editor</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Editing your profile is coming soon</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          The current experience remains intact while the interface is being polished for a more complete profile experience.
        </p>
      </div>
    </div>
  );
}

export default EditProfile;