"use client";
import { formatDateTime, formatTime, getTimezoneAbbreviation } from '@/utils/timezoneUtils';
import { useState, useEffect } from 'react';

/**
 * TimeDisplay component - automatically displays times in user's timezone
 * @param {Date|string} time - The time to display
 * @param {string} format - 'datetime', 'time', 'date'
 * @param {boolean} showTimezone - Whether to show timezone abbreviation
 * @param {string} className - Additional CSS classes
 */
function TimeDisplay({ time, format = 'datetime', showTimezone = false, className = '' }) {
  const [userTimezone, setUserTimezone] = useState('UTC');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserTimezone();
  }, []);

  const loadUserTimezone = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/availability/timezone', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserTimezone(data.timezone || 'UTC');
      } else {
        setUserTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
      }
    } catch (error) {
      // Fallback to browser timezone
      setUserTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !time) {
    return <span className={className}>--</span>;
  }

  const dateObj = typeof time === 'string' ? new Date(time) : time;

  let formattedTime = '';

  switch (format) {
    case 'time':
      formattedTime = formatTime ? formatTime(dateObj, userTimezone) : dateObj.toLocaleTimeString();
      break;
    case 'date':
      formattedTime = dateObj.toLocaleDateString('en-US', {
        timeZone: userTimezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      break;
    case 'datetime':
    default:
      formattedTime = formatDateTime ? formatDateTime(dateObj, userTimezone) : dateObj.toLocaleString();
      break;
  }

  if (showTimezone && getTimezoneAbbreviation) {
    const tzAbbr = getTimezoneAbbreviation(userTimezone, dateObj);
    formattedTime += ` ${tzAbbr}`;
  }

  return <span className={className} title={dateObj.toISOString()}>{formattedTime}</span>;
}

export default TimeDisplay;
