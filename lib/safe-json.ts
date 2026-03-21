/**
 * Parse JSON from a fetch Response. Returns null if the body is HTML, empty, or not valid JSON.
 */
export async function safeJson<T = unknown>(res: Response): Promise<T | null> {
  const text = await res.text();
  const t = text.trim();
  if (!t || t.startsWith("<")) {
    return null;
  }
  if (!t.startsWith("{") && !t.startsWith("[")) {
    return null;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
