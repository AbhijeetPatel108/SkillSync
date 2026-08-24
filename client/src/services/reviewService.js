import axios from "../api/axios";
const getReviews = async (userId) => {
  const { data } = await axios.get(`/reviews/user/${userId}`);
  return data;
};
const createReview = async (body) => {
  const { data } = await axios.post("/reviews", body);
  return data;
};

export default {
  getReviews,
  createReview,
};