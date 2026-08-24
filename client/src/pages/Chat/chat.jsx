import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import { useAuth } from "../../context/AuthContext";

import chatService from "../../services/chatService";

import ChatSidebar from "../../components/chat/ChatSidebar";
import ChatWindow from "../../components/chat/ChatWindow";
import EmptyChat from "../../components/chat/EmptyChat";


const socket = io("http://localhost:5000", {
  auth: {
    token: localStorage.getItem("token"),
  },
});

function Chat() {
  const { user } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [messages, setMessages] = useState([]);

  const loadRooms = async () => {
    try {
      const res = await chatService.getRooms();

      setRooms(res.rooms || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async (matchId) => {
    try {
      const res = await chatService.getMessages(matchId);

      setMessages(
        [...(res.messages || [])].reverse()
      );

     await chatService.markAsRead(matchId);

socket.emit("mark_read", {
  matchId,
});

setRooms(prev =>
  prev.map(room =>
    room.matchId === matchId
      ? {
          ...room,
          unreadCount: 0,
        }
      : room
  )
);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
  if (!selectedRoom) return;

  loadMessages(selectedRoom.matchId);

  socket.emit("join_room", {
  matchId: selectedRoom.matchId,
});

socket.on("room_joined", ({ messages }) => {
  setMessages(messages);
});

}, [selectedRoom]);

  useEffect(() => {
  socket.on("new_message", ({ message }) => {

    setMessages(prev => [...prev, message]);

    setRooms(prev =>
        prev.map(room =>
            room.matchId === message.match
                ? {
                    ...room,
                    latestMessage: message,
                }
                : room
        )
    );

});

  return () => {
    socket.off("new_message");
  };
}, []);

  const sendMessage = (content) => {
    if (!selectedRoom) return;

   console.log("Sending:", {
  matchId: selectedRoom.matchId,
  content,
});

socket.emit("send_message", {
  matchId: selectedRoom.matchId,
  content,
});
  };

  return (
    <div className="h-screen bg-slate-900 flex">

      <ChatSidebar
        rooms={rooms}
        selectedRoom={selectedRoom}
        onSelectRoom={setSelectedRoom}
      />

      {selectedRoom ? (
        <ChatWindow
          room={selectedRoom}
          messages={messages}
          currentUser={user}
          onSend={sendMessage}
        />
      ) : (
        <EmptyChat />
      )}

    </div>
  );
}

export default Chat;