"use client";

import React, { useState, useEffect } from "react";
import { X, SlidersHorizontal, Check, AlertCircle } from "lucide-react";

interface EditActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: any;
  onSuccess: () => void;
}

const CATEGORIES = [
  { id: "FOOD_CAFES", label: "Food & Cafes" },
  { id: "MOVIES", label: "Movies & Cinema" },
  { id: "WALKING", label: "Walking & Trails" },
  { id: "STUDYING", label: "Studying & Co-Working" },
  { id: "EVENTS", label: "Events & Concerts" },
  { id: "SHOPPING", label: "Shopping & Markets" },
  { id: "CITY_EXPLORATION", label: "City Exploration" },
  { id: "OTHER", label: "Other Activity" },
];

export const EditActivityModal: React.FC<EditActivityModalProps> = ({
  isOpen,
  onClose,
  activity,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "OTHER",
    date: "",
    startTime: "18:30",
    approxDurationHours: "2.0",
    locationName: "",
    genderPreference: "ANY",
    cutoffHoursBeforeStart: "1",
    additionalRequirements: "",
    imageUrl: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activity && isOpen) {
      const rawDate = activity.date ? new Date(activity.date).toISOString().split("T")[0] : "";
      setFormData({
        title: activity.title || "",
        description: activity.description || "",
        category: activity.category || "OTHER",
        date: rawDate,
        startTime: activity.startTime || "18:30",
        approxDurationHours: String(activity.approxDurationHours || "2.0"),
        locationName: activity.locationName || "",
        genderPreference: activity.genderPreference || "ANY",
        cutoffHoursBeforeStart: String(activity.cutoffHoursBeforeStart || "1"),
        additionalRequirements: activity.additionalRequirements || "",
        imageUrl: activity.imageUrl || "",
      });
      setError(null);
    }
  }, [activity, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/activities/${activity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update activity");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update activity");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0f1714] border border-slate-200 dark:border-emerald-950/80 rounded-3xl shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-950/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center text-orange-600">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Edit Activity Details
              </h2>
              <p className="text-[11px] text-slate-500">
                You can edit this activity anytime as the host
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-elevated transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Title *
            </label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/80 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/80 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 leading-relaxed"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/80 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Start Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Date *
              </label>
              <input
                required
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/80 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Start Time *
              </label>
              <input
                required
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/80 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Duration & Cutoff */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Duration (hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                value={formData.approxDurationHours}
                onChange={(e) => setFormData({ ...formData, approxDurationHours: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/80 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Request Cutoff
              </label>
              <select
                value={formData.cutoffHoursBeforeStart}
                onChange={(e) => setFormData({ ...formData, cutoffHoursBeforeStart: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/80 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="1">1 hour before (Default)</option>
                <option value="0.5">30 minutes before</option>
                <option value="2">2 hours before</option>
                <option value="3">3 hours before</option>
                <option value="6">6 hours before</option>
                <option value="12">12 hours before</option>
                <option value="24">24 hours before</option>
              </select>
            </div>
          </div>

          {/* Location & Gender Preference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Location
              </label>
              <input
                type="text"
                placeholder="e.g. Bandra West, Mumbai"
                value={formData.locationName}
                onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/80 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Gender Preference
              </label>
              <select
                value={formData.genderPreference}
                onChange={(e) => setFormData({ ...formData, genderPreference: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/80 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="ANY">Any gender welcome</option>
                <option value="FEMALE_ONLY">Women only</option>
                <option value="MALE_ONLY">Men only</option>
              </select>
            </div>
          </div>

          {/* Requirements */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Joining Requirements (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Split bills equally, bring camera"
              value={formData.additionalRequirements}
              onChange={(e) => setFormData({ ...formData, additionalRequirements: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/80 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-emerald-950/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-[#16201b] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-md shadow-orange-500/20 hover:scale-105 active:scale-95 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
