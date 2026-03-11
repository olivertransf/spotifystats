"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "uploading" | "success" | "error";

interface ImportResult {
  total: number;
  valid: number;
  inserted: number;
  skipped: number;
}

export default function ImportPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".zip")) {
      setError("Please upload the ZIP file from your Spotify data export.");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setError(null);
    setProgress(20);

    const formData = new FormData();
    formData.append("file", file);

    setProgress(50);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      setProgress(90);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Import failed.");
        setStatus("error");
        return;
      }

      setResult(data);
      setStatus("success");
      setProgress(100);
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Spotify Data</h1>
        <p className="text-muted-foreground mt-1">
          Upload your Spotify data export to load your full listening history.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to get your data export</CardTitle>
          <CardDescription>Takes 1-5 days for Spotify to prepare</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            <>Go to <a href="https://www.spotify.com/account/privacy/" target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-1 hover:underline">spotify.com/account/privacy <ExternalLink className="h-3 w-3" /></a></>,
            <>Check <strong className="text-foreground">Extended streaming history</strong> only (uncheck everything else)</>,
            <>Click <strong className="text-foreground">Request data</strong> and confirm via the email Spotify sends</>,
            <>Wait 1-5 days — you&apos;ll get another email with a download link</>,
            <>Download the ZIP file and upload it here</>,
          ].map((step, i) => (
            <div key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                {i + 1}
              </span>
              <p className="text-muted-foreground">{step}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              status === "uploading" && "pointer-events-none opacity-60"
            )}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={onInputChange}
            />
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium">Drop your ZIP file here</p>
            <p className="text-muted-foreground text-sm mt-1">or click to browse</p>
          </div>

          {status === "uploading" && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Processing your data...</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {status === "success" && result && (
            <div className="mt-4 rounded-lg bg-primary/10 border border-primary/20 p-4 flex gap-3">
              <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-foreground">Import complete</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary">{result.total.toLocaleString()} total entries</Badge>
                  <Badge variant="secondary">{result.inserted.toLocaleString()} new streams added</Badge>
                  <Badge variant="secondary">{result.skipped.toLocaleString()} duplicates skipped</Badge>
                </div>
                <p className="text-muted-foreground mt-2">
                  Head to the <a href="/" className="text-primary hover:underline">Overview</a> to see your stats.
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Import failed</p>
                <p className="text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
