import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { StoryCard } from '@/components/story-card';
import { MaxWidth, Stroke } from '@/constants/theme';
import { resolveStory } from '@/lib/levels';
import { useNews } from '@/lib/news';
import { syncNotification, useNotificationTap } from '@/lib/notifications';
import { useRead } from '@/lib/read';
import { useSettings } from '@/lib/settings';
import { STR } from '@/lib/strings';
import { usePalette } from '@/lib/use-palette';
import { useVocab } from '@/lib/vocab';
import { widgetWords } from '@/lib/widget-words';
import { syncWordWidget } from '@/lib/word-widget';

function prettyDate(iso: string, locale: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString(locale, { month: 'long', day: 'numeric', weekday: 'long' });
}

export default function Today() {
  const c = usePalette();
  const { settings } = useSettings();
  const { days } = useNews();
  const { width } = useWindowDimensions();
  const [dayIndex, setDayIndex] = useState(0);
  // index === stories.length means "all read" (the end card).
  const [index, setIndex] = useState(0);
  const { markRead, readUrls } = useRead();
  const { ready } = useSettings();
  const pan = useRef(new Animated.Value(0)).current;
  const lang = settings.learning;
  const t = STR[lang];

  // Daily notifications carry real stories, so refresh them when the news or the settings change.
  useEffect(() => {
    if (ready) syncNotification(settings, days, readUrls).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, days, readUrls.length, settings.notify, settings.hour, settings.learning, settings.level]);

  // The home / lock screen widget (iOS) rotates words from saved words and today's stories.
  const { words: savedWords } = useVocab();
  useEffect(() => {
    syncWordWidget(widgetWords(days, savedWords, lang, settings.level));
  }, [days, savedWords, lang, settings.level]);

  // A tapped notification opens its story. The story may only arrive with the live news, so wait for it.
  const [openUrl, setOpenUrl] = useState<string | null>(null);
  useNotificationTap(setOpenUrl);
  useEffect(() => {
    if (!openUrl) return;
    for (const [d, dd] of days.entries()) {
      const i = dd.stories.findIndex((s) => s.url === openUrl);
      if (i >= 0) {
        pan.setValue(0);
        setDayIndex(d);
        setIndex(i);
        setOpenUrl(null);
        if (router.canDismiss()) router.dismissAll(); // close settings or word list if one is open
        return;
      }
    }
  }, [openUrl, days, pan]);

  const day = days[Math.min(dayIndex, days.length - 1)];
  const stories = day.stories;
  const finished = index >= stories.length;
  // The swipe handler is created once per width, so it reads the live card through refs.
  const live = useRef({ index, stories });
  live.current = { index, stories };
  const current = stories[Math.min(index, stories.length - 1)];

  const jump = (i: number) => {
    pan.setValue(0);
    setIndex(Math.max(0, Math.min(i, stories.length)));
  };

  // Which card waits underneath while dragging: the next one (drag left) or the previous one (drag right).
  const [peek, setPeek] = useState<'next' | 'prev'>('next');
  const peekRef = useRef<'next' | 'prev'>('next');
  const showPeek = (p: 'next' | 'prev') => {
    if (peekRef.current === p) return;
    peekRef.current = p;
    setPeek(p);
  };

  /** Throws the top card off screen. Left = on to the next story, right = back to the previous one. */
  const fling = (dir: 1 | -1) => {
    const { index: i, stories: list } = live.current;
    const forward = dir === -1;
    if (forward && list[i]) markRead(list[i].url);
    showPeek(forward ? 'next' : 'prev');
    Animated.timing(pan, { toValue: dir * width * 1.3, duration: 220, useNativeDriver: false }).start(() => {
      setIndex((cur) => (forward ? Math.min(cur + 1, list.length) : Math.max(cur - 1, 0)));
      pan.setValue(0);
      showPeek('next');
    });
  };

  /** Can the card be dragged this way? (not back from the first story, not on past the end card) */
  const canGo = (dx: number) => {
    const { index: i, stories: list } = live.current;
    return dx > 0 ? i > 0 : i < list.length;
  };

  const springBack = () => {
    Animated.spring(pan, { toValue: 0, useNativeDriver: false }).start(() => showPeek('next'));
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        // Capture clear horizontal drags, so a card's own vertical scrolling and word taps keep working.
        onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderMove: (_, g) => {
          if (g.dx !== 0) showPeek(g.dx > 0 ? 'prev' : 'next');
          pan.setValue(canGo(g.dx) ? g.dx : g.dx / 4); // resist when there is nothing in that direction
        },
        onPanResponderRelease: (_, g) => {
          const far = Math.abs(g.dx) > width * 0.22 || Math.abs(g.vx) > 0.8;
          if (far && canGo(g.dx)) fling(g.dx > 0 ? 1 : -1);
          else springBack();
        },
        onPanResponderTerminate: springBack,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [width, stories.length],
  );

  const changeDay = (d: number) => {
    if (d < 0 || d >= days.length) return;
    pan.setValue(0);
    setDayIndex(d);
    setIndex(0);
  };

  const older = dayIndex < days.length - 1;
  const newer = dayIndex > 0;

  // The top card scrolls itself so that an opened word meaning is always in view.
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const viewHeight = useRef(0);

  const renderCard = (i: number) => (
    <ScrollView
      ref={i === index ? scrollRef : undefined}
      onLayout={(e) => {
        if (i === index) viewHeight.current = e.nativeEvent.layout.height;
      }}
      style={[styles.cardScroll, framed]}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}>
      <StoryCard
        story={resolveStory(stories[i], settings.level)}
        lang={lang}
        translation={settings.showTranslation ? settings.native : null}
        onReveal={(bottom) => {
          if (i === index) scrollRef.current?.scrollTo({ y: Math.max(0, bottom - viewHeight.current + 28), animated: true });
        }}
        style={{ flexGrow: 1, borderWidth: 0 }}
      />
    </ScrollView>
  );

  const behindIndex = peek === 'prev' ? index - 1 : index + 1;
  const pill = { backgroundColor: c.card, borderColor: c.outline };
  const framed = { borderColor: c.outline };

  const rotate = pan.interpolate({ inputRange: [-width, 0, width], outputRange: ['-9deg', '0deg', '9deg'] });
  const behindScale = pan.interpolate({
    inputRange: [-width, 0, width],
    outputRange: [1, 0.94, 1],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={styles.center}>
        <View style={styles.header}>
          {/* Today: only the logo. An older day also shows its date. */}
          <Image source={require('../../assets/images/splash-icon.png')} style={styles.logo} accessibilityLabel="Achim Nyheter" />
          <View style={styles.titleBlock}>
            {dayIndex > 0 && (
              <>
                <Text style={[styles.kicker, { color: c.muted }]}>{t.archive}</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.date, { color: c.text }]}>
                  {prettyDate(day.date, t.locale)}
                </Text>
              </>
            )}
          </View>
          <View style={styles.actions}>
            <Pressable onPress={() => router.push('/archive')} hitSlop={8} style={[styles.pill, pill]}>
              <Text style={[styles.pillText, { color: c.text }]}>{t.archiveBtn}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/vocab')} hitSlop={8} style={[styles.pill, pill]}>
              <Text style={[styles.pillText, { color: c.text }]}>{t.vocab}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/settings')} hitSlop={8} style={[styles.pill, pill]}>
              <Text style={[styles.pillText, { color: c.text }]}>···</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Card stack: the next card waits underneath; the top one follows the finger. */}
      <View style={styles.stackWrap}>
        <View style={styles.stack}>
          {/* The card underneath: the next story, or the previous one while dragging right. */}
          {behindIndex >= 0 && behindIndex < stories.length && (
            <Animated.View
              key={`${day.date}-${behindIndex}`}
              pointerEvents="none"
              style={[styles.card, { transform: [{ scale: behindScale }] }]}>
              {renderCard(behindIndex)}
            </Animated.View>
          )}
          <Animated.View
            key={`${day.date}-${index}`}
            {...responder.panHandlers}
            style={[styles.card, { transform: [{ translateX: pan }, { rotate }] }]}>
            {finished ? (
              <View style={[styles.endCard, framed, { backgroundColor: c.card }]}>
                <Text style={[styles.endTitle, { color: c.text }]}>{t.done}</Text>
                <Pressable onPress={() => jump(0)} style={[styles.endBtn, { backgroundColor: c.sun, borderColor: c.onSun }]}>
                  <Text style={{ color: c.onSun, fontWeight: '700' }}>{t.again}</Text>
                </Pressable>
                {older && (
                  <Pressable onPress={() => changeDay(dayIndex + 1)} style={[styles.endBtn, pill]}>
                    <Text style={{ color: c.text, fontWeight: '700' }}>{t.olderDay}</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              renderCard(index)
            )}
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center' },
  header: {
    width: '100%',
    maxWidth: MaxWidth,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  logo: { width: 48, height: 48, marginRight: 10, alignSelf: 'center' },
  titleBlock: { flexShrink: 1, minWidth: 0, paddingRight: 8, marginRight: 'auto' },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  date: { fontSize: 32, fontWeight: '800', letterSpacing: -1.2 },
  actions: { flexDirection: 'row', gap: 8, alignSelf: 'center' },
  pill: { height: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: Stroke, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontSize: 15, fontWeight: '700' },
  stackWrap: { flex: 1, alignItems: 'center' },
  stack: { flex: 1, width: '100%', maxWidth: MaxWidth, paddingHorizontal: 16 },
  card: {
    ...StyleSheet.absoluteFill,
    marginHorizontal: 16,
    marginBottom: 20,
    userSelect: 'none',
    borderRadius: 28,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardScroll: { flex: 1, borderRadius: 28, overflow: 'hidden', borderWidth: Stroke },
  endCard: { flex: 1, borderRadius: 28, borderWidth: Stroke, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  endTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.8, textAlign: 'center', marginBottom: 8 },
  endBtn: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14, borderWidth: Stroke },
});
