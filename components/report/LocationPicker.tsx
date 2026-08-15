"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

const LocationMapPicker = dynamic(() => import("../map/LocationMapPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-950 text-sm text-slate-400">
      Loading interactive map...
    </div>
  )
});

const LOCATION_STORAGE_KEY = "fixmyroad_report_location";
const LOCATION_EXPIRY_MS = 5 * 60 * 1000;

export type LocationPayload = {
  address: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
};

type StoredLocation = LocationPayload & {
  capturedAt: number;
};

const DEFAULT_COORDS = { lat: 28.6139, lng: 77.2090 };

const emptyLocation: LocationPayload = {
  address: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  latitude: DEFAULT_COORDS.lat,
  longitude: DEFAULT_COORDS.lng
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
  const [lat, setLat] = useState<number>(DEFAULT_COORDS.lat);
  const [lng, setLng] = useState<number>(DEFAULT_COORDS.lng);
  const [statusText, setStatusText] = useState("Share your current location or click on the map to pin the exact position.");
  const [isExpired, setIsExpired] = useState(false);

  const applyLocation = useCallback(
    (nextLocation: LocationPayload) => {
      setAddress(nextLocation.address);
      setLandmark(nextLocation.landmark);
      setCity(nextLocation.city);
      setStateValue(nextLocation.state);
      setPincode(nextLocation.pincode);
      if (nextLocation.latitude !== undefined) setLat(nextLocation.latitude);
      if (nextLocation.longitude !== undefined) setLng(nextLocation.longitude);
      onChange(nextLocation);
    },
    [onChange]
  );

  useEffect(() => {
    const nextLocation = {
      address,
      landmark,
      city,
      state: stateValue,
      pincode,
      latitude: lat,
      longitude: lng
    };

    if (!address && !landmark && !city && !stateValue && !pincode) {
      return;
    }

    persistLocation(nextLocation);
    onChange(nextLocation);
  }, [address, landmark, city, stateValue, pincode, lat, lng, onChange]);

  useEffect(() => {
    const stored = readStoredLocation();
    if (!stored) {
      applyLocation(emptyLocation);
      return;
    }

    const nextLocation: LocationPayload = {
      address: stored.address || "",
      landmark: stored.landmark || "",
      city: stored.city || "",
      state: stored.state || "",
      pincode: stored.pincode || "",
      latitude: stored.latitude ?? DEFAULT_COORDS.lat,
      longitude: stored.longitude ?? DEFAULT_COORDS.lng
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
  }, [applyLocation]);

  const handleMapSelect = async (selectedLat: number, selectedLng: number) => {
    setLat(selectedLat);
    setLng(selectedLng);
    setStatusText(`Pinned on map: ${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)}. Reverse geocoding address...`);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${selectedLat}&lon=${selectedLng}`
      );

      if (response.ok) {
        const data = await response.json();
        const addressParts = data?.address ?? {};
        const newAddress =
          data?.display_name?.split(",").slice(0, 3).join(", ") ||
          `${addressParts.road || "Selected location"}, ${addressParts.neighbourhood || addressParts.suburb || "Area"}`;

        setAddress(newAddress);
        if (addressParts.landmark || addressParts.neighbourhood || addressParts.suburb) {
          setLandmark(addressParts.landmark || addressParts.neighbourhood || addressParts.suburb);
        }
        if (addressParts.city || addressParts.town || addressParts.village) {
          setCity(addressParts.city || addressParts.town || addressParts.village);
        }
        if (addressParts.state) {
          setStateValue(addressParts.state);
        }
        if (addressParts.postcode) {
          setPincode(addressParts.postcode);
        }
        setStatusText(`Location pinned: ${newAddress} (${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)})`);
      }
    } catch {
      setStatusText(`Location pinned at ${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)}. Fill address manually if needed.`);
    }
  };

  const useCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatusText("Location access is unavailable in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setLat(latitude);
          setLng(longitude);

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
            pincode: addressParts.postcode || "",
            latitude,
            longitude
          };

          persistLocation(nextLocation);
          applyLocation(nextLocation);
          setIsExpired(false);
          setStatusText(`GPS captured: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}. Marker updated on map.`);
        } catch {
          const fallbackLocation: LocationPayload = {
            address: address || "Current location",
            landmark: landmark || "Shared from device",
            city: city || "Unknown city",
            state: stateValue || "Unknown state",
            pincode: pincode || "",
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };

          persistLocation(fallbackLocation);
          applyLocation(fallbackLocation);
          setStatusText(`GPS captured: ${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}. Add address details if needed.`);
        }
      },
      () => {
        setStatusText("Location permission was blocked. Please click on the map or enter location manually.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  return (
    <Card className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-white">Location & Coordinates</p>
          <p className="text-sm text-slate-400">Use GPS, click the map, or type the address to pinpoint the exact location.</p>
        </div>
        <Button variant="secondary" size="sm" type="button" onClick={useCurrentLocation}>
          Use current GPS location
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
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Pincode</label>
          <Input value={pincode} onChange={(event) => setPincode(event.target.value)} placeholder="Pincode" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Coordinates (Lat, Lng)</label>
          <Input
            value={`${lat.toFixed(5)}, ${lng.toFixed(5)}`}
            readOnly
            className="bg-slate-950 text-teal-300 cursor-default"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 text-slate-300 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Interactive Leaflet Map Preview</p>
          <span className="text-xs text-teal-400">Drag pin or click map to update location</span>
        </div>

        <div className="h-72 overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-950">
          <LocationMapPicker lat={lat} lng={lng} onLocationSelect={handleMapSelect} />
        </div>

        <p className="text-xs text-slate-400">
          The exact GPS coordinates ({lat.toFixed(5)}, {lng.toFixed(5)}) will be attached to your civic issue report.
        </p>
      </div>
    </Card>
  );
}
