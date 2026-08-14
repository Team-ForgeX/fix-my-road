"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Button } from "../ui/Button";
import { MediaUpload } from "./MediaUpload";
import { LocationPicker } from "./LocationPicker";
import { Card } from "../ui/Card";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "../AuthContext";

const initialLocation = {
  address: "",
  landmark: "",
  city: "",
  state: "",
  pincode: ""
};

export function ReportForm() {
  const { saveReport } = useAuth();
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [problemType, setProblemType] = useState("pothole");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [location, setLocation] = useState(initialLocation);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dedupeMessage, setDedupeMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    const validationErrors: string[] = [];

    if (!description.trim()) {
      validationErrors.push("Please describe the issue.");
    }
    if (!location.address.trim()) {
      validationErrors.push("Please provide a location address.");
    }

    setErrors(validationErrors);
    if (validationErrors.length > 0) return;

    setSubmitting(true);
    const result = await saveReport({ title, description, mediaFiles, location, problemType });
    setSubmitting(false);

    if (!result.success) {
      setSubmitError(result.error ?? "Unable to submit report.");
      return;
    }

    setDedupeMessage(
      result.dedupeDecision === "linked"
        ? "Your report matched and was linked to an existing nearby incident (report count incremented)."
        : "A new incident was registered from your report."
    );
    setSubmitted(true);
  };

  const hasSubmitted = useMemo(() => submitted, [submitted]);

  if (hasSubmitted) {
    return (
      <Card className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-white">Report submitted successfully</h2>
          <p className="mt-2 text-slate-400">
            {dedupeMessage ?? "Thank you! Your report has been stored in the database and processed."}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => { setSubmitted(false); setDedupeMessage(null); }}>Submit another report</Button>
          <Link href="/reports" className="inline-flex">
            <Button variant="secondary">View my reports</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card className="space-y-6">
        <div>
          <p className="text-lg font-semibold text-white">Problem details</p>
          <p className="text-sm text-slate-400">Select category and describe what you observed.</p>
        </div>
        <div className="grid gap-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="report-category">
              Issue Category
            </label>
            <select
              id="report-category"
              value={problemType}
              onChange={(event) => setProblemType(event.target.value)}
              className="w-full rounded-full border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white focus:border-teal-400 focus:outline-none"
            >
              <option value="pothole">Pothole / Road Surface Defect</option>
              <option value="water_leak">Water Leakage / Broken Pipe</option>
              <option value="streetlight">Streetlight Outage</option>
              <option value="garbage">Garbage Accumulation</option>
              <option value="drainage">Blocked Drain / Sewage</option>
              <option value="traffic">Traffic Signal / Signage Defect</option>
              <option value="general">Other Infrastructure Issue</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="report-title">
              Short title (optional)
            </label>
            <Input
              id="report-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example: Large pothole near main crossroad"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="report-description">
              Issue description
            </label>
            <Textarea
              id="report-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the issue, exact street details, and anything that helps municipal teams respond..."
            />
          </div>
        </div>
      </Card>

      <MediaUpload onChange={(files) => setMediaFiles(files)} />

      <LocationPicker onChange={(payload) => setLocation(payload)} />

      {errors.length > 0 && (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
          <p className="font-semibold">Please fix the following issues:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {submitError ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
          {submitError}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">All fields are stored as part of your report. No incident is created until verification.</p>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting report…" : "Submit Report"}
        </Button>
      </div>
    </form>
  );
}
