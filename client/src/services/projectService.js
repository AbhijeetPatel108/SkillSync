import axios from "../api/axios";

const getProjects = async (params = {}) => {
  const { data } = await axios.get("/projects", { params });
  return data;
};

const getProject = async (id) => {
  const { data } = await axios.get(`/projects/${id}`);
  return data;
};

const createProject = async (project) => {
  const { data } = await axios.post("/projects", project);
  return data;
};

const updateProject = async (id, project) => {
  const { data } = await axios.patch(`/projects/${id}`, project);
  return data;
};

const deleteProject = async (id) => {
  const { data } = await axios.delete(`/projects/${id}`);
  return data;
};

export default { getProjects, getProject, createProject, updateProject, deleteProject };
