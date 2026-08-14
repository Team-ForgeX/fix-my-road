"use client";

import { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

const LOCATION_STORAGE_KEY = "fixmyroad_report_location";
const LOCATION_EXPIRY_MS = 5 * 60 * 1000;

type LocationPayload = {
  address: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
};

type StoredLocation = LocationPayload & {
  capturedAt: number;
};

const emptyLocation: LocationPayload = {
  address: "",
  landmark: "",
  city: "",
  state: "",
  pincode: ""
};

const readStoredLocation = (): StoredLocation | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredLocation;
    if (!parsed || typeof parsed.capturedAt !== "number") return null;

    if (Date.now() - parsed.capturedAt > LOCATION_EXPIRY_MS) {
      window.localStorage.removeItem(LOCATION_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const persistLocation = (location: LocationPayload) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    LOCATION_STORAGE_KEY,
    JSON.stringify({ ...location, capturedAt: Date.now() })
  );
};

const clearPersistedLocation = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCATION_STORAGE_KEY);
};

export function LocationPicker({
  onChange
}: {
  onChange: (payload: LocationPayload) => void;
}) {
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [pincode, setPincode] = useState("");
  const [statusText, setStatusText] = useState("Share your current location to auto-fill the report address.");
  const [isExpired, setIsExpired] = useState(false);

  const applyLocation = (nextLocation: LocationPayload) => {
    setAddress(nextLocation.address);
    setLandmark(nextLocation.landmark);
    setCity(nextLocation.city);
    setStateValue(nextLocation.state);
    setPincode(nextLocation.pincode);
    onChange(nextLocation);
  };

  useEffect(() => {
    const nextLocation = {
      address,
      landmark,
      city,
      state: stateValue,
      pincode
    };

    if (!address && !landmark && !city && !stateValue && !pincode) {
      return;
    }

    persistLocation(nextLocation);
  }, [address, landmark, city, stateValue, pincode]);

  useEffect(() => {
    const stored = readStoredLocation();
    if (!stored) {
      applyLocation(emptyLocation);
      return;
    }

    const nextLocation = {
      address: stored.address || "",
      landmark: stored.landmark || "",
      city: stored.city || "",
      state: stored.state || "",
      pincode: stored.pincode || ""
    };

    applyLocation(nextLocation);
    setStatusText("Using your last shared location. It will expire in 5 minutes if you do not submit.");

    const remaining = LOCATION_EXPIRY_MS - (Date.now() - stored.capturedAt);
    if (remaining <= 0) {
      clearPersistedLocation();
      setIsExpired(true);
      setStatusText("Location expired. Please share your current location again.");
      applyLocation(emptyLocation);
      return;
    }

    const expiryTimer = window.setTimeout(() => {
      clearPersistedLocation();
      setIsExpired(true);
      setStatusText("Location expired. Please share your current location again.");
      applyLocation(emptyLocation);
    }, remaining);

    return () => window.clearTimeout(expiryTimer);
  }, [onChange]);

  const useCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatusText("Location access is unavailable in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );

          if (!response.ok) throw new Error("Reverse geocoding failed");

          const data = await response.json();
          const addressParts = data?.address ?? {};
          const nextLocation: LocationPayload = {
            address:
              data?.display_name?.split(",").slice(0, 3).join(", ") ||
              `${addressParts.road || "Current location"}, ${addressParts.neighbourhood || addressParts.suburb || "Nearby area"}`,
            landmark: addressParts.landmark || addressParts.neighbourhood || addressParts.suburb || "Nearby landmark",
            city: addressParts.city || addressParts.town || addressParts.village || "Unknown city",
            state: addressParts.state || "Unknown state",
            pincode: addressParts.postcode || ""
          };

          persistLocation(nextLocation);
          applyLocation(nextLocation);
          setIsExpired(false);
          setStatusText("Live location captured. It will be cleared automatically after 5 minutes if no report is submitted.");
        } catch {
          const fallbackLocation: LocationPayload = {
            address: "Current location",
            landmark: "Shared from device",
            city: "Unknown city",
            state: "Unknown state",
            pincode: ""
          };

          persistLocation(fallbackLocation);
          applyLocation(fallbackLocation);
          setStatusText("Location captured. Add the exact address if needed before submitting the report.");
        }
      },
      () => {
        setStatusText("Location permission was blocked. Please enter the location manually.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  return (
    <Card className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-white">Location</p>
          <p className="text-sm text-slate-400">Share the address and any nearby landmark.</p>
        </div>
        <Button variant="secondary" size="sm" type="button" onClick={useCurrentLocation}>
          Use current location
        </Button>
      </div>

      <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 px-4 py-3 text-sm text-teal-100">
        {statusText}
        {isExpired && " Please share the location again."}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Address</label>
          <Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Enter full address" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Landmark</label>
          <Input value={landmark} onChange={(event) => setLandmark(event.target.value)} placeholder="Optional landmark" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">City</label>
          <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">State / Region</label>
          <Input value={stateValue} onChange={(event) => setStateValue(event.target.value)} placeholder="State" />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-300">Pincode</label>
          <Input value={pincode} onChange={(event) => setPincode(event.target.value)} placeholder="Pincode" />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 text-slate-300">
        <p className="mb-3 text-sm font-semibold text-white">Location preview</p>
        <div className="aspect-[4/2] overflow-hidden rounded-3xl bg-slate-950"></div>
        <p className="mt-3 text-sm text-slate-400">
          The address is kept for 5 minutes while the report is being prepared. If you do not submit it in time, you will need to share the location again.
        </p>
      </div>
    </Card>
  );
}
