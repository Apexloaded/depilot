export function toDate(value: unknown) {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    return value.toDate();
  }

  return value;
}

export function convertTimestamps(obj: any): any {
  if (!obj) return obj;
  if (typeof obj.toDate === 'function') {
    return obj.toDate();
  }
  if (Array.isArray(obj)) {
    return obj.map(convertTimestamps);
  }
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key of Object.keys(obj)) {
      converted[key] = convertTimestamps(obj[key]);
    }
    return converted;
  }
  return obj;
};