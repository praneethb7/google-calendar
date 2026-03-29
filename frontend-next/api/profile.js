import client from "./client";

export const profileAPI = {
  getProfile: async () => {
    const response = await client.get("/api/profile");
    return response.data;
  },
  getPreferences: async () => {
    const response = await client.get("/api/preferences");
    return response.data;
  },
  updatePreferences: async (data) => {
    const response = await client.put("/api/preferences", data);
    return response.data;
  },
};
