import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Lang } from './types';

// Free machine-translation lookup (no key), used only for words the article data has no meaning for.
// Results are kept in memory and saved on the phone, so a word is looked up once and then answers at once.

const KEY = 'lookup.v1';
const MAX_ENTRIES = 5000;

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();
let loaded: Promise<void> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | undefined;

const keyOf = (word: string, from: Lang, to: Lang) => `${from}>${to}:${word.toLowerCase()}`;

/** Reads the saved lookups. Safe to call many times. */
export function preloadLookupCache(): Promise<void> {
  loaded ??= AsyncStorage.getItem(KEY)
    .then((raw) => {
      if (!raw) return;
      for (const [k, v] of Object.entries(JSON.parse(raw) as Record<string, string>)) cache.set(k, v);
    })
    .catch(() => {});
  return loaded;
}

function remember(key: string, value: string) {
  cache.delete(key);
  cache.set(key, value);
  while (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value as string); // oldest first
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    AsyncStorage.setItem(KEY, JSON.stringify(Object.fromEntries(cache))).catch(() => {});
  }, 1500);
}

/** The saved meaning, instantly, or undefined if the word has not been looked up yet. */
export function cachedWord(word: string, from: Lang, to: Lang): string | undefined {
  return cache.get(keyOf(word, from, to));
}

export async function lookupWord(word: string, from: Lang, to: Lang): Promise<string | null> {
  await preloadLookupCache();
  const key = keyOf(word, from, to);
  const hit = cache.get(key);
  if (hit) return hit;
  const pending = inflight.get(key);
  if (pending) return pending;

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${from}|${to}`;
  const p = fetch(url)
    .then((r) => r.json())
    .then((j) => {
      const text: unknown = j?.responseData?.translatedText;
      const value = typeof text === 'string' && text.trim() ? text.trim() : null;
      if (value) remember(key, value);
      return value;
    })
    .catch(() => null) // failures are not remembered, so a later tap can try again
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

/** Looks up many words in the background, a few at a time, skipping the ones already saved. */
export async function prefetchWords(words: string[], from: Lang, to: Lang, concurrency = 4): Promise<void> {
  await preloadLookupCache();
  const todo = [...new Set(words.map((w) => w.toLowerCase()))].filter((w) => !cache.has(keyOf(w, from, to)));
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, todo.length) }, async () => {
      while (next < todo.length) await lookupWord(todo[next++], from, to);
    }),
  );
}
