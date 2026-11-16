import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { resolveStory } from './levels';
import { STR } from './strings';
import { COUNTRIES, type Country, type Day, type Settings, type Story } from './types';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Calls `onTap` with the story URL of a tapped notification: one tapped while the app runs, or the one
 * that launched it. The launch tap is cleared once handled, so reopening the app later does not jump again.
 */
export function useNotificationTap(onTap: (url: string) => void) {
  const latest = useRef(onTap);
  latest.current = onTap;
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const handle = (r: Notifications.NotificationResponse | null) => {
      if (!r || r.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
      const url = r.notification.request.content.data?.url;
      if (typeof url === 'string') latest.current(url);
    };
    Notifications.getLastNotificationResponseAsync()
      .then((r) => {
        handle(r);
        if (r) return Notifications.clearLastNotificationResponseAsync();
      })
      .catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      handle(r);
      Notifications.clearLastNotificationResponseAsync().catch(() => {});
    });
    return () => sub.remove();
  }, []);
}

/** Shown only when there are no stories at all. */
const FALLBACK = {
  ko: { title: '오늘의 뉴스', body: '새 뉴스가 도착했어요.' },
  sv: { title: 'Dagens nyheter', body: 'Nya nyheter väntar.' },
  en: { title: "Today's news", body: 'New stories are waiting.' },
} as const;

const DAYS_AHEAD = 7;

/** Stories to announce: unread first, newest day first, taking Korea / Sweden / Global in turn. */
function queue(days: Day[], readUrls: string[]): Story[] {
  const all = days.flatMap((d) => d.stories);
  const unread = all.filter((s) => !readUrls.includes(s.url));
  const pool = unread.length ? unread : all;
  const lanes = COUNTRIES.map((c: Country) => pool.filter((s) => s.country === c));
  const out: Story[] = [];
  for (let i = 0; out.length < pool.length; i++) {
    for (const lane of lanes) if (lane[i]) out.push(lane[i]);
  }
  return out;
}

/** The first paragraph, cut at a sentence end (or a space) so it fits in a notification. */
function blurb(text: string, max = 200): string {
  const first = text.split(/\n+/)[0].trim();
  if (first.length <= max) return first;
  const cut = first.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('。'), cut.lastIndexOf('요. '));
  return end > max * 0.5 ? cut.slice(0, end + 1) : cut.slice(0, cut.lastIndexOf(' ')) + '…';
}

/**
 * Replaces the scheduled notifications: one per day for the next week, each carrying a real story.
 * Called whenever the news or the settings change, so the stories stay fresh.
 * Returns false if notifications are not allowed.
 */
export async function syncNotification(settings: Settings, days: Day[], readUrls: string[]): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!settings.notify) return true;

  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted;
  if (!granted) granted = (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return false;

  const lang = settings.learning;
  const stories = queue(days, readUrls).slice(0, DAYS_AHEAD);

  if (stories.length === 0) {
    await Notifications.scheduleNotificationAsync({
      content: FALLBACK[lang],
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: settings.hour, minute: 0 },
    });
    return true;
  }

  // First notification: today at the chosen hour, or tomorrow if that time has passed.
  const first = new Date();
  first.setHours(settings.hour, 0, 0, 0);
  if (first.getTime() < Date.now() + 60_000) first.setDate(first.getDate() + 1);

  for (const [i, story] of stories.entries()) {
    const when = new Date(first);
    when.setDate(first.getDate() + i);
    const shown = resolveStory(story, settings.level);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: shown.title[lang],
        subtitle: STR[lang][story.country],
        body: blurb(shown.summary[lang]),
        data: { url: story.url },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
    });
  }
  return true;
}
