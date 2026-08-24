import axios from "../api/axios";

const getMyProfile = async () => {
  const { data } = await axios.get("/users/profile");
  return data;
};

const updateProfile = async (profile) => {
  const { data } = await axios.put("/users/profile", profile);
  return data;
};

const getUserById = async (id) => {
  const { data } = await axios.get(`/users/${id}`);
  return data;
};

const addOfferedSkill = async (skill) => {
  const { data } = await axios.post("/users/skills/offered", skill);
  return data;
};

const removeOfferedSkill = async (skillName) => {
  const { data } = await axios.delete(
    `/users/skills/offered/${encodeURIComponent(skillName)}`
  );
  return data;
};

const addWantedSkill = async (skill) => {
  const { data } = await axios.post("/users/skills/wanted", skill);
  return data;
};

const removeWantedSkill = async (skillName) => {
  const { data } = await axios.delete(
    `/users/skills/wanted/${encodeURIComponent(skillName)}`
  );
  return data;
};

export default {
  getMyProfile,
  updateProfile,
  getUserById,
  addOfferedSkill,
  removeOfferedSkill,
  addWantedSkill,
  removeWantedSkill,
};