"use client";
import { useState } from 'react';

function RecurringEventPicker({ value, onChange }) {
  const [showCustom, setShowCustom] = useState(false);
  const [frequency, setFrequency] = useState('DAILY');
  const [interval, setInterval] = useState(1);
  const [count, setCount] = useState('');
  const [until, setUntil] = useState('');
  const [weekDays, setWeekDays] = useState([]);

  const presets = [
    { label: 'Does not repeat', value: null },
    { label: 'Daily', value: 'FREQ=DAILY;INTERVAL=1' },
    { label: 'Weekly on {day}', value: 'FREQ=WEEKLY;INTERVAL=1' },
    { label: 'Monthly', value: 'FREQ=MONTHLY;INTERVAL=1' },
    { label: 'Yearly', value: 'FREQ=YEARLY;INTERVAL=1' },
    { label: 'Every weekday (Monday to Friday)', value: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' },
    { label: 'Custom...', value: 'custom' },
  ];

  const handlePresetChange = (presetValue) => {
    if (presetValue === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onChange(presetValue);
    }
  };

  const handleCustomChange = () => {
    let rrule = `FREQ=${frequency};INTERVAL=${interval}`;

    if (frequency === 'WEEKLY' && weekDays.length > 0) {
      rrule += `;BYDAY=${weekDays.join(',')}`;
    }

    if (count) {
      rrule += `;COUNT=${count}`;
    } else if (until) {
      rrule += `;UNTIL=${new Date(until).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    }

    onChange(rrule);
  };

  const toggleWeekDay = (day) => {
    setWeekDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const weekDayOptions = [
    { label: 'S', value: 'SU' },
    { label: 'M', value: 'MO' },
    { label: 'T', value: 'TU' },
    { label: 'W', value: 'WE' },
    { label: 'T', value: 'TH' },
    { label: 'F', value: 'FR' },
    { label: 'S', value: 'SA' },
  ];

  return (
    <div>
      {!showCustom ? (
        <div
          className="rounded-[4px] bg-[#1e1f20] py-1"
          style={{
            width: '249px',
            boxShadow:
              '0 1px 2px 0 rgba(0,0,0,0.3), 0 2px 6px 2px rgba(0,0,0,0.15)',
          }}
          aria-label="Recurrence"
          role="listbox"
        >
          {presets.map((preset, index) => (
            <button
              key={index}
              type="button"
              role="option"
              aria-selected={value === preset.value}
              onClick={() => handlePresetChange(preset.value)}
              className={`flex w-full items-center gap-3 px-3 text-left transition-colors hover:bg-[#444746] ${
                value === preset.value ? 'bg-[#444746]' : ''
              }`}
              style={{ minHeight: '26px', paddingTop: '3px', paddingBottom: '3px' }}
            >
              <span
                className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
                style={{
                  fontFamily:
                    '"Google Sans", Roboto, Arial, sans-serif',
                  fontSize: '13px',
                  lineHeight: '18px',
                  color: '#e3e3e3',
                }}
              >
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3 p-4 bg-google-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCustom(false)}
              className="text-google-blue-600 hover:underline text-sm"
            >
              ← Back to presets
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-google-gray-700 mb-1">
                Repeat every
              </label>
              <input
                type="number"
                min="1"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="input-field text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-google-gray-700 mb-1">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="input-field text-sm"
              >
                <option value="DAILY">Day(s)</option>
                <option value="WEEKLY">Week(s)</option>
                <option value="MONTHLY">Month(s)</option>
                <option value="YEARLY">Year(s)</option>
              </select>
            </div>
          </div>

          {frequency === 'WEEKLY' && (
            <div>
              <label className="block text-xs font-medium text-google-gray-700 mb-2">
                Repeat on
              </label>
              <div className="flex gap-1">
                {weekDayOptions.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeekDay(day.value)}
                    className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                      weekDays.includes(day.value)
                        ? 'bg-google-blue-600 text-white'
                        : 'bg-white border border-google-gray-300 text-google-gray-700 hover:bg-google-gray-100'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-google-gray-700 mb-2">
              Ends
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  checked={!count && !until}
                  onChange={() => {
                    setCount('');
                    setUntil('');
                  }}
                  className="w-4 h-4 text-google-blue-600"
                />
                <span className="text-sm text-google-gray-700">Never</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  checked={!!count}
                  onChange={() => {
                    setCount('10');
                    setUntil('');
                  }}
                  className="w-4 h-4 text-google-blue-600"
                />
                <span className="text-sm text-google-gray-700">After</span>
                <input
                  type="number"
                  min="1"
                  value={count}
                  onChange={(e) => {
                    setCount(e.target.value);
                    setUntil('');
                  }}
                  disabled={!count}
                  className="input-field text-sm w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-sm text-google-gray-700">occurrences</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  checked={!!until}
                  onChange={() => {
                    setUntil(new Date().toISOString().split('T')[0]);
                    setCount('');
                  }}
                  className="w-4 h-4 text-google-blue-600"
                />
                <span className="text-sm text-google-gray-700">On</span>
                <input
                  type="date"
                  value={until}
                  onChange={(e) => {
                    setUntil(e.target.value);
                    setCount('');
                  }}
                  disabled={!until}
                  className="input-field text-sm"
                />
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCustomChange}
            className="btn-primary text-sm px-4 py-2"
          >
            Apply Custom Rule
          </button>
        </div>
      )}
    </div>
  );
}

export default RecurringEventPicker;
