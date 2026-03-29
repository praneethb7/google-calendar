import client from "./client";

export const calendarsAPI = {
  getAll: async () => {
    const response = await client.get("/api/calendars");
    return response.data;
  },
  create: async (data) => {
    const response = await client.post("/api/calendars", data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await client.put(`/api/calendars/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    await client.delete(`/api/calendars/${id}`);
  },
};
