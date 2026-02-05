"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";


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

type Status = "PROCESSING" | "ACCEPTED" | "REJECTED";

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

export default function NewApplicationPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [gradeLevel, setGradeLevel] = useState("Grade 10");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [activities, setActivities] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("PROCESSING");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  

  useEffect(() => {
    if (!imageFile) return setImagePreview(null);
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  async function submit() {
    if (!name.trim()) {
      alert("Applicant name is required.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("grade_level", gradeLevel);
      fd.append("applicant_name", name);
      fd.append("gender", gender);
      fd.append("status", status);
      fd.append("activities", JSON.stringify(activities));
      if (imageFile) fd.append("image", imageFile);
      if (docFile) fd.append("document", docFile);

      await axios.post(`${API}/api/applications/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      router.push("/");
    } catch (e: any) {
      alert(e?.response?.data ? JSON.stringify(e.response.data) : "Submit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6">
          <Link href="/" className="text-sm underline text-muted-foreground">
            ← Back to dashboard
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight mt-2">
            New Application
          </h1>
          <p className="text-muted-foreground">
            Submit a new admission application.
          </p>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Grade level</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger>
                  <SelectValue />
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

            <div className="space-y-2">
              <Label>Applicant name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={(v: any) => setGender(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Activities</Label>
              <div className="flex flex-wrap gap-2">
                {activityOptions.map((a) => {
                  const active = activities.includes(a);
                  return (
                    <Button
                      key={a}
                      type="button"
                      variant={active ? "default" : "outline"}
                      size="sm"
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

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Image</Label>
                <Input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    className="h-40 w-full rounded-md object-cover"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Document</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={submit} disabled={loading}>
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
              <Button variant="outline" onClick={() => router.push("/")}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
