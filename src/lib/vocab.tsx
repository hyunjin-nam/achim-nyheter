import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { Lang, WordEntry } from './types';

const KEY = 'vocab.v1';

export type SavedWord = {
  id: string; // `${lang}:${word}`
  lang: Lang;
  word: string; // as it appeared in the text
  entry: WordEntry;
  savedAt: number;
};

type Ctx = {
  words: SavedWord[];
  has: (lang: Lang, word: string) => boolean;
  toggle: (lang: Lang, word: string, entry: WordEntry) => void;
  remove: (id: string) => void;
};
const VocabContext = createContext<Ctx | null>(null);

const idOf = (lang: Lang, word: string) => `${lang}:${word.toLowerCase()}`;

export function VocabProvider({ children }: { children: ReactNode }) {
  const [words, setWords] = useState<SavedWord[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setWords(JSON.parse(raw)))
      .catch(() => {});
  }, []);

  const commit = useCallback((fn: (prev: SavedWord[]) => SavedWord[]) => {
    setWords((prev) => {
      const next = fn(prev);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const has = useCallback((lang: Lang, word: string) => words.some((w) => w.id === idOf(lang, word)), [words]);

  const toggle = useCallback(
    (lang: Lang, word: string, entry: WordEntry) =>
      commit((prev) => {
        const id = idOf(lang, word);
        return prev.some((w) => w.id === id)
          ? prev.filter((w) => w.id !== id)
          : [{ id, lang, word, entry, savedAt: Date.now() }, ...prev];
      }),
    [commit],
  );

  const remove = useCallback((id: string) => commit((prev) => prev.filter((w) => w.id !== id)), [commit]);

  const value = useMemo(() => ({ words, has, toggle, remove }), [words, has, toggle, remove]);
  return <VocabContext.Provider value={value}>{children}</VocabContext.Provider>;
}

export function useVocab() {
  const ctx = useContext(VocabContext);
  if (!ctx) throw new Error('useVocab must be used inside VocabProvider');
  return ctx;
}
