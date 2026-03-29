"use client";
import { useState } from 'react';

/**
 * EventColorPicker - Google Calendar-style color picker for events
 * Allows users to assign custom colors to individual events
 */
function EventColorPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  // Google Calendar event colors
  const colors = [
    { name: 'Tomato', value: '#d50000', textColor: '#ffffff' },
    { name: 'Flamingo', value: '#e67c73', textColor: '#ffffff' },
    { name: 'Tangerine', value: '#f4511e', textColor: '#ffffff' },
    { name: 'Banana', value: '#f6bf26', textColor: '#000000' },
    { name: 'Sage', value: '#33b679', textColor: '#ffffff' },
    { name: 'Basil', value: '#0b8043', textColor: '#ffffff' },
    { name: 'Peacock', value: '#039be5', textColor: '#ffffff' },
    { name: 'Blueberry', value: '#3f51b5', textColor: '#ffffff' },
    { name: 'Lavender', value: '#7986cb', textColor: '#ffffff' },
    { name: 'Grape', value: '#8e24aa', textColor: '#ffffff' },
    { name: 'Graphite', value: '#616161', textColor: '#ffffff' },
    { name: 'Calendar', value: null, textColor: '#000000' }, // Use calendar's default color
  ];

  const selectedColor = colors.find(c => c.value === value) || colors[colors.length - 1];

  const handleColorSelect = (color) => {
    onChange(color.value);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 border border-google-gray-300 rounded hover:bg-google-gray-50 transition-colors"
        title="Event color"
      >
        <div
          className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: selectedColor.value || '#1a73e8' }}
        />
        <span className="text-sm text-google-gray-700">{selectedColor.name}</span>
        <span className="material-icons-outlined text-sm text-google-gray-600">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Color picker dropdown */}
          <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-google-gray-200 p-3 z-50 min-w-[240px]">
            <div className="text-xs font-medium text-google-gray-600 mb-2 px-1">
              Event color
            </div>
            <div className="grid grid-cols-4 gap-2">
              {colors.map((color) => {
                const isSelected = selectedColor.value === color.value;
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={`relative group flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                      isSelected ? 'ring-2 ring-google-blue-600 ring-offset-2' : 'hover:scale-110'
                    }`}
                    title={color.name}
                  >
                    <div
                      className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: color.value || '#1a73e8' }}
                    />
                    {isSelected && (
                      <span
                        className="material-icons-outlined absolute text-lg"
                        style={{ color: color.textColor }}
                      >
                        check
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="text-xs text-google-gray-600 mt-3 px-1">
              {selectedColor.value === null
                ? 'Using calendar\'s default color'
                : 'Custom color for this event'}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default EventColorPicker;
