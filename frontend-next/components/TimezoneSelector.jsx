"use client";
import { useState, useEffect } from "react";

// Common timezones grouped by region
const TIMEZONES = {
  Americas: [
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Phoenix", label: "Mountain Time - Arizona (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "America/Anchorage", label: "Alaska Time (AKT)" },
    { value: "Pacific/Honolulu", label: "Hawaii-Aleutian Time (HAT)" },
    { value: "America/Toronto", label: "Toronto" },
    { value: "America/Vancouver", label: "Vancouver" },
    { value: "America/Mexico_City", label: "Mexico City" },
    { value: "America/Sao_Paulo", label: "São Paulo" },
    { value: "America/Buenos_Aires", label: "Buenos Aires" },
  ],
  Europe: [
    { value: "Europe/London", label: "London (GMT/BST)" },
    { value: "Europe/Paris", label: "Paris (CET/CEST)" },
    { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
    { value: "Europe/Rome", label: "Rome (CET/CEST)" },
    { value: "Europe/Madrid", label: "Madrid (CET/CEST)" },
    { value: "Europe/Amsterdam", label: "Amsterdam (CET/CEST)" },
    { value: "Europe/Brussels", label: "Brussels (CET/CEST)" },
    { value: "Europe/Vienna", label: "Vienna (CET/CEST)" },
    { value: "Europe/Warsaw", label: "Warsaw (CET/CEST)" },
    { value: "Europe/Athens", label: "Athens (EET/EEST)" },
    { value: "Europe/Moscow", label: "Moscow (MSK)" },
  ],
  Asia: [
    { value: "Asia/Dubai", label: "Dubai (GST)" },
    { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
    { value: "Asia/Bangkok", label: "Bangkok (ICT)" },
    { value: "Asia/Singapore", label: "Singapore (SGT)" },
    { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)" },
    { value: "Asia/Shanghai", label: "China Standard Time (CST)" },
    { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
    { value: "Asia/Seoul", label: "Korea Standard Time (KST)" },
  ],
  Pacific: [
    { value: "Australia/Sydney", label: "Sydney (AEDT/AEST)" },
    { value: "Australia/Melbourne", label: "Melbourne (AEDT/AEST)" },
    { value: "Australia/Brisbane", label: "Brisbane (AEST)" },
    { value: "Australia/Perth", label: "Perth (AWST)" },
    { value: "Pacific/Auckland", label: "Auckland (NZDT/NZST)" },
  ],
  Other: [{ value: "UTC", label: "UTC (Coordinated Universal Time)" }],
};

function TimezoneSelector({ inline = false, showLabel = true }) {
  const [timezone, setTimezone] = useState("UTC");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTimezone();
  }, []);

  const loadTimezone = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/availability/timezone', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTimezone(data.timezone || "UTC");
      } else {
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimezone(browserTz || "UTC");
      }
    } catch (error) {
      console.error("Error loading timezone:", error);
      // Try to get browser timezone as fallback
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(browserTz || "UTC");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async (newTimezone) => {
    setTimezone(newTimezone);

    if (inline) {
      // Auto-save in inline mode
      try {
        setSaving(true);
        const token = localStorage.getItem('token');
        await fetch('/api/availability/timezone', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ timezone: newTimezone })
        });
      } catch (error) {
        console.error("Error updating timezone:", error);
        alert("Failed to update timezone");
        // Revert on error
        loadTimezone();
      } finally {
        setSaving(false);
      }
    }
  };

  const getCurrentTime = () => {
    if (!timezone) return "";
    try {
      const now = new Date();
      return now.toLocaleTimeString("en-US", {
        timeZone: timezone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return "";
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.875rem",
          color: "var(--color-secondary-text)",
        }}
      >
        <span
          className="material-icons-outlined animate-spin"
          style={{ fontSize: "0.875rem" }}
        >
          refresh
        </span>
        <span>Loading timezone...</span>
      </div>
    );
  }

  if (inline) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        {showLabel && (
          <label
            style={{
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "var(--color-primary-text)",
              minWidth: "80px",
            }}
          >
            Time zone
          </label>
        )}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <select
            value={timezone}
            onChange={(e) => handleChange(e.target.value)}
            disabled={saving}
            className="input-field"
            style={{
              fontSize: "0.875rem",
              flex: 1,
            }}
          >
            {Object.entries(TIMEZONES).map(([region, zones]) => (
              <optgroup key={region} label={region}>
                {zones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {saving && (
            <span
              className="material-icons-outlined animate-spin"
              style={{
                color: "var(--color-google-blue)",
                fontSize: "0.875rem",
              }}
            >
              refresh
            </span>
          )}
        </div>
        {timezone && (
          <span
            style={{
              fontSize: "0.875rem",
              color: "var(--color-secondary-text)",
              minWidth: "80px",
              textAlign: "right",
            }}
          >
            {getCurrentTime()}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {showLabel && (
        <label
          style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: "500",
            color: "var(--color-primary-text)",
          }}
        >
          Time zone
        </label>
      )}
      <select
        value={timezone}
        onChange={(e) => handleChange(e.target.value)}
        className="input-field"
        style={{
          fontSize: "0.875rem",
          width: "100%",
        }}
      >
        {Object.entries(TIMEZONES).map(([region, zones]) => (
          <optgroup key={region} label={region}>
            {zones.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {timezone && (
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--color-secondary-text)",
            margin: 0,
          }}
        >
          Current time: {getCurrentTime()}
        </p>
      )}
    </div>
  );
}

export default TimezoneSelector;
