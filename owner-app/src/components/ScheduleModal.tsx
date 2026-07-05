// src/components/ScheduleModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { MenuItem, MenuItemSchedule } from "../types";

interface ScheduleModalProps {
  item: MenuItem;
  onClose: () => void;
  // note: same signature you already use
  onUpdateSchedule: (
    itemId: string,
    day: keyof MenuItemSchedule,
    field: "start" | "end" | "enabled",
    value: string | boolean
  ) => void;
}

const days: (keyof MenuItemSchedule)[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

// helper to compare HH:MM strings -> minutes
function hhmmToMinutes(hhmm: string) {
  const [hh, mm] = (hhmm || "00:00").split(":").map((s) => Number(s || 0));
  return (isNaN(hh) ? 0 : hh) * 60 + (isNaN(mm) ? 0 : mm);
}

export default function ScheduleModal({
  item,
  onClose,
  onUpdateSchedule,
}: ScheduleModalProps) {
  // keep a local editable copy so we can validate before writing
  const [localSchedule, setLocalSchedule] = useState<MenuItemSchedule>(() => {
    // clone to avoid mutating prop
    return JSON.parse(JSON.stringify(item.schedule || {})) as MenuItemSchedule;
  });

  // gather validation state per day (true if invalid)
  const invalidDays = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const d of days) {
      const s = localSchedule[d];
      if (!s) {
        map[d] = null;
        continue;
      }
      const start = hhmmToMinutes(s.start || "00:00");
      const end = hhmmToMinutes(s.end || "00:00");

      // Enforce: end time MUST NOT be before start time
      // i.e. we do NOT permit overnight ranges here.
      if (s.enabled && end < start) {
        map[d] = "End time must be the same or after start time (no overnight ranges).";
      } else {
        map[d] = null;
      }
    }
    return map;
  }, [localSchedule]);

  // any invalid?
  const anyInvalid = Object.values(invalidDays).some((v) => v !== null);

  // When the incoming item prop changes, refresh local copy
  useEffect(() => {
    setLocalSchedule(JSON.parse(JSON.stringify(item.schedule || {})) as MenuItemSchedule);
  }, [item.schedule]);

  // Called when user toggles enabled checkbox.
  // We will write immediately (this was existing behavior) and also update local copy.
  const handleToggleEnabled = (day: keyof MenuItemSchedule, next: boolean) => {
    setLocalSchedule((prev) => {
      const copy = { ...prev, [day]: { ...prev[day], enabled: next } };
      return copy;
    });
    // call parent immediately (owner expects quick apply)
    onUpdateSchedule(item.id, day, "enabled", next);
  };

  // Called when user edits start or end times.
  // We update local state immediately and only call onUpdateSchedule when pair is valid.
  const handleTimeChange = (day: keyof MenuItemSchedule, field: "start" | "end", value: string) => {
    setLocalSchedule((prev) => {
      const copy = { ...prev, [day]: { ...prev[day], [field]: value } };
      return copy;
    });

    // optimistic: compute validity now and call onUpdateSchedule only if valid
    const next = { ...localSchedule, [day]: { ...localSchedule[day], [field]: value } };
    const s = next[day];
    if (s) {
      const startMin = hhmmToMinutes(s.start || "00:00");
      const endMin = hhmmToMinutes(s.end || "00:00");
      if (s.enabled && endMin < startMin) {
        // invalid -> do not call parent; wait for user correction
        return;
      }
      // valid -> write immediately
      onUpdateSchedule(item.id, day, field, value);
    } else {
      // if schedule day missing, still call to ensure backend has value
      onUpdateSchedule(item.id, day, field, value);
    }
  };

  // When user clicks Done — if there are no validation errors we close.
  // (All valid changes were already pushed to onUpdateSchedule as the user typed.)
  const handleDone = () => {
    if (anyInvalid) {
      // shouldn't happen because button disabled, but guard anyway
      alert("Some days have invalid times. Please fix them before closing.");
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Schedule for {item.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {days.map((day) => {
            const ds = localSchedule[day] ?? { enabled: false, start: "09:00", end: "17:00" };
            const validationMessage = invalidDays[day];
            return (
              <div key={day} className="flex flex-col p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={!!ds.enabled}
                      onChange={(e) => handleToggleEnabled(day, e.target.checked)}
                      className="mr-2"
                    />
                    <span className="capitalize font-medium">{day}</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={ds.start}
                      onChange={(e) => handleTimeChange(day, "start", e.target.value)}
                      disabled={!ds.enabled}
                      className="px-2 py-1 border rounded disabled:bg-gray-100"
                    />
                    <span className="text-sm text-gray-500">to</span>
                    <input
                      type="time"
                      value={ds.end}
                      onChange={(e) => handleTimeChange(day, "end", e.target.value)}
                      disabled={!ds.enabled}
                      className="px-2 py-1 border rounded disabled:bg-gray-100"
                    />
                  </div>
                </div>

                {validationMessage && (
                  <p className="text-rose-600 text-sm mt-2">{validationMessage}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleDone}
            disabled={anyInvalid}
            className={`px-4 py-2 rounded-lg text-white ${
              anyInvalid
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
