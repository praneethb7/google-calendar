import client from "./client";

export const holidaysAPI = {
  getCountries: async () => {
    const response = await client.get("/api/holidays/countries");
    return response.data;
  },
  getPreferences: async () => {
    const response = await client.get("/api/holidays/preferences");
    return response.data;
  },
  upsertPreference: async (data) => {
    const response = await client.post("/api/holidays/preferences", data);
    return response.data;
  },
  getOccurrences: async (year) => {
    const response = await client.get("/api/holidays/occurrences", {
      params: year ? { year } : {},
    });
    return response.data;
  },
};
