"use client";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useHolidayStore } from "@/store/useHolidayStore";

const formatEventTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

function MonthView({ onEventClick, onEventContextMenu, onGridClick, placeholder }) {
  const { currentDate, events, showHolidays } = useCalendarStore();
  const { getHolidaysForDate } = useHolidayStore();

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const days = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const getEventsForDay = (date) =>
    events
      .filter(
        (event) =>
          new Date(event.start_time).toDateString() === date.toDateString()
      )
      .sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );

  const getHolidaysForDay = (date) =>
    showHolidays ? getHolidaysForDate(date) : [];

  const isToday = (date) => date.toDateString() === new Date().toDateString();

  const days = getDaysInMonth();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#202124] overflow-hidden rounded-lg">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-google-gray-200 dark:border-gray-700">
        {weekDays.map((day) => (
          <div key={day} className="py-2 text-center text-[11px] font-medium uppercase text-google-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1 border-l border-google-gray-200 dark:border-gray-700">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day.date);
          const dayHolidays = getHolidaysForDay(day.date);
          const totalItems = dayEvents.length + dayHolidays.length;
          const maxDisplayItems = 4;
          const today = isToday(day.date);

          return (
            <div
              key={index}
              className="relative flex flex-col p-1 border-r border-b border-google-gray-200 dark:border-gray-700 bg-white dark:bg-[#202124] min-h-[100px] cursor-pointer"
              onClick={(e) => {
                // Ensure we don't trigger if the user clicked an event bubble
                if (e.target.closest('.event-bubble') || e.target.closest('.holiday-bubble')) return;
                let date = day.date;
                // Add default 10 AM time for day grid clicks
                const popDate = new Date(date);
                popDate.setHours(10, 0, 0, 0);
                if (onGridClick) onGridClick(popDate, e.clientX, e.clientY);
              }}
            >
              {/* Date number */}
              <div className="flex justify-center mb-1 mt-1">
                <span
                  className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full cursor-pointer transition-colors ${
                    today
                      ? "bg-google-blue text-white hover:bg-google-blue-dark"
                      : day.isCurrentMonth
                      ? "text-google-gray-700 dark:text-gray-200 hover:bg-google-gray-100 dark:hover:bg-gray-700"
                      : "text-google-gray-400 dark:text-gray-600 hover:bg-google-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {day.date.getDate()}
                </span>
              </div>

              {/* Events and Holidays */}
              <div className="flex flex-col gap-[2px] overflow-hidden px-1">
                {dayHolidays.slice(0, maxDisplayItems).map((holiday) => (
                  <div
                    key={holiday.id}
                    title={holiday.description || holiday.name}
                    className="holiday-bubble px-2 py-[2px] rounded text-xs font-medium bg-google-green-light text-google-green-dark truncate hover:opacity-90"
                  >
                    {holiday.name}
                  </div>
                ))}

                {dayEvents
                  .slice(0, maxDisplayItems - dayHolidays.length)
                  .map((event) => {
                    const color =
                      event.color || event.calendar_color || "#1a73e8";
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick?.(event, e.clientX, e.clientY); }}
                        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onEventContextMenu?.(event, e.clientX, e.clientY); }}
                        title={event.title}
                        className={`event-bubble truncate text-xs cursor-pointer hover:opacity-90 transition-opacity ${
                          event.is_all_day ? "pl-2 pr-1 py-[2px] rounded text-white" : "flex items-center gap-1 py-[2px]"
                        }`}
                        style={{ backgroundColor: event.is_all_day ? color : "transparent" }}
                      >
                        {!event.is_all_day && (
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                        )}
                        <span className={event.is_all_day ? "font-medium" : "text-google-gray-700 dark:text-gray-300"}>
                          {!event.is_all_day && (
                            <span className="font-medium mr-1">
                              {formatEventTime(event.start_time)}
                            </span>
                          )}
                          {event.title}
                        </span>
                      </div>
                    );
                  })}

                {totalItems > maxDisplayItems && (
                  <div className="text-xs px-1 hover:bg-google-gray-100 rounded cursor-pointer text-google-gray-600 font-medium py-[2px]">
                    {totalItems - maxDisplayItems} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MonthView;
