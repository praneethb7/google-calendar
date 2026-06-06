"use client";
import { useState } from "react";

// ── Booking page ──────────────────────────────────────────────────────────────
// Minimal but real appointment-schedule editor. Booking pages live in
// localStorage (see CalendarSidebar) so edits persist across reloads. The page
// produces a shareable link and a live preview of the bookable time slots the
// page would offer, generated from the configured duration + availability.

const DAYS = [
  { key: 0, label: "S" },
  { key: 1, label: "M" },
  { key: 2, label: "T" },
  { key: 3, label: "W" },
  { key: 4, label: "T" },
  { key: 5, label: "F" },
  { key: 6, label: "S" },
];

function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function fmtSlot(mins) {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function buildSlots(page) {
  const start = toMinutes(page.startTime);
  const end = toMinutes(page.endTime);
  const slots = [];
  for (let t = start; t + page.duration <= end && slots.length < 24; t += page.duration) {
    slots.push(fmtSlot(t));
  }
  return slots;
}

function BookingModal({ page, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(page);
  const [copied, setCopied] = useState(false);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const toggleDay = (key) =>
    set({
      days: draft.days.includes(key)
        ? draft.days.filter((d) => d !== key)
        : [...draft.days, key].sort(),
    });

  const link =
    (typeof window !== "undefined" ? window.location.origin : "https://calendar.app") +
    "/book/" +
    draft.id;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  const slots = buildSlots(draft);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1f1f1f] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-google-gray-200 dark:border-[#444746]">
          <div className="flex items-center gap-3">
            <span className="material-icons-outlined text-google-blue dark:text-[#a8c7fa]">date_range</span>
            <h2 className="text-xl font-normal text-google-gray-800 dark:text-[#e3e3e3]">
              Booking page
            </h2>
          </div>
          <button className="btn-icon w-10 h-10" onClick={onClose} aria-label="Close">
            <span className="material-icons-outlined text-google-gray-700 dark:text-[#c4c7c5]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin grid md:grid-cols-2 gap-6">
          {/* Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-google-gray-700 dark:text-[#e3e3e3] mb-1.5">
                Title
              </label>
              <input
                value={draft.name}
                onChange={(e) => set({ name: e.target.value })}
                className="input-field text-sm w-full dark:bg-[#2d2e30] dark:border-[#444746] dark:text-[#e3e3e3]"
                placeholder="Appointment name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-google-gray-700 dark:text-[#e3e3e3] mb-1.5">
                Appointment duration
              </label>
              <select
                value={draft.duration}
                onChange={(e) => set({ duration: Number(e.target.value) })}
                className="input-field text-sm w-full dark:bg-[#2d2e30] dark:border-[#444746] dark:text-[#e3e3e3]"
              >
                {[15, 30, 45, 60, 90].map((d) => (
                  <option key={d} value={d}>
                    {d} minutes
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-google-gray-700 dark:text-[#e3e3e3] mb-1.5">
                Available hours
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={draft.startTime}
                  onChange={(e) => set({ startTime: e.target.value })}
                  className="input-field text-sm flex-1 dark:bg-[#2d2e30] dark:border-[#444746] dark:text-[#e3e3e3]"
                />
                <span className="text-google-gray-500 dark:text-[#9aa0a6]">to</span>
                <input
                  type="time"
                  value={draft.endTime}
                  onChange={(e) => set({ endTime: e.target.value })}
                  className="input-field text-sm flex-1 dark:bg-[#2d2e30] dark:border-[#444746] dark:text-[#e3e3e3]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-google-gray-700 dark:text-[#e3e3e3] mb-1.5">
                Available days
              </label>
              <div className="flex gap-1.5">
                {DAYS.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(d.key)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                      draft.days.includes(d.key)
                        ? "bg-google-blue text-white dark:bg-[#004a77] dark:text-[#e3e3e3]"
                        : "bg-google-gray-100 text-google-gray-600 dark:bg-[#2d2e30] dark:text-[#c4c7c5]"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-google-gray-700 dark:text-[#e3e3e3] mb-1.5">
                Booking link
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={link}
                  className="input-field text-sm flex-1 text-google-gray-600 dark:bg-[#2d2e30] dark:border-[#444746] dark:text-[#c4c7c5]"
                  onFocus={(e) => e.target.select()}
                />
                <button
                  onClick={handleCopy}
                  className="btn-secondary px-3 py-2 text-sm whitespace-nowrap flex items-center gap-1.5"
                >
                  <span className="material-icons-outlined text-[18px]">
                    {copied ? "check" : "link"}
                  </span>
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-xl border border-google-gray-200 dark:border-[#444746] p-4 bg-google-gray-50 dark:bg-[#2d2e30]">
            <div className="text-[11px] uppercase tracking-[0.5px] text-google-gray-500 dark:text-[#9aa0a6] mb-1">
              Preview
            </div>
            <div className="text-base font-medium text-google-gray-800 dark:text-[#e3e3e3]">
              {draft.name || "Untitled"}
            </div>
            <div className="text-sm text-google-gray-600 dark:text-[#c4c7c5] mb-3 flex items-center gap-1.5">
              <span className="material-icons-outlined text-[16px]">schedule</span>
              {draft.duration} min
            </div>
            <div className="text-sm font-medium text-google-gray-700 dark:text-[#e3e3e3] mb-2">
              Available times
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto scrollbar-thin">
              {slots.length === 0 ? (
                <div className="col-span-2 text-sm text-google-gray-500 dark:text-[#9aa0a6]">
                  No slots — check the available hours.
                </div>
              ) : (
                slots.map((s) => (
                  <div
                    key={s}
                    className="text-sm text-center py-1.5 rounded-lg border border-google-blue/40 text-google-blue dark:border-[#a8c7fa]/40 dark:text-[#a8c7fa]"
                  >
                    {s}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-google-gray-200 dark:border-[#444746]">
          <button
            onClick={() => {
              onDelete(draft.id);
              onClose();
            }}
            className="text-sm text-google-red-600 dark:text-[#f28b82] hover:underline"
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary px-4 py-2 text-sm">
              Cancel
            </button>
            <button onClick={handleSave} className="btn-primary px-4 py-2 text-sm">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const makeBookingPage = (name = "Default") => ({
  id: Math.random().toString(36).slice(2, 10),
  name,
  duration: 30,
  startTime: "09:00",
  endTime: "17:00",
  days: [1, 2, 3, 4, 5],
});

export default BookingModal;
