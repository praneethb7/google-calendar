"use client";
import { useState, useEffect } from "react";

function HolidaySettings({ isOpen, onClose }) {
  const [preferences, setPreferences] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Load supported countries
      const countriesRes = await fetch(
        "http://localhost:5000/api/holidays/countries",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const countriesData = await countriesRes.json();
      setCountries(countriesData.countries || []);

      // Load user preferences
      const prefsRes = await fetch(
        "http://localhost:5000/api/holidays/preferences",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const prefsData = await prefsRes.json();
      setPreferences(prefsData.preferences || []);
    } catch (error) {
      console.error("Failed to load holiday data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPreference = async () => {
    if (!selectedCountry) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/holidays/preferences",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            countryCode: selectedCountry,
            region: selectedRegion || null,
            isEnabled: true,
          }),
        }
      );

      if (response.ok) {
        loadData();
        setSelectedCountry("");
        setSelectedRegion("");
      }
    } catch (error) {
      console.error("Failed to add preference:", error);
    }
  };

  const handleTogglePreference = async (pref) => {
    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:5000/api/holidays/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          countryCode: pref.countryCode,
          region: pref.region,
          isEnabled: !pref.isEnabled,
        }),
      });
      loadData();
    } catch (error) {
      console.error("Failed to toggle preference:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1E1F20] rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Holiday Settings
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
          >
            <span className="material-icons-outlined text-gray-700 dark:text-gray-300">
              close
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Add Holiday Calendar
                </h3>
                <div className="flex gap-2">
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-[#2A2B2D] text-gray-800 dark:text-gray-200"
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    placeholder="Region (optional)"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-[#2A2B2D] text-gray-800 dark:text-gray-200"
                  />
                  <button
                    onClick={handleAddPreference}
                    disabled={!selectedCountry}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Your Holiday Calendars
                </h3>
                {preferences.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No holiday calendars added yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {preferences.map((pref) => (
                      <div
                        key={pref.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#2A2B2D] rounded"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={pref.isEnabled}
                            onChange={() => handleTogglePreference(pref)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {countries.find(
                                (c) => c.code === pref.countryCode
                              )?.name || pref.countryCode}
                            </div>
                            {pref.region && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {pref.region}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default HolidaySettings;
