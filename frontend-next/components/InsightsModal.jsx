"use client";
import { useMemo } from "react";
import { useCalendarStore } from "@/store/useCalendarStore";

// ── Time Insights ─────────────────────────────────────────────────────────────
// Minimal but real: computes meeting time for the week containing `currentDate`
// straight from the events already in the store. Timed (non all-day) events
// count as "meetings". Surfaces a daily breakdown, busiest day and a per-
// calendar split so the panel reflects the user's actual schedule.

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmtHours(mins) {
  const h = mins / 60;
  if (mins === 0) return "0 hr";
  if (h < 1) return `${mins} min`;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} hr`;
}

export function computeWeekInsights(events, currentDate) {
  const start = new Date(currentDate);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  const perDay = Array(7).fill(0); // minutes
  const perCalendar = new Map(); // name -> { minutes, color }
  let totalMinutes = 0;
  let meetingCount = 0;

  for (const ev of events || []) {
    if (ev.is_all_day) continue;
    const s = new Date(ev.start_time);
    const e = new Date(ev.end_time || ev.start_time);
    if (isNaN(s) || s < start || s >= end) continue;
    const mins = Math.max(0, Math.round((e - s) / 60000));
    if (mins === 0) continue;
    perDay[s.getDay()] += mins;
    totalMinutes += mins;
    meetingCount += 1;
    const name = ev.calendar_name || "Calendar";
    const prev = perCalendar.get(name) || { minutes: 0, color: ev.calendar_color || "#1a73e8" };
    prev.minutes += mins;
    perCalendar.set(name, prev);
  }

  const busiestIdx = perDay.reduce((b, v, i) => (v > perDay[b] ? i : b), 0);
  const maxDay = Math.max(1, ...perDay);

  return {
    start,
    end: new Date(end.getTime() - 1),
    perDay,
    maxDay,
    totalMinutes,
    meetingCount,
    busiestIdx,
    busiestMinutes: perDay[busiestIdx],
    calendars: [...perCalendar.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.minutes - a.minutes),
  };
}

function InsightsModal({ onClose }) {
  const { events, currentDate } = useCalendarStore();
  const data = useMemo(() => computeWeekInsights(events, currentDate), [events, currentDate]);

  const month = (d) => d.toLocaleString("default", { month: "short" });
  const sameMonth = data.start.getMonth() === data.end.getMonth();
  const range = sameMonth
    ? `${month(data.start)} ${data.start.getDate()} – ${data.end.getDate()}, ${data.end.getFullYear()}`
    : `${month(data.start)} ${data.start.getDate()} – ${month(data.end)} ${data.end.getDate()}, ${data.end.getFullYear()}`;

  const avgPerDay = Math.round(data.totalMinutes / 7);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1f1f1f] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-google-gray-200 dark:border-[#444746]">
          <div>
            <h2 className="text-xl font-normal text-google-gray-800 dark:text-[#e3e3e3]">Time Insights</h2>
            <div className="text-xs uppercase tracking-[0.8px] font-medium text-google-gray-600 dark:text-[#c4c7c5] mt-0.5">
              {range}
            </div>
          </div>
          <button className="btn-icon w-10 h-10" onClick={onClose} aria-label="Close">
            <span className="material-icons-outlined text-google-gray-700 dark:text-[#c4c7c5]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">
          {/* Headline stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "In meetings", value: fmtHours(data.totalMinutes) },
              { label: "Meetings", value: String(data.meetingCount) },
              { label: "Daily avg", value: fmtHours(avgPerDay) },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-google-gray-50 dark:bg-[#2d2e30] px-3 py-3 text-center"
              >
                <div className="text-2xl font-normal text-google-gray-800 dark:text-[#e3e3e3] [font-family:'Google_Sans',Roboto,Arial,sans-serif]">
                  {s.value}
                </div>
                <div className="text-[11px] uppercase tracking-[0.5px] text-google-gray-600 dark:text-[#c4c7c5] mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Daily bar chart */}
          <div className="mb-6">
            <div className="text-sm font-medium text-google-gray-700 dark:text-[#e3e3e3] mb-3">
              Time in meetings per day
            </div>
            {data.totalMinutes === 0 ? (
              <div className="text-sm text-google-gray-500 dark:text-[#9aa0a6] py-4 text-center">
                No meetings scheduled this week.
              </div>
            ) : (
              <div className="flex items-end gap-2 h-32">
                {data.perDay.map((mins, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="text-[10px] text-google-gray-500 dark:text-[#9aa0a6] tabular-nums">
                      {mins > 0 ? fmtHours(mins) : ""}
                    </div>
                    <div
                      className={`w-full rounded-md ${
                        i === data.busiestIdx
                          ? "bg-google-blue dark:bg-[#a8c7fa]"
                          : "bg-google-blue-light/60 dark:bg-[#004a77]"
                      }`}
                      style={{ height: `${Math.max(mins === 0 ? 0 : 4, (mins / data.maxDay) * 100)}%` }}
                    />
                    <div className="text-[11px] text-google-gray-600 dark:text-[#c4c7c5]">
                      {DAY_LABELS[i]}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Busiest day */}
          {data.totalMinutes > 0 && (
            <div className="mb-6 rounded-xl border border-google-gray-200 dark:border-[#444746] px-4 py-3 flex items-center gap-3">
              <span className="material-icons-outlined text-google-blue dark:text-[#a8c7fa]">trending_up</span>
              <div className="text-sm text-google-gray-700 dark:text-[#e3e3e3]">
                Busiest day is{" "}
                <span className="font-medium">{DAY_LABELS[data.busiestIdx]}</span> with{" "}
                <span className="font-medium">{fmtHours(data.busiestMinutes)}</span> in meetings.
              </div>
            </div>
          )}

          {/* Per-calendar split */}
          {data.calendars.length > 0 && (
            <div>
              <div className="text-sm font-medium text-google-gray-700 dark:text-[#e3e3e3] mb-3">
                By calendar
              </div>
              <div className="space-y-2.5">
                {data.calendars.map((c) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-sm text-google-gray-700 dark:text-[#e3e3e3] flex-1 truncate">
                      {c.name}
                    </span>
                    <span className="text-sm text-google-gray-600 dark:text-[#c4c7c5] tabular-nums">
                      {fmtHours(c.minutes)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InsightsModal;
