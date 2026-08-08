"use client";

import { useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export function LocationPicker({
  onChange
}: {
  onChange: (payload: {
    address: string;
    landmark: string;
    city: string;
    state: string;
    pincode: string;
  }) => void;
}) {
  const [address, setAddress] = useState("42 Oak Street, Sector 7");
  const [landmark, setLandmark] = useState("Bus stop near pond");
  const [city, setCity] = useState("New Delhi");
  const [stateValue, setStateValue] = useState("Delhi");
  const [pincode, setPincode] = useState("110001");

  const useCurrentLocation = () => {
    setAddress("Near Bus Stop, Oak Street");
    setLandmark("Bus stop");
    setCity("New Delhi");
    setStateValue("Delhi");
    setPincode("110001");
    onChange({ address, landmark, city, state: stateValue, pincode });
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
          Mock location preview for now. Replace with a map component when API keys are available.
        </p>
      </div>
    </Card>
  );
}
