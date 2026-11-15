import { useEffect, useState } from 'react';

import sample from '@/data/sample-news.json';
import type { Day, Glossary } from './types';

/** Glossary keys are words without punctuation, as the text is split in the card. */
function cleanGlossary(g?: Glossary): Glossary | undefined {
  if (!g) return g;
  const out: Glossary = {};
  for (const lang of Object.keys(g) as (keyof Glossary)[]) {
    out[lang] = {};
    for (const [word, entry] of Object.entries(g[lang] ?? {})) {
      const key = word.toLowerCase().replace(/[^p{L}p{M}'’-]/gu, '');
      if (key && entry) out[lang]![key] = entry;
    }
  }
  return out;
}

/** Some outlets set their logo as the article image. A card without a photo is better than a logo. */
const GENERIC_IMAGE = /logo|default|noimage|placeholder|sprite|og[-_]?image/i;

function clean(days: Day[]): Day[] {
  return days.map((d) => ({
    ...d,
    stories: d.stories.map((s) => ({
      ...s,
      image: s.image && !GENERIC_IMAGE.test(s.image) ? s.image : undefined,
      glossary: cleanGlossary(s.glossary),
      versions: s.versions && Object.fromEntries(Object.entries(s.versions).map(([k, v]) => [k, { ...v, glossary: cleanGlossary(v.glossary) }])),
    })),
  }));
}

// Where the daily job publishes news.json (e.g. GitHub Pages). Without it the bundled sample is shown.
const NEWS_URL = process.env.EXPO_PUBLIC_NEWS_URL;

export function useNews() {
  const [days, setDays] = useState<Day[]>(clean(sample.days as unknown as Day[]));
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!NEWS_URL) return;
    let cancelled = false;
    fetch(NEWS_URL)
      .then((r) => r.json())
      .then((json: { days: Day[] }) => {
        if (!cancelled && json.days?.length) {
          setDays(clean(json.days));
          setLive(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return { days, live };
}
