"use client";
import { useHolidayStore } from "@/store/useHolidayStore";

function HolidayBadge({ date, compact = false }) {
  const getHolidaysForDate = useHolidayStore(
    (state) => state.getHolidaysForDate
  );

  if (!date) return null;

  const holidays = getHolidaysForDate ? getHolidaysForDate(new Date(date)) : [];

  if (!holidays || holidays.length === 0) return null;

  if (compact) {
    // Compact view for calendar grid
    return (
      <div className="flex flex-col gap-0.5 mt-1">
        {holidays.slice(0, 2).map((holiday) => (
          <div
            key={holiday.id}
            className="text-[10px] px-1.5 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded truncate"
            title={holiday.description || holiday.name}
          >
            {holiday.name}
          </div>
        ))}
        {holidays.length > 2 && (
          <div className="text-[9px] text-gray-500 dark:text-gray-400 px-1">
            +{holidays.length - 2} more
          </div>
        )}
      </div>
    );
  }

  // Full view for modals or detail views
  return (
    <div className="space-y-2">
      {holidays.map((holiday) => (
        <div
          key={holiday.id}
          className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <div className="flex-1">
            <div className="font-medium text-red-800 dark:text-red-200">
              {holiday.name}
            </div>
            {holiday.description && (
              <div className="text-sm text-red-600 dark:text-red-300 mt-0.5">
                {holiday.description}
              </div>
            )}
            <div className="flex gap-2 mt-1">
              {holiday.isNational && (
                <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300 rounded">
                  National Holiday
                </span>
              )}
              {holiday.type && (
                <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300 rounded">
                  {holiday.type}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default HolidayBadge;
