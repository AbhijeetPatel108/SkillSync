function RoomItem({ room, selected, onClick }) {
  return (
    <button
      onClick={() => onClick(room)}
      className={`w-full rounded-[20px] border p-3 text-left transition-all duration-200 ${selected ? "border-violet-400/30 bg-violet-500/10" : "border-transparent bg-transparent hover:border-white/10 hover:bg-slate-800/70"}`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#8b5cf6] text-lg font-semibold text-white">
            {room.otherUser?.name?.charAt(0).toUpperCase()}
          </div>
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-slate-900 bg-emerald-400" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-white">{room.otherUser?.name}</h3>
            {room.unreadCount > 0 && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">{room.unreadCount}</span>}
          </div>
          <p className="mt-1 truncate text-sm text-slate-400">{room.latestMessage?.content || "Start chatting..."}</p>
        </div>
      </div>
    </button>
  );
}

export default RoomItem;