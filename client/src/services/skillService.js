import axios from "../api/axios";

const skillService = {
  async getSkills(params = {}) {
    const response = await axios.get("/skills", {
      params,
    });

    return response.data;
  },
};

export default skillService;