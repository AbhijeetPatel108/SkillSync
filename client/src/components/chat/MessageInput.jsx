import { useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";

function MessageInput({ onSend }) {
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = (e) => {
    e.preventDefault();

    const value = text.trim();

    if (!value) return;

    onSend(value);
    setText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(e);
    }
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-3 border-t border-white/10 bg-slate-800/70 p-4">
      <textarea
        ref={inputRef}
        value={text}
        rows={1}
        onKeyDown={handleKeyDown}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 resize-none rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
      />

      <button type="submit" className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-[#7C3AED] to-[#8b5cf6] text-white transition hover:-translate-y-0.5">
        <IoSend size={18} />
      </button>
    </form>
  );
}

export default MessageInput;