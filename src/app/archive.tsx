import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { StoryCard } from '@/components/story-card';
import { Fonts, MaxWidth } from '@/constants/theme';
import { resolveStory } from '@/lib/levels';
import { useNews } from '@/lib/news';
import { useRead } from '@/lib/read';
import { useSettings } from '@/lib/settings';
import { STR } from '@/lib/strings';
import { usePalette } from '@/lib/use-palette';

function prettyDate(iso: string, locale: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString(locale, { month: 'long', day: 'numeric', weekday: 'long' });
}

/** Every story, grouped by day (read ones are ticked), newest day first. Tap an article to read it again. */
export default function Archive() {
  const c = usePalette();
  const { settings } = useSettings();
  const { days } = useNews();
  const { readUrls } = useRead();
  const [open, setOpen] = useState<string | null>(null);
  const lang = settings.learning;
  const t = STR[lang];

  const groups = useMemo(
    () =>
      days.map((d) => ({ date: d.date, stories: d.stories })).filter((g) => g.stories.length > 0),
    [days, readUrls],
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.column}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.text, fontFamily: Fonts.serif }]}>{t.archiveTitle}</Text>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={[styles.done, { color: c.kr }]}>✕</Text>
            </Pressable>
          </View>

          {groups.length === 0 && <Text style={{ color: c.muted, fontSize: 15, lineHeight: 22 }}>{t.readEmpty}</Text>}

          {groups.map((g) => (
            <View key={g.date} style={{ gap: 10 }}>
              <Text style={[styles.day, { color: c.muted }]}>{prettyDate(g.date, t.locale)}</Text>
              {g.stories.map((s) => {
                const isOpen = open === s.url;
                const story = resolveStory(s, settings.level);
                const dot = s.country === 'KR' ? c.kr : s.country === 'SE' ? c.se : c.gl;
                return isOpen ? (
                  <View key={s.url} style={{ gap: 8 }}>
                    <StoryCard
                      story={story}
                      lang={lang}
                      translation={settings.showTranslation ? settings.native : null}
                    />
                    <Pressable onPress={() => setOpen(null)} style={{ alignSelf: 'center', padding: 6 }}>
                      <Text style={{ color: c.muted, fontWeight: '600' }}>{t.fold}</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    key={s.url}
                    onPress={() => setOpen(s.url)}
                    style={[styles.row, { backgroundColor: c.card, borderColor: c.line }]}>
                    <View style={[styles.dot, { backgroundColor: dot }]} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                        {t[s.country].toUpperCase()}
                        {readUrls.includes(s.url) ? '  ✓' : ''}
                      </Text>
                      <Text style={{ color: c.text, fontSize: 16, lineHeight: 22, fontWeight: '600' }} numberOfLines={2}>
                        {story.title[lang]}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { alignItems: 'center', paddingBottom: 48 },
  column: { width: '100%', maxWidth: MaxWidth, paddingHorizontal: 20, paddingTop: 16, gap: 22 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '700' },
  done: { fontSize: 20, fontWeight: '600' },
  day: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
