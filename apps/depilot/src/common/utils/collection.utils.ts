export function sanitizeDocId(val: string): string {
  return encodeURIComponent(val).replace(/\./g, '%2E').replace(/\//g, '%2F');
}
