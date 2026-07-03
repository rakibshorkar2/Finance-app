import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  writeBatch 
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { Account, IncomeSource, DeductionSettings, Expense } from '../types';

// Web App Firebase Configuration from firebase-applet-config.json
const firebaseConfig = {
  projectId: "stalwart-smoke-d4dh4",
  appId: "1:96131615250:web:240b48af0ee80cfe3a26cb",
  apiKey: "AIzaSyBdUom2IKwsh8K0SNR08sLSk-YbpKpZp5Y",
  authDomain: "stalwart-smoke-d4dh4.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-yearlysalaryexpe-e3f2c9f8-1bc5-4a9c-b9d3-c7bee4ac477c",
  storageBucket: "stalwart-smoke-d4dh4.firebasestorage.app",
  messagingSenderId: "96131615250"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { onAuthStateChanged, signOut };
export type { User };

export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export interface BudgetVaultState {
  vaultId: string;
  accounts: Account[];
  salarySources: IncomeSource[];
  deductions: DeductionSettings;
  expenses: Expense[];
  homeInflows: { id: string; amount: number; description: string; date: string }[];
  updatedAt: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively removes undefined fields from an object or array to make it safe for Firestore.
 */
function removeUndefined(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item));
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          cleaned[key] = removeUndefined(val);
        }
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * Saves the entire vault state to Firestore under vaults/{vaultId}
 */
export async function saveVaultToCloud(state: BudgetVaultState): Promise<void> {
  const { vaultId, ...data } = state;
  const path = `vaults/${vaultId}`;
  try {
    const sanitizedData = removeUndefined(data);
    const vaultRef = doc(db, 'vaults', vaultId);
    await setDoc(vaultRef, {
      ...sanitizedData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Loads the vault state from Firestore under vaults/{vaultId}
 */
export async function loadVaultFromCloud(vaultId: string): Promise<BudgetVaultState | null> {
  const path = `vaults/${vaultId}`;
  try {
    const vaultRef = doc(db, 'vaults', vaultId);
    const snap = await getDoc(vaultRef);
    if (snap.exists()) {
      const data = snap.data() as Omit<BudgetVaultState, 'vaultId'>;
      return {
        vaultId,
        ...data
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}
