import { create } from "zustand";
import { calendarsAPI } from "@/api/calendars";
import { eventsAPI } from "@/api/events";

function getDateRange(date, view) {
  const start = new Date(date);
  const end = new Date(date);
  if (view === "day") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (view === "week") {
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (view === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  } else {
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 30);
    end.setHours(23, 59, 59, 999);
  }
  return { start, end };
}

export const useCalendarStore = create((set, get) => ({
  calendars: [],
  selectedCalendars: [],
  events: [],
  currentView: "month",
  currentDate: new Date(),
  loading: false,
  error: null,

  // ── Calendars ────────────────────────────────────────────────────────────
  fetchCalendars: async () => {
    set({ loading: true, error: null });
    try {
      const calendars = await calendarsAPI.getAll();
      set({
        calendars,
        selectedCalendars: calendars.map((c) => c.id),
        loading: false,
      });
      return calendars;
    } catch (err) {
      console.error("fetchCalendars failed:", err);
      set({ loading: false });
      return [];
    }
  },

  createCalendar: async (data) => {
    const calendar = await calendarsAPI.create(data);
    set((s) => ({
      calendars: [...s.calendars, calendar],
      selectedCalendars: [...s.selectedCalendars, calendar.id],
    }));
    return calendar;
  },

  updateCalendar: async (id, data) => {
    const calendar = await calendarsAPI.update(id, data);
    set((s) => ({ calendars: s.calendars.map((c) => (c.id === id ? calendar : c)) }));
    return calendar;
  },

  deleteCalendar: async (id) => {
    await calendarsAPI.delete(id);
    set((s) => ({
      calendars: s.calendars.filter((c) => c.id !== id),
      selectedCalendars: s.selectedCalendars.filter((cId) => cId !== id),
      events: s.events.filter((e) => e.calendar_id !== id),
    }));
  },

  toggleCalendar: (calendarId) => {
    set((s) => ({
      selectedCalendars: s.selectedCalendars.includes(calendarId)
        ? s.selectedCalendars.filter((id) => id !== calendarId)
        : [...s.selectedCalendars, calendarId],
    }));
  },

  // ── Events ────────────────────────────────────────────────────────────────
  fetchEvents: async (startDate, endDate) => {
    const { selectedCalendars } = get();
    if (!selectedCalendars.length) { set({ events: [] }); return; }
    set({ loading: true });
    // Send local time as-is (no UTC conversion) to match how events are stored
    const toLocalISO = (d) => {
      const dt = new Date(d);
      return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString();
    };
    try {
      const events = await eventsAPI.getAll({
        calendar_ids: selectedCalendars.join(","),
        start_date: toLocalISO(startDate),
        end_date: toLocalISO(endDate),
      });
      set({ events: events || [], loading: false });
      return events;
    } catch (err) {
      console.error("fetchEvents failed:", err);
      set({ loading: false, events: [] });
    }
  },

  createEvent: async (data) => {
    const event = await eventsAPI.create(data);
    const calendar = get().calendars.find((c) => c.id === event.calendar_id);
    const enriched = {
      ...event,
      calendar_color: calendar?.color || "#1a73e8",
      calendar_name: calendar?.name || "Calendar",
    };
    set((s) => ({ events: [...s.events, enriched] }));
    return enriched;
  },

  updateEvent: async (id, data) => {
    const event = await eventsAPI.update(id, data);
    set((s) => ({ events: s.events.map((e) => (e.id === id ? event : e)) }));
    return event;
  },

  deleteEvent: async (id, deleteAll = false) => {
    await eventsAPI.delete(id, deleteAll);
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
  },

  searchEvents: async (query) => {
    try {
      return await eventsAPI.search(query);
    } catch { return []; }
  },

  // ── View / Date controls ──────────────────────────────────────────────────
  setView: (view) => set({ currentView: view }),
  setDate: (date) => set({ currentDate: date }),

  // ── Stubs kept for component compatibility (no-op) ────────────────────────
  fetchSharedCalendars: async () => {},
  fetchMyInvitations: async () => {},
  fetchHolidays: async () => {},
  fetchPreferences: async () => {},
  holidays: [],
  sharedCalendars: [],
  invitations: [],
  showHolidays: false,
  toggleShowHolidays: () => set((s) => ({ showHolidays: !s.showHolidays })),
}));
