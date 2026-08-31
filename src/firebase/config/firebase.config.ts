import 'dotenv/config';
import { cert, initializeApp } from 'firebase-admin/app';
import {
  FieldValue,
  getFirestore,
  type Firestore,
} from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    'Firebase configuration requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY',
  );
}

const firebaseApp = initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

const firestore: Firestore = getFirestore(firebaseApp);
firestore.settings({ ignoreUndefinedProperties: true });

export { firestore, firebaseApp };
export { FieldValue };
