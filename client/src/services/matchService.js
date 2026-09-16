import axios from "../api/axios";

const getSent = async () => {
  const { data } = await axios.get("/matches/sent");
  return data;
};

const getReceived = async () => {
  const { data } = await axios.get("/matches/received");
  return data;
};

const getAccepted = async () => {
  const { data } = await axios.get("/matches/accepted");
  return data;
};

const sendRequest = async (receiverId) => {
  const { data } = await axios.post("/matches", {
    receiverId,
  });

  return data;
};

const accept = async (id) => {
  const { data } = await axios.patch(`/matches/${id}/accept`);
  return data;
};

const reject = async (id) => {
  const { data } = await axios.patch(`/matches/${id}/reject`);
  return data;
};

const cancel = async (id) => {
  const { data } = await axios.patch(`/matches/${id}/cancel`);
  return data;
};

export default {
  getSent,
  getReceived,
  getAccepted,
  sendRequest,
  accept,
  reject,
  cancel,
};