'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; 
  isLoading: boolean;       
  error: FirestoreError | Error | null; 
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // REAL-TIME FIRESTORE SUBSCRIPTION
    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setData({ id: docSnap.id, ...docSnap.data() } as WithId<T>);
        } else {
          // If Firestore is empty, check for local recovery data
          if (typeof window !== 'undefined') {
            try {
              const locallySaved = localStorage.getItem('demo_farm');
              if (locallySaved) {
                const parsed = JSON.parse(locallySaved);
                setData({ 
                  id: memoizedDocRef.id, 
                  ...parsed,
                  name: parsed.name || "Patil Farm Primary"
                } as WithId<T>);
              } else {
                setData(null);
              }
            } catch (e) {
              setData(null);
            }
          } else {
            setData(null);
          }
        }
        setIsLoading(false);
      },
      (err) => {
        console.warn("Firestore access error, attempting local state recovery:", err);
        setError(err);
        
        // Final fallback to local state if Firestore fails (e.g. offline)
        if (typeof window !== 'undefined') {
          try {
            const locallySaved = localStorage.getItem('demo_farm');
            if (locallySaved) {
              setData({ id: memoizedDocRef.id, ...JSON.parse(locallySaved) } as WithId<T>);
            }
          } catch (e) {}
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedDocRef?.path]); 

  return { data, isLoading, error };
}