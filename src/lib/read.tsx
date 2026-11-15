import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const KEY = 'read.v1';

type Ctx = {
  /** URLs of the articles that have been read, newest first. */
  readUrls: string[];
  markRead: (url: string) => void;
};
const ReadContext = createContext<Ctx | null>(null);

export function ReadProvider({ children }: { children: ReactNode }) {
  const [readUrls, setReadUrls] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setReadUrls(JSON.parse(raw)))
      .catch(() => {});
  }, []);

  const markRead = useCallback((url: string) => {
    setReadUrls((prev) => {
      if (prev.includes(url)) return prev;
      const next = [url, ...prev];
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(() => ({ readUrls, markRead }), [readUrls, markRead]);
  return <ReadContext.Provider value={value}>{children}</ReadContext.Provider>;
}

export function useRead() {
  const ctx = useContext(ReadContext);
  if (!ctx) throw new Error('useRead must be used inside ReadProvider');
  return ctx;
}
