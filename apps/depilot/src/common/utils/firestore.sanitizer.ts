/**
 * Sanitizer utility to ensure objects and event payloads comply with Firestore constraints.
 * Firestore forbids nested arrays (arrays containing arrays).
 */

export function sanitizeForFirestore<T>(val: T): T {
  if (val === null || val === undefined) return val;
  if (typeof val === "function") return undefined as unknown as T;
  if (typeof val !== "object") return val;

  if (Array.isArray(val)) {
    const mapped = val.map((item) => {
      if (Array.isArray(item)) {
        // If it is a coordinate pair [lng, lat], convert to object
        if (item.length === 2 && typeof item[0] === "number" && typeof item[1] === "number") {
          return { lng: item[0], lat: item[1] };
        }
        // If it is a deeper nested array, JSON stringify it
        return JSON.stringify(sanitizeForFirestore(item));
      }
      return sanitizeForFirestore(item);
    });

    return mapped as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(val)) {
    const sanitized = sanitizeForFirestore(v);
    if (sanitized !== undefined) {
      result[key] = sanitized;
    }
  }
  return result as T;
}
