import { useEffect, useRef } from "react";

import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

function ChatWindow({ room, messages, currentUser, onSend }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col bg-slate-900/70">
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-800/70 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#8b5cf6] text-lg font-semibold text-white">
            {room.otherUser?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{room.otherUser?.name}</h2>
            <p className="text-sm text-emerald-400">● Online</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {messages.length === 0 ? (
          <div className="mt-20 text-center text-sm text-slate-400">No messages yet.</div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id || message._id} message={message} mine={(message.sender?.id || message.sender?._id) === (currentUser?.id || currentUser?._id)} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={onSend} />
    </div>
  );
}

export default ChatWindow;