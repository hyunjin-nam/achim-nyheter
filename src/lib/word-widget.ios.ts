import WordWidget from '@/widgets/word-widget';

import type { WidgetWord } from './widget-words';

const EVERY_MINUTES = 30;
const HOURS_AHEAD = 24;

/**
 * Schedules the words on the iOS widget: a new word every 30 minutes for the next day.
 * iOS shows them on time even while the app is closed; the app refreshes the list whenever it opens.
 */
export function syncWordWidget(words: WidgetWord[]) {
  if (words.length === 0) return;
  const step = EVERY_MINUTES * 60_000;
  const start = Date.now();
  const count = (HOURS_AHEAD * 60) / EVERY_MINUTES;
  try {
    WordWidget.updateTimeline(
      Array.from({ length: count }, (_, i) => ({ date: new Date(start + i * step), props: words[i % words.length] })),
    );
  } catch {
    // The widget extension is missing (e.g. in Expo Go): nothing to update.
  }
}
