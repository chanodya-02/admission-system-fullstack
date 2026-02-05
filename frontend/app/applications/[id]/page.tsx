"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock3,
  FileText,
  Trash2,
  Save,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Status type used across the UI and API.
 * Keep this in sync with backend allowed values.
 */
type Status = "PROCESSING" | "ACCEPTED" | "REJECTED";

/**
 * Application shape returned by API.
 * If your backend uses snake_case (Django/DRF), keep it consistent here.
 */
type Application = {
  id: number;
  grade_level: string;
  applicant_name: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  activities: string[];
  status: Status;
  image?: string | null;
  document?: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * API base URL:
 * Make sure NEXT_PUBLIC_API_BASE is set in .env.local for production.
 */
const API = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8002";

const gradeOptions = [
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "Grade 13",
];

const activityOptions = ["Sports", "Music", "Art", "Drama", "Robotics", "Chess"];

const statusOptions: { value: Status; label: string }[] = [
  { value: "PROCESSING", label: "Processing" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REJECTED", label: "Rejected" },
];

/**
 * Small pill UI to display the current status with icon and colors.
 */
function StatusPill({ status }: { status: Status }) {
  const base =
    "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium";

  if (status === "ACCEPTED") {
    return (
      <span
        className={`${base} bg-green-100/60 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-200`}
      >
        <CheckCircle2 className="h-3.5 w-3.5" /> Accepted
      </span>
    );
  }

  if (status === "REJECTED") {
    return (
      <span
        className={`${base} bg-red-100/60 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200`}
      >
        <XCircle className="h-3.5 w-3.5" /> Rejected
      </span>
    );
  }

  return (
    <span
      className={`${base} bg-yellow-100/60 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-200`}
    >
      <Clock3 className="h-3.5 w-3.5" /> Processing
    </span>
  );
}

export default function ApplicationDetailsPage() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();

  /**
   * Route param safety:
   * - In Next App Router, params values are strings.
   * - If id is missing/invalid, show a friendly error.
   */
  const id = Number(params?.id);
  const isValidId = Number.isFinite(id) && id > 0;

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // API data
  const [app, setApp] = useState<Application | null>(null);

  // Form state (editable)
  const [gradeLevel, setGradeLevel] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Application["gender"]>("MALE");
  const [activities, setActivities] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("PROCESSING");

  // Upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Small error state to show friendly feedback (optional but useful)
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate local preview for new image file, and cleanup object URL.
   */
  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  /**
   * Fetch one application by ID.
   * Wrapped in useCallback to avoid re-creating the function unnecessarily.
   */
  const fetchOne = useCallback(async () => {
    if (!isValidId) {
      setError("Invalid application id.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axios.get<Application>(`${API}/api/applications/${id}/`);
      const data = res.data;

      // Store API data
      setApp(data);

      // Populate form with API data
      setGradeLevel(data.grade_level);
      setName(data.applicant_name);
      setGender(data.gender);
      setActivities(data.activities || []);
      setStatus(data.status);
    } catch (e) {
      setError("Failed to load application. Please try again.");
      setApp(null);
    } finally {
      setLoading(false);
    }
  }, [id, isValidId]);

  useEffect(() => {
    fetchOne();
  }, [fetchOne]);

  /**
   * Save all changes (multipart form-data for file uploads).
   * If your backend expects activities as array (not stringified), adjust accordingly.
   */
  const saveAll = useCallback(async () => {
    if (!isValidId) return;

    setSaving(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("grade_level", gradeLevel.trim());
      fd.append("applicant_name", name.trim());
      fd.append("gender", gender);
      fd.append("status", status);

      // Backend might accept JSON string for activities (common in Django when multipart)
      fd.append("activities", JSON.stringify(activities));

      if (imageFile) fd.append("image", imageFile);
      if (docFile) fd.append("document", docFile);

      await axios.put(`${API}/api/applications/${id}/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchOne();
    } catch (e) {
      setError("Save failed. Please check inputs and try again.");
    } finally {
      setSaving(false);
    }
  }, [activities, docFile, fetchOne, gender, gradeLevel, id, imageFile, isValidId, name, status]);

  /**
   * Quick status update via PATCH endpoint.
   */
  const changeStatusQuick = useCallback(
    async (s: Status) => {
      if (!isValidId) return;

      setSaving(true);
      setError(null);

      try {
        await axios.patch(`${API}/api/applications/${id}/status/`, { status: s });
        await fetchOne();
      } catch (e) {
        setError("Failed to change status. Please try again.");
      } finally {
        setSaving(false);
      }
    },
    [fetchOne, id, isValidId]
  );

  /**
   * Delete application and navigate away.
   */
  const remove = useCallback(async () => {
    if (!isValidId) return;

    const ok = window.confirm("Delete this application?");
    if (!ok) return;

    try {
      await axios.delete(`${API}/api/applications/${id}/`);
      router.push("/");
    } catch (e) {
      setError("Delete failed. Please try again.");
    }
  }, [id, isValidId, router]);

  // ---------- UI States ----------
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading application…
      </main>
    );
  }

  if (!isValidId) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Invalid application id
      </main>
    );
  }

  if (!app) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p>Application not found</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          Back
        </Button>
      </main>
    );
  }

  // ---------- Main Page ----------
  return (
    <main className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div>
              <h1 className="text-lg font-semibold">Application #{app.id}</h1>
              <p className="text-sm text-muted-foreground">
                Submitted {new Date(app.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusPill status={app.status} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={saving}>
                  Change status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {statusOptions.map((s) => (
                  <DropdownMenuItem
                    key={s.value}
                    onClick={() => changeStatusQuick(s.value)}
                  >
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="destructive"
              size="icon"
              onClick={remove}
              disabled={saving}
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Optional error banner */}
      {error && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <div className="rounded-xl border bg-background px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-8 grid gap-6 lg:grid-cols-2">
        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Applicant</p>
                <p className="font-medium">{app.applicant_name}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Grade</p>
                <p className="font-medium">{app.grade_level}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Gender</p>
                <p className="font-medium">{app.gender}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Activities</p>
                <p className="font-medium">
                  {(app.activities || []).join(", ") || "—"}
                </p>
              </div>
            </div>

            {app.image && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Image</p>
                <img
                  src={app.image}
                  alt="Application image"
                  className="rounded-xl border object-cover max-h-64 w-full"
                />
              </div>
            )}

            {app.document && (
              <a
                href={app.document}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <FileText className="h-4 w-4" /> View document
              </a>
            )}
          </CardContent>
        </Card>

        {/* Edit */}
        <Card>
          <CardHeader>
            <CardTitle>Edit application</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <Label htmlFor="applicant_name">Applicant name</Label>
              <Input
                id="applicant_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter applicant name"
              />
            </div>

            <div>
              <Label>Grade level</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {gradeOptions.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Gender</Label>
              <Select
                value={gender}
                onValueChange={(v) => setGender(v as Application["gender"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Activities</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {activityOptions.map((a) => {
                  const selected = activities.includes(a);

                  return (
                    <Button
                      key={a}
                      size="sm"
                      type="button"
                      variant={selected ? "default" : "outline"}
                      onClick={() =>
                        setActivities((prev) =>
                          prev.includes(a)
                            ? prev.filter((x) => x !== a)
                            : [...prev, a]
                        )
                      }
                    >
                      {a}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Image upload */}
              <div>
                <Label htmlFor="image">Replace image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setImageFile(e.target.files?.[0] ?? null)
                  }
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="New image preview"
                    className="mt-2 rounded-xl border h-32 w-full object-cover"
                  />
                )}
              </div>

              {/* Document upload */}
              <div>
                <Label htmlFor="document">Replace document</Label>
                <Input
                  id="document"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <Button className="w-full" onClick={saveAll} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
