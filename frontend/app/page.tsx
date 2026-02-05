"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";

import { useTheme } from "next-themes";
import {
  Moon,
  Sun,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Clock3,
  RefreshCcw,
  FileText,
  Image as ImageIcon,
  SlidersHorizontal,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type Status = "PROCESSING" | "ACCEPTED" | "REJECTED";

type Application = {
  id: number;
  grade_level: string;
  applicant_name: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  activities: string[];
  status: Status | string;
  image?: string | null;
  document?: string | null;
  created_at: string;
  updated_at: string;
};

const API = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8002";
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || "";

const baseAxios = axios.create({
  baseURL: API,
  withCredentials: true,
});

baseAxios.interceptors.request.use((config) => {
  if (ADMIN_KEY) {
    config.headers = config.headers || {};
    config.headers["X-ADMIN-KEY"] = ADMIN_KEY;
  }
  return config;
});

function normalizeStatus(s: any): Status {
  const v = (s ?? "").toString().trim().toUpperCase();
  if (v === "PROCESSING") return "PROCESSING";
  if (v === "ACCEPTED") return "ACCEPTED";
  if (v === "REJECTED") return "REJECTED";

  if (v === "PENDING" || v === "IN_REVIEW") return "PROCESSING";
  if (v === "APPROVED") return "ACCEPTED";
  if (v === "DECLINED" || v === "DENIED") return "REJECTED";

  return "PROCESSING";
}

function fileUrl(path?: string | null) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API}${path}`;
}

const statusOptions: { value: Status; label: string }[] = [
  { value: "PROCESSING", label: "Processing" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REJECTED", label: "Rejected" },
];

function StatusPill({ status }: { status: Status }) {
  const base =
    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium";

  if (status === "ACCEPTED") {
    return (
      <span className={`${base} bg-green-100/60 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-200 dark:border-green-900`}>
        <CheckCircle2 className="h-3.5 w-3.5" />
        Accepted
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span className={`${base} bg-red-100/60 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900`}>
        <XCircle className="h-3.5 w-3.5" />
        Rejected
      </span>
    );
  }
  return (
    <span className={`${base} bg-yellow-100/60 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-200 dark:border-yellow-900`}>
      <Clock3 className="h-3.5 w-3.5" />
      Processing
    </span>
  );
}

function SkeletonLine({ w = "w-40" }: { w?: string }) {
  return <div className={`h-3 rounded bg-muted ${w}`} />;
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-full bg-muted" />
        <div className="min-w-0 space-y-2">
          <div className="h-4 w-44 rounded bg-muted" />
          <div className="flex gap-2">
            <SkeletonLine w="w-20" />
            <SkeletonLine w="w-16" />
            <SkeletonLine w="w-28" />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-20 rounded bg-muted" />
        <div className="h-8 w-24 rounded bg-muted" />
        <div className="h-8 w-20 rounded bg-muted" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { theme, setTheme } = useTheme();

  const [items, setItems] = useState<Application[]>([]);
  const [summary, setSummary] = useState<Record<Status, number>>({
    PROCESSING: 0,
    ACCEPTED: 0,
    REJECTED: 0,
  });

  const [listLoading, setListLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "ALL">("ALL");

  const summaryFromList = useMemo(() => {
    return items.reduce(
      (acc, a) => {
        const s = normalizeStatus(a.status);
        acc[s] += 1;
        return acc;
      },
      { PROCESSING: 0, ACCEPTED: 0, REJECTED: 0 } as Record<Status, number>
    );
  }, [items]);

  const total = items.length || 0;
  const percent = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  const cards = [
    { key: "PROCESSING" as const, title: "Processing", icon: Clock3, hint: "In review" },
    { key: "ACCEPTED" as const, title: "Accepted", icon: CheckCircle2, hint: "Approved" },
    { key: "REJECTED" as const, title: "Rejected", icon: XCircle, hint: "Not approved" },
  ];

  async function fetchAll() {
    setListLoading(true);
    try {
      const listRes = await baseAxios.get(`/api/applications/`);
      const list: Application[] = Array.isArray(listRes.data) ? listRes.data : [];
      const normalized = list.map((a) => ({ ...a, status: normalizeStatus(a.status) }));
      setItems(normalized);

      try {
        const sumRes = await baseAxios.get(`/api/applications/summary/`);
        const data = sumRes.data || {};
        setSummary({
          PROCESSING: Number(data.PROCESSING || 0),
          ACCEPTED: Number(data.ACCEPTED || 0),
          REJECTED: Number(data.REJECTED || 0),
        });
      } catch {
        setSummary(summaryFromList);
      }
    } catch (e: any) {
      console.error("Fetch error:", e?.response?.status, e?.response?.data || e);
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const hasItems = items.length > 0;
    const sumIsZero = summary.PROCESSING === 0 && summary.ACCEPTED === 0 && summary.REJECTED === 0;
    if (hasItems && sumIsZero) setSummary(summaryFromList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((a) => {
      const matchesQuery = !q || a.applicant_name.toLowerCase().includes(q);
      const matchesStatus = filterStatus === "ALL" ? true : normalizeStatus(a.status) === filterStatus;
      return matchesQuery && matchesStatus;
    });
  }, [items, query, filterStatus]);

  async function remove(id: number) {
    if (!confirm("Delete this application?")) return;
    try {
      await baseAxios.delete(`/api/applications/${id}/`);
      await fetchAll();
    } catch (e: any) {
      alert(e?.response?.status === 403 ? "Admin access required." : "Delete failed.");
    }
  }

  async function changeStatus(id: number, s: Status) {
    try {
      await baseAxios.patch(`/api/applications/${id}/status/`, { status: s });
      await fetchAll();
    } catch (e: any) {
      alert(e?.response?.status === 403 ? "Admin access required." : "Status update failed.");
    }
  }

  async function refresh() {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }

  return (
    <main className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight truncate">Admissions</h1>
            <p className="text-sm text-muted-foreground">Modern admin dashboard</p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href="/new">
                <Plus className="h-4 w-4 mr-2" />
                New
              </Link>
            </Button>

            <Button variant="outline" size="icon" onClick={refresh} aria-label="Refresh">
              <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((c) => {
            const Icon = c.icon;
            const value = summary[c.key];
            const active = filterStatus === c.key;

            return (
              <button
                key={c.key}
                onClick={() => setFilterStatus((prev) => (prev === c.key ? "ALL" : c.key))}
                className="text-left"
              >
                <Card
                  className={[
                    "shadow-sm transition-all hover:shadow-md",
                    active ? "ring-2 ring-primary" : "",
                  ].join(" ")}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm text-muted-foreground">{c.title}</CardTitle>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-semibold">{value}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {c.hint} • {percent(value)}%
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{active ? "Filtered" : "Click"}</div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <Card className="shadow-sm mt-6">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CardTitle>Submissions</CardTitle>
                <span className="text-xs text-muted-foreground rounded-full border px-2 py-1">
                  {filteredItems.length} shown
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                  <SelectTrigger className="w-[180px]">
                    <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by applicant name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {(query || filterStatus !== "ALL") && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Active filters:</span>
                {query && (
                  <Button variant="secondary" size="sm" onClick={() => setQuery("")}>
                    Clear search ✕
                  </Button>
                )}
                {filterStatus !== "ALL" && (
                  <Button variant="secondary" size="sm" onClick={() => setFilterStatus("ALL")}>
                    Clear status ✕
                  </Button>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-3">
            {listLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="rounded-xl border bg-background p-8 text-center">
                <p className="text-lg font-semibold">No submissions found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try clearing filters or create a new application.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <Button variant="secondary" onClick={() => { setQuery(""); setFilterStatus("ALL"); }}>
                    Clear filters
                  </Button>
                  <Button asChild>
                    <Link href="/new">
                      <Plus className="h-4 w-4 mr-2" />
                      New Application
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              filteredItems.map((a) => {
                const img = fileUrl(a.image);
                const doc = fileUrl(a.document);
                const s = normalizeStatus(a.status);

                return (
                  <div
                    key={a.id}
                    className="rounded-xl border bg-card p-4 flex items-center justify-between gap-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                        {a.applicant_name?.[0]?.toUpperCase() || "A"}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/applications/${a.id}`}
                            className="font-medium truncate underline-offset-4 hover:underline"
                          >
                            {a.applicant_name}
                          </Link>
                          <StatusPill status={s} />
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span>{a.grade_level}</span>
                          <span>•</span>
                          <span>{a.gender}</span>
                          <span>•</span>
                          <span className="truncate max-w-[520px]">
                            {(a.activities || []).join(", ") || "—"}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-3">
                          {img && (
                            <a
                              href={img}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                            >
                              <ImageIcon className="h-4 w-4" /> Image
                            </a>
                          )}
                          {doc && (
                            <a
                              href={doc}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                            >
                              <FileText className="h-4 w-4" /> Document
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Status
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {statusOptions.map((opt) => (
                            <DropdownMenuItem key={opt.value} onClick={() => changeStatus(a.id, opt.value)}>
                              {opt.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button asChild size="sm" variant="outline">
                        <Link href={`/applications/${a.id}`}>View</Link>
                      </Button>

                      <Button size="sm" variant="destructive" onClick={() => remove(a.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

