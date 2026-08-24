import axios from "../api/axios";

const authService = {
  async register(userData) {
    const response = await axios.post("/auth/register", userData);

    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }

    return response.data;
  },

  async login(credentials) {
    const response = await axios.post("/auth/login", credentials);

    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }

    return response.data;
  },

  async getMe() {
    const response = await axios.get("/auth/me");
    return response.data;
  },

  async logout() {
    try {
      await axios.post("/auth/logout");
    } catch (err) {
      console.error(err);
    }

    localStorage.removeItem("token");
  },
};

export default authService;