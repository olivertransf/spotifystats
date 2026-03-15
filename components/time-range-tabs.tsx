"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const presets = [
  { value: "30d", label: "30 days" },
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "1y", label: "1 year" },
  { value: "ytd", label: "This year" },
  { value: "all", label: "All time" },
];

export function TimeRangeTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const range = searchParams.get("range") ?? "all";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const isCustom = from && to;

  const current = isCustom ? "all" : range;

  const [customFrom, setCustomFrom] = useState(from || "");
  const [customTo, setCustomTo] = useState(to || "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setCustomFrom(from || "");
    setCustomTo(to || "");
  }, [from, to]);

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("from");
    params.delete("to");
    if (value === "custom") {
      setOpen(true);
      return;
    }
    params.set("range", value);
    router.push(`?${params.toString()}`);
  }

  function applyCustom() {
    if (!customFrom || !customTo) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("range");
    params.set("from", customFrom);
    params.set("to", customTo);
    router.push(`?${params.toString()}`);
    setOpen(false);
  }

  return (
    <div className="flex items-center gap-2">
      <Tabs value={current} onValueChange={onChange}>
        <TabsList className="bg-secondary">
          {presets.map((r) => (
            <TabsTrigger key={r.value} value={r.value} className="text-xs">
              {r.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 text-xs ${isCustom ? "bg-primary/10 text-primary" : ""}`}
          >
            Custom
          </Button>
        </PopoverTrigger>
            <PopoverContent className="w-64 p-4" align="end">
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">From</label>
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">To</label>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="h-8"
                  />
                </div>
                <Button size="sm" onClick={applyCustom} className="w-full">
                  Apply
                </Button>
              </div>
            </PopoverContent>
      </Popover>
    </div>
  );
}
