import {
  Timestamp,
  GeoPoint,
  DocumentReference,
} from 'firebase-admin/firestore';

function isObject(val: any): val is Record<string, any> {
  return val !== null && typeof val === 'object';
}

export function serializeFirebaseData(data: any): any {
  // 1. Primitive values, null, and undefined
  if (data === null || typeof data !== 'object') {
    return data;
  }

  // 2. Firestore Timestamp
  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }

  // 3. Standard JS Date
  if (data instanceof Date) {
    return data.toISOString();
  }

  // 4. Firestore GeoPoint
  if (data instanceof GeoPoint) {
    return { latitude: data.latitude, longitude: data.longitude };
  }

  // 5. Firestore DocumentReference
  if (data instanceof DocumentReference) {
    return data.path;
  }

  // 6. Arrays (recursively process each element)
  if (Array.isArray(data)) {
    return data.map((item) => serializeFirebaseData(item));
  }

  // 7. Plain Objects & Nested Documents
  if (isObject(data)) {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        serializeFirebaseData(value),
      ]),
    );
  }

  return data;
}
