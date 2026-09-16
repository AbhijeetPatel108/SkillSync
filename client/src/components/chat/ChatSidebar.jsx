import RoomItem from "./RoomItem";

function ChatSidebar({ rooms, selectedRoom, onSelectRoom }) {
  return (
    <div className="flex max-h-[42vh] w-full flex-col border-b border-white/10 bg-slate-900/80 lg:min-h-[calc(100vh-76px)] lg:max-h-none lg:w-80 lg:border-b-0 lg:border-r">
      <div className="border-b border-white/10 bg-slate-800/70 p-5">
        <h2 className="text-2xl font-semibold text-white">Messages</h2>
        <p className="mt-1 text-sm text-slate-400">Stay connected with your learning partners.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {rooms.length === 0 ? (
          <div className="mt-8 rounded-[20px] border border-dashed border-slate-700 bg-slate-800/50 p-6 text-center text-sm text-slate-400">
            No conversations yet.
          </div>
        ) : (
          rooms.map((room) => (
            <RoomItem key={room.matchId} room={room} selected={selectedRoom?.matchId === room.matchId} onClick={onSelectRoom} />
          ))
        )}
      </div>
    </div>
  );
}

export default ChatSidebar;