"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORIES,
  CATEGORY_KEYS,
  isEmergencyCategory,
  servicesForCategory,
} from "@/lib/categories";
import EmergencyCallPanel from "@/components/EmergencyCallPanel";
import { AlertIcon } from "@/components/ServiceIcons";

const CIVIC_KEYS = CATEGORY_KEYS.filter((key) => !CATEGORIES[key].emergency);
const EMERGENCY_KEYS = CATEGORY_KEYS.filter((key) => CATEGORIES[key].emergency);

export default function ReportForm() {
  const router = useRouter();
  const fileRef = useRef(null);

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [preview, setPreview] = useState(null);
  const [notified, setNotified] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const emergency = isEmergencyCategory(category);
  const services = servicesForCategory(category);

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation is not supported in this browser. Enter the coordinates manually.");
      return;
    }
    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocationError("Could not get your location. Enter the coordinates manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const data = new FormData();
    data.append("category", category);
    data.append("description", description);
    data.append("address", address);
    data.append("latitude", latitude);
    data.append("longitude", longitude);
    data.append("notifiedServices", emergency ? notified.join(",") : "");
    data.append("photo", fileRef.current?.files?.[0]);

    try {
      const res = await fetch("/api/reports", { method: "POST", body: data });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Failed to submit the report. Please try again.");
        setBusy(false);
        return;
      }
      router.push(`/reports/${json.id}`);
      router.refresh();
    } catch {
      setError("Failed to submit the report. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="category">
          Category *
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setNotified([]);
          }}
          required
          className="tap w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="" disabled>
            Select the type of issue
          </option>
          <optgroup label="Civic issues">
            {CIVIC_KEYS.map((key) => (
              <option key={key} value={key}>
                {CATEGORIES[key].emoji} {CATEGORIES[key].label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Emergencies — with helpline call buttons">
            {EMERGENCY_KEYS.map((key) => (
              <option key={key} value={key}>
                {CATEGORIES[key].emoji} {CATEGORIES[key].label}
              </option>
            ))}
          </optgroup>
        </select>

        {emergency && (
          <p className="mt-2 inline-flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-800 ring-1 ring-red-200">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            Emergency selected — call the helpline below if anyone is in danger, and the authority
            will be told which services you already informed.
          </p>
        )}
      </div>

      {/* One-tap emergency calls, only for emergency categories */}
      {emergency && (
        <EmergencyCallPanel
          key={category}
          category={category}
          variant="form"
          notified={notified.map((service) => ({ service }))}
          onNotifyChange={setNotified}
        />
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="description">
          Description *
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          minLength={10}
          rows={4}
          placeholder="Describe the problem — how big is it, where exactly, since when?"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="photo">
          Photo proof *
        </label>
        <input
          id="photo"
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          required
          onChange={onFileChange}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3.5 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-700"
        />
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Preview of the uploaded photo"
            className="mt-3 h-44 w-full rounded-xl object-cover ring-1 ring-slate-200 sm:w-64"
          />
        )}
      </div>

      <div>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <label className="block text-sm font-medium text-slate-700">Location *</label>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="tap rounded-full bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-100 disabled:opacity-60"
          >
            {locating ? "Locating…" : "📡 Use my location"}
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-500" htmlFor="latitude">
              Latitude
            </label>
            <input
              id="latitude"
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              required
              placeholder="e.g. 12.971599"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500" htmlFor="longitude">
              Longitude
            </label>
            <input
              id="longitude"
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              required
              placeholder="e.g. 77.594566"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
        {locationError && <p className="mt-1 text-xs text-amber-600">{locationError}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="address">
          Street / area <span className="text-slate-400">(optional)</span>
        </label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. MG Road, near City Mall"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 -mx-6 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        {emergency && notified.length > 0 && (
          <p className="mb-2 text-xs font-medium text-emerald-700">
            Saved with your report: you already informed {notified.length} of {services.length}{" "}
            services.
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className={`tap w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
            emergency ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {busy ? "Submitting…" : emergency ? "Submit emergency report" : "Submit report"}
        </button>
      </div>
    </form>
  );
}
