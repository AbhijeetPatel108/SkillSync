function MessageBubble({ message, mine }) {
  return (
    <div className={`mb-4 flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-[20px] px-4 py-3 shadow-md sm:max-w-lg ${mine ? "rounded-br-md bg-gradient-to-r from-[#7C3AED] to-[#8b5cf6] text-white" : "rounded-bl-md bg-slate-800/90 text-slate-100"}`}>
        {!mine && <p className="mb-1 text-xs font-semibold text-violet-300">{message.sender?.name}</p>}
        <p className="break-words text-sm leading-7">{message.content}</p>
        <div className="mt-2 flex justify-end">
          <span className="text-[11px] opacity-70">{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;