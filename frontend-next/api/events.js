import client from "./client";

// Normalize event data from camelCase (frontend) to snake_case (backend API)
function toEventPayload(data) {
  const payload = {
    title: data.title,
    description: data.description ?? null,
    location: data.location ?? null,
    start_time: data.startTime || data.start_time,
    end_time: data.endTime || data.end_time,
    is_all_day: data.isAllDay ?? data.is_all_day ?? false,
    timezone: data.timezone || "UTC",
    calendar_id: data.calendarId ? parseInt(data.calendarId) : data.calendar_id,
    color: data.color ?? null,
    status: data.status || "confirmed",
    is_recurring: data.isRecurring ?? data.is_recurring ?? false,
    recurrence_rule: data.recurrenceRule ?? data.recurrence_rule ?? null,
    series_id: data.seriesId ?? data.series_id ?? null,
  };
  if (data.reminders !== undefined) {
    payload.reminders = (data.reminders || []).map((r) => ({
      minutes_before: parseInt(r.minutes_before),
      method: r.method || "popup",
    }));
  }
  return payload;
}

export const eventsAPI = {
  getAll: async (params) => {
    const response = await client.get("/api/events", { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await client.get(`/api/events/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await client.post("/api/events", toEventPayload(data));
    return response.data;
  },
  update: async (id, data) => {
    const response = await client.put(`/api/events/${id}`, toEventPayload(data));
    return response.data;
  },
  delete: async (id, deleteAll = false) => {
    await client.delete(`/api/events/${id}`, { params: { delete_all: deleteAll } });
  },
  search: async (query) => {
    const response = await client.get("/api/events/search", { params: { q: query } });
    return response.data;
  },
};
