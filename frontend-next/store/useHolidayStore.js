import { create } from "zustand";
import { holidaysAPI } from "@/api/holidays";

// Local YYYY-MM-DD key (no UTC shift) so lookups match the calendar grid.
function dateKey(date) {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export const useHolidayStore = create((set, get) => ({
  holidays: [],
  preferences: [],
  byDate: {}, // "YYYY-MM-DD" → [holiday, ...]

  // Load preferences + holiday occurrences for the years around `year`.
  fetchPreferences: async (year = new Date().getFullYear()) => {
    try {
      const preferences = await holidaysAPI.getPreferences();
      set({ preferences });
    } catch (err) {
      console.error("fetchPreferences failed:", err);
    }
    await get().fetchHolidays(year);
  },

  fetchHolidays: async (year = new Date().getFullYear()) => {
    try {
      const years = [year - 1, year, year + 1];
      const results = await Promise.all(years.map((y) => holidaysAPI.getOccurrences(y)));
      const holidays = results.flat().map((h) => ({ ...h, isNational: h.is_national }));
      const byDate = {};
      for (const h of holidays) {
        (byDate[h.date] ||= []).push(h);
      }
      set({ holidays, byDate });
    } catch (err) {
      console.error("fetchHolidays failed:", err);
      set({ holidays: [], byDate: {} });
    }
  },

  updateHolidayPreference: async (data) => {
    await holidaysAPI.upsertPreference(data);
    await get().fetchPreferences();
  },

  getHolidaysForDate: (date) => {
    if (!date) return [];
    return get().byDate[dateKey(date)] || [];
  },
}));
