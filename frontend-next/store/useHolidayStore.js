import { create } from "zustand";
export const useHolidayStore = create(() => ({
  holidays: [],
  fetchHolidays: async () => {},
  fetchPreferences: async () => {},
  updateHolidayPreference: async () => {},
  toggleShowHolidays: () => {},
  getHolidaysForDate: () => [],
}));
