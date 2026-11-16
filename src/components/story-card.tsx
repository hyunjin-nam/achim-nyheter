import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { Fragment, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text as RNText, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { Text } from '@/components/text';
import { STR } from '@/lib/strings';
import { cachedWord, lookupWord, prefetchWords } from '@/lib/lookup';
import { type Lang, type Story, type Unit, type WordEntry } from '@/lib/types';
import { Stroke } from '@/constants/theme';
import { useSettings } from '@/lib/settings';
import { usePalette } from '@/lib/use-palette';
import { useVocab } from '@/lib/vocab';

const WORD = /(\p{L}[\p{L}\p{M}'’-]*)/u;
const wordKey = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{M}'’-]/gu, '');

/** Where a tapped word sits: which sentence of the title or body (null for data without sentences). */
type Spot = { part: 'title' | 'body'; index: number };

/** One piece of text whose words can be tapped. */
function Words({
  text,
  spot,
  active,
  onWord,
}: {
  text: string;
  spot: Spot;
  active: { key: string; spot: Spot } | null;
  onWord: (word: string, spot: Spot) => void;
}) {
  const c = usePalette();
  const here = active && active.spot.part === spot.part && active.spot.index === spot.index ? active.key : null;
  return (
    <>
      {text.split(WORD).map((part, i) =>
        i % 2 === 1 ? (
          // Plain RN Text so the word keeps the font and weight of the paragraph around it.
          <RNText
            key={i}
            onPress={() => onWord(part, spot)}
            style={here === wordKey(part) ? { backgroundColor: c.sun, color: c.onSun, borderRadius: 4 } : undefined}>
            {part}
          </RNText>
        ) : (
          part
        ),
      )}
    </>
  );
}

type Props = {
  story: Story;
  lang: Lang;
  /** If set (and different from lang), the same story is shown below in this language. */
  translation?: Lang | null;
  style?: StyleProp<ViewStyle>;
  /** Called with the y position of the bottom of the meaning box when it opens, so the screen can scroll to it. */
  onReveal?: (bottom: number) => void;
};

export function StoryCard({ story, lang, translation, style, onReveal }: Props) {
  const c = usePalette();
  const { has, toggle } = useVocab();
  const { settings } = useSettings();
  const [tapped, setTapped] = useState<{ word: string; key: string; spot: Spot } | null>(null);
  const t = STR[lang];
  const accent = story.country === 'KR' ? c.kr : story.country === 'SE' ? c.se : c.gl;
  // The Translate button shows English; otherwise the optional translation from settings.
  const [showEn, setShowEn] = useState(false);
  const canTranslate = lang !== 'en' && translation !== 'en';
  const trLang: Lang | null = showEn && canTranslate ? 'en' : translation ?? null;
  const showTr = trLang && trLang !== lang;

  // The text split into sentences, each with its translation and the meaning of its words in that sentence.
  const units = story.units?.[lang];
  const unitOf = (spot: Spot): Unit | undefined => (spot.part === 'title' ? units?.title : units?.body[spot.index]);

  const word = tapped?.word ?? null;
  const key = tapped?.key ?? null;
  const unit = tapped ? unitOf(tapped.spot) : undefined;
  // Meaning for this sentence; older data only has a story-wide glossary.
  const entry: WordEntry | undefined = key ? unit?.words[key] ?? story.glossary?.[lang]?.[key] : undefined;
  const saved = word ? has(lang, word) : false;

  // Without a meaning in the data, fall back to a plain word lookup. undefined = loading, null = not found.
  const fallbackLang: Lang = lang === 'en' ? 'ko' : 'en';
  const [fetched, setFetched] = useState<Record<string, string | null>>({});
  const fkey = `${lang}:${key}`;
  useEffect(() => {
    if (!word || !key || entry?.[fallbackLang] || entry?.en) return;
    let cancelled = false;
    lookupWord(word, lang, fallbackLang).then((m) => {
      if (!cancelled) setFetched((p) => ({ ...p, [`${lang}:${key}`]: m }));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, lang, tapped?.spot.part, tapped?.spot.index]);

  // Saved lookups answer instantly, so a word that was looked up before never waits.
  const meaning: string | null | undefined =
    entry?.[fallbackLang] ?? entry?.en ?? (word ? cachedWord(word, lang, fallbackLang) : undefined) ?? fetched[fkey];

  // As soon as the card is shown, look up in the background every word the data has no meaning for.
  // (English text is left to the tap, to stay within the free service's daily limit.)
  useEffect(() => {
    if (lang === 'en') return;
    const texts = units
      ? [units.title, ...units.body].map((u) => ({ text: u.text, known: u.words }))
      : [{ text: story.title[lang] }, { text: story.summary[lang] }].map((x) => ({ ...x, known: undefined as Record<string, WordEntry> | undefined }));
    const missing: string[] = [];
    for (const { text, known } of texts) {
      for (const part of text.split(WORD).filter((_, i) => i % 2 === 1)) {
        const k = wordKey(part);
        if (k && !known?.[k] && !story.glossary?.[lang]?.[k]) missing.push(part);
      }
    }
    if (missing.length) prefetchWords(missing.slice(0, 200), lang, fallbackLang).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story.url, story.level, lang]);

  const tap = (w: string, spot: Spot) => {
    const k = wordKey(w);
    setTapped((prev) => (prev && prev.key === k && prev.spot.part === spot.part && prev.spot.index === spot.index ? null : { word: w, key: k, spot }));
  };

  const active = tapped ? { key: tapped.key, spot: tapped.spot } : null;
  // Long compound words (Swedish!) must not break in the middle, so a long word makes the title smaller.
  const longest = Math.max(...(units ? units.title.text : story.title[lang]).split(' ').map((w) => w.length));
  const titleSize = longest > 18 ? 25 : longest > 15 ? 28 : 32;
  const titleStyle: TextStyle = { ...styles.title, fontSize: titleSize, lineHeight: Math.round(titleSize * 1.3), color: c.text };
  const bodyStyle: TextStyle = { ...styles.body, color: c.text };

  const popup = word ? (
        <View
      style={[styles.popup, { backgroundColor: c.soft, borderColor: c.outline }]}
      onLayout={(e) => onReveal?.(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}>
          <View style={styles.popupHead}>
            <Text style={[styles.popupWord, { color: c.text }]}>{entry?.base ?? word}</Text>
            {entry?.base && entry.base.toLowerCase() !== key && (
              <Text style={{ color: c.muted, fontSize: 13 }}>← {word}</Text>
            )}
            {entry?.level && (
              <View style={[styles.wordLevel, { backgroundColor: c.sun, borderColor: c.onSun }]}>
                <Text style={{ color: c.onSun, fontSize: 12, fontWeight: '800' }}>{entry.level}</Text>
              </View>
            )}
            <Pressable onPress={() => setTapped(null)} hitSlop={10} style={{ marginLeft: 'auto' }}>
              <Text style={{ color: c.muted, fontSize: 16 }}>✕</Text>
            </Pressable>
          </View>
          <Text style={[styles.meaning, { color: meaning ? c.text : c.muted }]}>
            {meaning ?? (meaning === null ? t.noMeaning : '…')}
          </Text>
          {/* The whole sentence in English, so the word is understood in its context. */}
          {settings.showSentence && unit?.en ? (
            <View style={[styles.context, { borderTopColor: c.line }]}>
              <Text style={[styles.contextText, { color: c.muted }]}>“{unit.en}”</Text>
            </View>
          ) : null}
          {/* Grammar of the tapped word itself. Older data only has a note for the whole sentence. */}
          {settings.showGrammar && (entry?.grammar || unit?.grammar) ? (
            <View style={[styles.context, { borderTopColor: c.line }]}>
              <Text style={[styles.grammarLabel, { color: c.muted }]}>{entry?.grammar ? t.grammar : t.sentenceGrammar}</Text>
              <Text style={[styles.grammarText, { color: c.text }]}>{entry?.grammar ?? unit?.grammar}</Text>
            </View>
          ) : null}
          <View style={styles.popupActions}>
            <Pressable
              onPress={() =>
                word &&
                toggle(lang, word, {
                  base: entry?.base,
                  level: entry?.level,
                  [fallbackLang]: meaning ?? undefined,
                  example: unit?.text,
                })
              }
              style={[styles.saveBtn, saved ? { backgroundColor: c.card, borderColor: c.outline } : { backgroundColor: c.sun, borderColor: c.onSun }]}>
              <Text style={{ color: saved ? c.text : c.onSun, fontSize: 15, fontWeight: '700' }}>
                {saved ? t.saved : t.save}
              </Text>
            </Pressable>
          </View>
        </View>
  ) : null;

  // The body as paragraphs of sentences (a sentence with `br` starts a new paragraph).
  const paragraphs = units
    ? units.body.reduce<{ u: Unit; i: number }[][]>((acc, u, i) => {
        if (i === 0 || u.br) acc.push([]);
        acc[acc.length - 1].push({ u, i });
        return acc;
      }, [])
    : null;

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.line }, style]}>
      {story.image && <Image source={{ uri: story.image }} style={[styles.photo, { backgroundColor: c.chip, borderBottomColor: c.outline }]} contentFit="cover" />}

      <View style={styles.tag}>
        <View style={[styles.dot, { backgroundColor: accent, borderColor: c.onSun }]} />
        <Text style={[styles.tagText, { color: c.muted }]}>
          {t[story.country].toUpperCase()}
        </Text>
        {story.level && (
          <View style={[styles.level, { backgroundColor: c.sun, borderColor: c.onSun }]}>
            <Text style={[styles.levelText, { color: c.onSun }]}>
              {story.level} · {t.level[story.level]}
            </Text>
          </View>
        )}
      </View>

      <Text style={titleStyle}>
        <Words text={units ? units.title.text : story.title[lang]} spot={{ part: 'title', index: 0 }} active={active} onWord={tap} />
      </Text>
      {tapped?.spot.part === 'title' && popup}

      {/* The meaning opens right under the paragraph that was tapped, not at the end of the article. */}
      {paragraphs ? (
        paragraphs.map((para, p) => (
          <Fragment key={p}>
            <Text style={bodyStyle}>
              {para.map(({ u, i }, k) => (
                <Fragment key={i}>
                  {k > 0 ? ' ' : ''}
                  <Words text={u.text} spot={{ part: 'body', index: i }} active={active} onWord={tap} />
                </Fragment>
              ))}
            </Text>
            {tapped?.spot.part === 'body' && para.some(({ i }) => i === tapped.spot.index) && popup}
          </Fragment>
        ))
      ) : (
        <>
          <Text style={bodyStyle}>
            <Words text={story.summary[lang]} spot={{ part: 'body', index: 0 }} active={active} onWord={tap} />
          </Text>
          {tapped?.spot.part === 'body' && popup}
        </>
      )}

      {canTranslate && (
        <Pressable
          onPress={() => setShowEn((v) => !v)}
          hitSlop={8}
          style={[styles.translateBtn, showEn ? { backgroundColor: c.sun, borderColor: c.onSun } : { backgroundColor: c.card, borderColor: c.outline }]}>
          <Text style={{ color: showEn ? c.onSun : c.text, fontSize: 15, fontWeight: '700' }}>
            {showEn ? 'Hide translation' : 'Translate'}
          </Text>
        </Pressable>
      )}

      {showTr && (
        <View style={[styles.tr, { borderTopColor: c.line }]}>
          <Text style={[styles.trTitle, { color: c.muted }]}>{story.title[trLang]}</Text>
          <Text style={[styles.trBody, { color: c.muted }]}>{story.summary[trLang]}</Text>
        </View>
      )}

      <Pressable
        onPress={() => WebBrowser.openBrowserAsync(story.url)}
        hitSlop={8}
        style={[styles.sourceRow, { borderTopColor: c.line }]}>
        <Text style={[styles.sourceLabel, { color: c.muted }]}>{story.source}</Text>
        <Text style={[styles.source, { color: c.text }]}>{t.read} ↗</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 28, padding: 24, gap: 14 },
  // Edge to edge at the top of the card (cancels the card padding).
  photo: { alignSelf: 'stretch', aspectRatio: 16 / 10, marginHorizontal: -24, marginTop: -24, marginBottom: 4, borderBottomWidth: Stroke },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5 },
  tagText: { fontSize: 14, fontWeight: '700', letterSpacing: 1.6 },
  title: { fontSize: 32, lineHeight: 42, fontWeight: '800', letterSpacing: -1 },
  body: { fontSize: 20, lineHeight: 33 },
  popup: { borderRadius: 18, padding: 14, gap: 8, borderWidth: Stroke },
  translateBtn: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: Stroke },
  level: { marginLeft: 'auto', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, borderWidth: Stroke },
  levelText: { fontSize: 15, fontWeight: '700' },
  context: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, marginTop: 2 },
  contextText: { fontSize: 16, lineHeight: 24, fontStyle: 'italic' },
  grammarLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  grammarText: { fontSize: 15, lineHeight: 22 },
  wordLevel: { paddingHorizontal: 8, paddingVertical: 1, borderRadius: 8, borderWidth: 1.5 },
  popupActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: Stroke },
  popupHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  popupWord: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  meaningRow: { flexDirection: 'row', gap: 10 },
  meaningLang: { width: 72, fontSize: 14, fontWeight: '600', paddingTop: 2 },
  meaning: { flex: 1, fontSize: 18, lineHeight: 26 },
  tr: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, gap: 6 },
  trTitle: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
  trBody: { fontSize: 17, lineHeight: 27 },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
    marginTop: 'auto', // pinned to the bottom of the card
  },
  sourceLabel: { fontSize: 15, fontWeight: '500' },
  source: { fontSize: 16, fontWeight: '700' },
});
