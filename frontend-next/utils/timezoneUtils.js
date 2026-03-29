// Frontend timezone utility functions

/**
 * Get list of common timezones
 * @returns {Array} Array of timezone objects with value, label, and offset
 */
export const getTimezones = () => {
  return [
    {
      value: "Pacific/Midway",
      label: "(GMT-11:00) Midway Island, Samoa",
      offset: -11,
    },
    { value: "Pacific/Honolulu", label: "(GMT-10:00) Hawaii", offset: -10 },
    { value: "America/Anchorage", label: "(GMT-09:00) Alaska", offset: -9 },
    {
      value: "America/Los_Angeles",
      label: "(GMT-08:00) Pacific Time (US & Canada)",
      offset: -8,
    },
    {
      value: "America/Denver",
      label: "(GMT-07:00) Mountain Time (US & Canada)",
      offset: -7,
    },
    { value: "America/Phoenix", label: "(GMT-07:00) Arizona", offset: -7 },
    {
      value: "America/Chicago",
      label: "(GMT-06:00) Central Time (US & Canada)",
      offset: -6,
    },
    {
      value: "America/New_York",
      label: "(GMT-05:00) Eastern Time (US & Canada)",
      offset: -5,
    },
    {
      value: "America/Caracas",
      label: "(GMT-04:00) Caracas, La Paz",
      offset: -4,
    },
    { value: "America/Santiago", label: "(GMT-04:00) Santiago", offset: -4 },
    {
      value: "America/St_Johns",
      label: "(GMT-03:30) Newfoundland",
      offset: -3.5,
    },
    { value: "America/Sao_Paulo", label: "(GMT-03:00) Brasilia", offset: -3 },
    {
      value: "America/Argentina/Buenos_Aires",
      label: "(GMT-03:00) Buenos Aires",
      offset: -3,
    },
    {
      value: "Atlantic/South_Georgia",
      label: "(GMT-02:00) Mid-Atlantic",
      offset: -2,
    },
    { value: "Atlantic/Azores", label: "(GMT-01:00) Azores", offset: -1 },
    { value: "UTC", label: "(GMT+00:00) UTC", offset: 0 },
    {
      value: "Europe/London",
      label: "(GMT+00:00) London, Dublin, Lisbon",
      offset: 0,
    },
    {
      value: "Europe/Paris",
      label: "(GMT+01:00) Paris, Brussels, Madrid",
      offset: 1,
    },
    {
      value: "Europe/Berlin",
      label: "(GMT+01:00) Berlin, Rome, Amsterdam",
      offset: 1,
    },
    { value: "Africa/Cairo", label: "(GMT+02:00) Cairo", offset: 2 },
    {
      value: "Europe/Athens",
      label: "(GMT+02:00) Athens, Istanbul, Bucharest",
      offset: 2,
    },
    { value: "Asia/Jerusalem", label: "(GMT+02:00) Jerusalem", offset: 2 },
    { value: "Africa/Nairobi", label: "(GMT+03:00) Nairobi", offset: 3 },
    {
      value: "Europe/Moscow",
      label: "(GMT+03:00) Moscow, St. Petersburg",
      offset: 3,
    },
    { value: "Asia/Dubai", label: "(GMT+04:00) Dubai, Abu Dhabi", offset: 4 },
    { value: "Asia/Kabul", label: "(GMT+04:30) Kabul", offset: 4.5 },
    {
      value: "Asia/Karachi",
      label: "(GMT+05:00) Karachi, Islamabad",
      offset: 5,
    },
    {
      value: "Asia/Kolkata",
      label: "(GMT+05:30) Mumbai, Kolkata, New Delhi",
      offset: 5.5,
    },
    { value: "Asia/Kathmandu", label: "(GMT+05:45) Kathmandu", offset: 5.75 },
    { value: "Asia/Dhaka", label: "(GMT+06:00) Dhaka", offset: 6 },
    {
      value: "Asia/Yangon",
      label: "(GMT+06:30) Yangon (Rangoon)",
      offset: 6.5,
    },
    { value: "Asia/Bangkok", label: "(GMT+07:00) Bangkok, Jakarta", offset: 7 },
    {
      value: "Asia/Hong_Kong",
      label: "(GMT+08:00) Hong Kong, Beijing",
      offset: 8,
    },
    { value: "Asia/Singapore", label: "(GMT+08:00) Singapore", offset: 8 },
    { value: "Australia/Perth", label: "(GMT+08:00) Perth", offset: 8 },
    {
      value: "Asia/Tokyo",
      label: "(GMT+09:00) Tokyo, Seoul, Osaka",
      offset: 9,
    },
    { value: "Australia/Adelaide", label: "(GMT+09:30) Adelaide", offset: 9.5 },
    {
      value: "Australia/Sydney",
      label: "(GMT+10:00) Sydney, Melbourne",
      offset: 10,
    },
    { value: "Pacific/Guam", label: "(GMT+10:00) Guam", offset: 10 },
    {
      value: "Pacific/Auckland",
      label: "(GMT+12:00) Auckland, Wellington",
      offset: 12,
    },
    { value: "Pacific/Fiji", label: "(GMT+12:00) Fiji", offset: 12 },
    { value: "Pacific/Tongatapu", label: "(GMT+13:00) Nuku'alofa", offset: 13 },
  ];
};

/**
 * Get user's browser timezone
 * @returns {string} IANA timezone identifier
 */
export const getBrowserTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Format time in user's timezone
 * @param {Date|string} date
 * @param {string} timezone
 * @param {object} options Intl.DateTimeFormat options
 * @returns {string}
 */
export const formatInTimezone = (date, timezone, options = {}) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const defaultOptions = {
    timeZone: timezone || getBrowserTimezone(),
    ...options,
  };

  return new Intl.DateTimeFormat("en-US", defaultOptions).format(dateObj);
};

/**
 * Get timezone abbreviation (e.g., PST, EST)
 * @param {string} timezone
 * @param {Date} date
 * @returns {string}
 */
export const getTimezoneAbbreviation = (timezone, date = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "short",
  });

  const parts = formatter.formatToParts(date);
  const tzPart = parts.find((part) => part.type === "timeZoneName");
  return tzPart ? tzPart.value : "";
};

/**
 * Convert date from one timezone to another
 * @param {Date} date
 * @param {string} fromTimezone
 * @param {string} toTimezone
 * @returns {Date}
 */
export const convertBetweenTimezones = (date, fromTimezone, toTimezone) => {
  // Get the time string in the source timezone
  const timeStr = date.toLocaleString("en-US", { timeZone: fromTimezone });

  // Parse it as if it were in the target timezone
  const targetDate = new Date(timeStr + " " + toTimezone);

  return targetDate;
};

/**
 * Get current time in a specific timezone
 * @param {string} timezone
 * @returns {Date}
 */
export const getCurrentTimeInTimezone = (timezone) => {
  const now = new Date();
  const timeStr = now.toLocaleString("en-US", { timeZone: timezone });
  return new Date(timeStr);
};

/**
 * Format date and time for display
 * @param {Date|string} date
 * @param {string} timezone
 * @param {object} options
 * @returns {string}
 */
export const formatDateTime = (date, timezone, options = {}) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const defaultOptions = {
    timeZone: timezone || getBrowserTimezone(),
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  };

  return dateObj.toLocaleString("en-US", defaultOptions);
};

/**
 * Format time only
 * @param {Date|string} date
 * @param {string} timezone
 * @param {boolean} use24Hour
 * @returns {string}
 */
export const formatTime = (date, timezone, use24Hour = false) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  return dateObj.toLocaleTimeString("en-US", {
    timeZone: timezone || getBrowserTimezone(),
    hour: "2-digit",
    minute: "2-digit",
    hour12: !use24Hour,
  });
};

/**
 * Get timezone offset in hours
 * @param {string} timezone
 * @param {Date} date
 * @returns {number}
 */
export const getTimezoneOffset = (timezone, date = new Date()) => {
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
};

/**
 * Check if timezone observes DST at given date
 * @param {string} timezone
 * @param {Date} date
 * @returns {boolean}
 */
export const isDST = (timezone, date = new Date()) => {
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  const janOffset = getTimezoneOffset(timezone, jan);
  const julOffset = getTimezoneOffset(timezone, jul);
  const currentOffset = getTimezoneOffset(timezone, date);

  return currentOffset !== Math.max(janOffset, julOffset);
};

/**
 * Convert UTC date string to user's timezone
 * @param {string} utcDateString
 * @param {string} userTimezone
 * @returns {Date}
 */
export const utcToUserTimezone = (utcDateString, userTimezone) => {
  const utcDate = new Date(utcDateString);
  return new Date(utcDate.toLocaleString("en-US", { timeZone: userTimezone }));
};

/**
 * Convert user timezone date to UTC
 * @param {Date} date
 * @param {string} userTimezone
 * @returns {Date}
 */
export const userTimezoneToUTC = (date, userTimezone) => {
  const timeStr = date.toLocaleString("en-US", { timeZone: userTimezone });
  return new Date(timeStr + " UTC");
};
