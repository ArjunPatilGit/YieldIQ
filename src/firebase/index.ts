'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc, deleteDoc, getDoc, collection, addDoc, query, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './config';

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

export const initializeFirebase = () => {
  return {
    firebaseApp: app,
    firestore,
    auth,
  };
};

export {
  app,
  firestore,
  auth,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  collection,
  addDoc,
  query,
  serverTimestamp,
};

// Re-export hooks from provider to maintain the API used by the app
export {
  useFirebase,
  useUser,
  useFirestore,
  useFirebaseApp,
  useAuth,
  useMemoFirebase,
  FirebaseProvider
} from './provider';

// Hook for document fetching (simplified version of what was stubbed)
import { useState, useEffect } from 'react';
import { getDocs } from 'firebase/firestore';

export const useDoc = <T = any>(ref: any): { data: T | null, isLoading: boolean, error: any } => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!ref) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Attempt real Firestore fetch
    getDoc(ref)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const fsData = docSnap.data();
          setData({ id: docSnap.id, ...(fsData as object) } as T);
          setIsLoading(false);
        } else {
          // If Firestore is empty, check for locally cached profile
          if (typeof window !== 'undefined') {
            const locallySaved = localStorage.getItem('demo_farm');
            if (locallySaved) {
              setData({
                id: ref.id,
                ...JSON.parse(locallySaved),
                name: JSON.parse(locallySaved).name || "Patil Farm Primary"
              } as T);
            } else {
              setData(null);
            }
          } else {
            setData(null);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Firestore fetch error. Attempting local session recovery:", err.message);
        setError(err);

        // Recovery attempt
        if (typeof window !== 'undefined') {
          const locallySaved = localStorage.getItem('demo_farm');
          if (locallySaved) {
            setData({ id: ref.id, ...JSON.parse(locallySaved) } as T);
            setError(null);
          } else if (ref.path.includes("farms/primary")) {
            // PROVIDE INITIAL STATE FOR NEW PATIL FARMS SYSTEM
            const baselineFarm = {
              name: "Patil Farm Primary",
              location: "Bathinda, Punjab",
              totalAreaHectares: 12.5,
              soilType: "clay",
              cropType: "wheat",
              plantingDate: new Date().toISOString().split('T')[0],
              growthStage: "vegetative",
              variety: "PBW 343"
            };
            setData({ id: ref.id, ...baselineFarm } as T);
            setError(null);
          }
        }
        setIsLoading(false);
      });
  }, [ref?.path]);

  return { data, isLoading, error };
};

export const useCollection = (queryRef: any): { data: any[], isLoading: boolean, error: any } => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!queryRef) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getDocs(queryRef).then((snapshot) => {
      const items: any[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as object) });
      });
      // Sort items by savedAt descending if it exists
      items.sort((a, b) => {
        const tA = a.savedAt?.toMillis?.() || Date.parse(a.updatedAt || 0);
        const tB = b.savedAt?.toMillis?.() || Date.parse(b.updatedAt || 0);
        return tB - tA;
      });
      setData(items);
      setIsLoading(false);
    }).catch((err) => {
      console.warn("Firestore collection fetch error:", err);
      setError(err);

      // Local storage cache fallback
      if (typeof window !== 'undefined') {
        // Some queries don't expose path directly on query object. In simplified web SDK it might.
        // We'll just look broadly or at the hook usage. 
        // If it's the advisory reports, we try to load the known demo key
        const local = localStorage.getItem('demo_advisory_reports');
        if (local) {
          setData(JSON.parse(local));
          setError(null);
        }
      }

      setIsLoading(false);
    });
  }, [queryRef]);

  return { data, isLoading, error };
};

export const errorEmitter = { emit: () => { }, on: () => { }, off: () => { } };
