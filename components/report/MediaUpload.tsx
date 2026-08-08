"use client";

import { useMemo, useState } from "react";
import { ImagePlus, Video, Trash2, UploadCloud } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export type SelectedFile = {
  id: string;
  file: File;
  preview: string;
};

const fileSize = (value: number) => `${(value / 1024).toFixed(1)} KB`;

export function MediaUpload({ onChange }: { onChange: (files: File[]) => void }) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  const previewItems = useMemo(
    () =>
      selectedFiles.map((item) => ({
        ...item,
        type: item.file.type.startsWith("image") ? "image" : "video"
      })),
    [selectedFiles]
  );

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const entries = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      file,
      preview: URL.createObjectURL(file)
    }));
    setSelectedFiles((prev) => [...prev, ...entries]);
    onChange([...selectedFiles.map((item) => item.file), ...entries.map((item) => item.file)]);
  };

  const removeFile = (id: string) => {
    const updated = selectedFiles.filter((item) => item.id !== id);
    setSelectedFiles(updated);
    onChange(updated.map((item) => item.file));
  };

  return (
    <Card className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-white">Evidence</p>
          <p className="text-sm text-slate-400">Upload images or videos to support your report.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200 transition hover:border-teal-400 hover:text-teal-300">
          <UploadCloud className="h-4 w-4" />
          Add files
          <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={(event) => handleFiles(event.target.files)} />
        </label>
      </div>

      <div className="grid gap-4">
        {previewItems.length === 0 && (
          <div className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-8 text-center text-slate-500">
            Drag and drop files here or use the upload button.
          </div>
        )}

        {previewItems.map((item) => (
          <div key={item.id} className="grid gap-3 rounded-3xl border border-slate-800/80 bg-slate-950/80 p-4 sm:grid-cols-[120px_1fr_auto]">
            <div className="overflow-hidden rounded-3xl bg-slate-900">
              {item.type === "image" ? (
                <img src={item.preview} alt={item.file.name} className="h-28 w-full object-cover" />
              ) : (
                <div className="relative flex h-28 items-center justify-center bg-slate-900 text-slate-400">
                  <Video className="h-10 w-10" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-white">{item.file.name}</p>
              <p className="text-sm text-slate-400">{fileSize(item.file.size)}</p>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-3/4 rounded-full bg-teal-500" />
              </div>
            </div>
            <button type="button" onClick={() => removeFile(item.id)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-slate-400 hover:bg-slate-800">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
