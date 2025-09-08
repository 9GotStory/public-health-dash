import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Lightweight fetch with exponential backoff retries
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retries = 2,
  delay = 500
): Promise<Response> {
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(url, init);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return resp;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await sleep(delay * Math.pow(2, attempt));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Network error");
}
