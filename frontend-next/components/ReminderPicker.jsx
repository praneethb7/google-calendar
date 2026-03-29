"use client";
// ReminderPicker.jsx
import { useState, useEffect, useRef } from "react";

function formatReminderTime(minutes) {
  const mins = parseInt(minutes, 10);
  if (mins === 0) return "At time of event";
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} before`;
  if (mins < 1440) {
    const hrs = mins / 60;
    return `${hrs} hour${hrs !== 1 ? "s" : ""} before`;
  }
  const days = mins / 1440;
  return `${days} day${days !== 1 ? "s" : ""} before`;
}

export default function ReminderPicker({ reminders = [], onChange }) {
  const [showPresets, setShowPresets] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [minutesBefore, setMinutesBefore] = useState("10");
  const [timeUnit, setTimeUnit] = useState("minutes");
  const [method, setMethod] = useState("notification");
  const dropdownRef = useRef(null);

  const presetReminders = [
    { label: "At time of event", minutes: 0 },
    { label: "10 minutes before", minutes: 10 },
    { label: "30 minutes before", minutes: 30 },
    { label: "1 hour before", minutes: 60 },
    { label: "1 day before", minutes: 1440 },
    { label: "Custom...", minutes: "custom" },
  ];

  useEffect(() => {
    function onDoc(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowPresets(false);
    }
    if (showPresets) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [showPresets]);

  const addReminder = (minutes, methodVal = "notification") => {
    const newR = {
      id: Date.now(),
      minutes_before: parseInt(minutes, 10),
      method: methodVal,
    };
    onChange([...reminders, newR]);
  };

  const handlePresetSelect = (minutes) => {
    if (minutes === "custom") {
      setShowPresets(false);
      setShowCustom(true);
      return;
    }
    addReminder(minutes, "notification");
    setShowPresets(false);
  };

  const handleCustomAdd = (e) => {
    e?.preventDefault();
    let mins = parseInt(minutesBefore, 10);
    if (isNaN(mins) || mins < 0) return alert("Please enter a valid number");
    if (timeUnit === "hours") mins *= 60;
    if (timeUnit === "days") mins *= 1440;
    addReminder(mins, method);
    setShowCustom(false);
    setMinutesBefore("10");
    setTimeUnit("minutes");
    setMethod("notification");
  };

  const removeReminder = (id) => onChange(reminders.filter((r) => r.id !== id));

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {reminders.length > 0 && (
            <div className="space-y-2">
              {reminders.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="text-gray-700 dark:text-gray-300">
                      {formatReminderTime(r.minutes_before)}
                    </div>
                    {r.method === "email" && (
                      <span className="text-xs text-gray-500">(Email)</span>
                    )}
                  </div>
                  <button
                    onClick={() => removeReminder(r.id)}
                    className="text-gray-600 dark:text-gray-400 hover:text-red-600"
                  >
                    <span className="material-icons-outlined text-sm">
                      close
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {!showCustom ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPresets((s) => !s);
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-2 rounded flex items-center gap-1"
              >
                <span className="material-icons-outlined text-sm">add</span> Add
                reminder
              </button>

              {showPresets && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 min-w-[220px] py-1">
                  {presetReminders.map((p, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePresetSelect(p.minutes);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <button
                onClick={() => setShowCustom(false)}
                className="text-sm text-blue-600 dark:text-blue-400 mb-2"
              >
                ← Back to presets
              </button>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  min="0"
                  value={minutesBefore}
                  onChange={(e) => setMinutesBefore(e.target.value)}
                  className="px-2 py-1 w-24 rounded border dark:border-gray-600 bg-white dark:bg-gray-700"
                />
                <select
                  value={timeUnit}
                  onChange={(e) => setTimeUnit(e.target.value)}
                  className="px-2 py-1 rounded border dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value="minutes">minutes</option>
                  <option value="hours">hours</option>
                  <option value="days">days</option>
                </select>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  before
                </span>
              </div>

              <div className="mb-3">
                <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">
                  Method
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full px-2 py-1 rounded border dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value="notification">Notification</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCustomAdd}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowCustom(false)}
                  className="px-3 py-1.5 rounded border"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
