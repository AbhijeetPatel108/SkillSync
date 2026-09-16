import axios from "../api/axios";

const getUsers = async (params = {}) => {
  const { data } = await axios.get("/admin/users", { params });
  return data;
};

export default { getUsers };
