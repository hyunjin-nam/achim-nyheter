import type { WidgetWord } from './widget-words';

/** The word widget exists only on iOS (see word-widget.ios.ts); elsewhere this does nothing. */
export function syncWordWidget(_words: WidgetWord[]) {}
