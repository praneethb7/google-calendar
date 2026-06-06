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
  } else if (view === "year") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(11, 31);
    end.setHours(23, 59, 59, 999);
  } else if (view === "4days") {
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 3);
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
  currentView: "day",
  currentDate: new Date(),
  loading: false,
  error: null,

  // ── View options (shown in the view picker menu) ──────────────────────────
  showWeekends: true,
  showDeclinedEvents: true,
  showCompletedTasks: true,
  toggleShowWeekends: () => set((s) => ({ showWeekends: !s.showWeekends })),
  toggleShowDeclinedEvents: () => set((s) => ({ showDeclinedEvents: !s.showDeclinedEvents })),
  toggleShowCompletedTasks: () => set((s) => ({ showCompletedTasks: !s.showCompletedTasks })),

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
    // Callers pass ids in mixed forms (numeric from the store, stringified base
    // ids from EventModal), so compare loosely so the trash snapshot below
    // always finds the event being removed.
    const ev = get().events.find((e) => String(e.id) === String(id));
    await eventsAPI.delete(id, deleteAll);
    set((s) => ({ events: s.events.filter((e) => String(e.id) !== String(id)) }));
    // Snapshot into the (client-side) trash so it can be restored within 30 days.
    if (ev) {
      try {
        const trash = JSON.parse(localStorage.getItem("calendarTrash") || "[]");
        trash.unshift({
          ...ev,
          trashId: `${id}-${Date.now()}`,
          deleted_at: new Date().toISOString(),
        });
        localStorage.setItem("calendarTrash", JSON.stringify(trash.slice(0, 200)));
        window.dispatchEvent(new Event("calendar-trash-updated"));
      } catch {
        // ignore storage failures
      }
    }
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
  updateRsvp: async () => {},
  fetchHolidays: async () => {},
  fetchPreferences: async () => {},
  holidays: [],
  sharedCalendars: [],
  invitations: [],
  showHolidays: false,
  toggleShowHolidays: () => set((s) => ({ showHolidays: !s.showHolidays })),
}));
