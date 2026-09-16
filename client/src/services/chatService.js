import axios from "../api/axios";

const getRooms = async () => {
  const { data } = await axios.get("/chat/rooms");
  return data;
};

const getMessages = async (matchId) => {
  const { data } = await axios.get(`/chat/rooms/${matchId}/messages`);
  return data;
};

const markAsRead = async (matchId) => {
  const { data } = await axios.patch(`/chat/rooms/${matchId}/read`);
  return data;
};

export default {
  getRooms,
  getMessages,
  markAsRead,
};