import { resolveStory } from './levels';
import { LANG_NAME, type Day, type Lang, type Level } from './types';
import type { SavedWord } from './vocab';

/** One word for the home / lock screen widget (same shape as the widget's props). */
export type WidgetWord = { word: string; base?: string; meaning: string; level?: string; language: string };

const MAX_WORDS = 48;
const ORDER: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/**
 * Words to rotate on the widget, in the main language with English meanings:
 * saved words first, then words from today's stories that are worth learning (A2 and up, not too hard
 * for the chosen level), one of each dictionary form.
 */
export function widgetWords(days: Day[], saved: SavedWord[], lang: Lang, level: Level): WidgetWord[] {
  const out: WidgetWord[] = [];
  const seen = new Set<string>();
  const add = (w: WidgetWord) => {
    const k = (w.base || w.word).toLowerCase();
    if (!w.meaning || seen.has(k) || out.length >= MAX_WORDS) return;
    seen.add(k);
    out.push(w);
  };

  for (const s of saved) {
    if (s.lang !== lang) continue;
    const meaning = s.entry.en ?? s.entry.ko ?? s.entry.sv;
    if (meaning) add({ word: s.word, base: s.entry.base, meaning, level: s.entry.level, language: LANG_NAME[lang] });
  }

  // Up to two levels above the reader's level: new words, but not out of reach.
  const max = Math.min(ORDER.length - 1, ORDER.indexOf(level) + 2);
  for (const story of days[0]?.stories ?? []) {
    const units = resolveStory(story, level).units?.[lang];
    if (!units) continue;
    for (const unit of [units.title, ...units.body]) {
      for (const [word, e] of Object.entries(unit.words)) {
        const l = e.level ? ORDER.indexOf(e.level) : -1;
        if (l < 1 || l > max || !e.en) continue; // skip A1 basics and words without a level
        add({ word, base: e.base, meaning: e.en, level: e.level, language: LANG_NAME[lang] });
      }
    }
  }
  return out;
}
