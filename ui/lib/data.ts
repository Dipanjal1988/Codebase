"use client";
import { useEffect, useState } from "react";
import type { LineageData } from "./types";

export function useLineageData() {
  const [data, setData] = useState<LineageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch("/lineage.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);
  return { data, error };
}
