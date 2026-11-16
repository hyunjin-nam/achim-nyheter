import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { MaxWidth, Stroke } from '@/constants/theme';
import { useSettings } from '@/lib/settings';
import { STR } from '@/lib/strings';
import { LANG_NAME, LANGS, type Lang } from '@/lib/types';
import { usePalette } from '@/lib/use-palette';
import { useVocab } from '@/lib/vocab';

export default function Vocab() {
  const c = usePalette();
  const { words, remove } = useVocab();
  const { settings } = useSettings();
  const t = STR[settings.learning];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.column}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.text }]}>{t.vocab}</Text>
            <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.done, { backgroundColor: c.sun, borderColor: c.onSun }]}>
              <Text style={[styles.doneText, { color: c.onSun }]}>{t.close}</Text>
            </Pressable>
          </View>

          {words.length === 0 && <Text style={{ color: c.muted, fontSize: 15, lineHeight: 22 }}>{t.vocabEmpty}</Text>}

          {words.map((w) => {
            const meaningLangs = (['en', ...LANGS] as Lang[]).filter(
              (l, i, a) => l !== w.lang && a.indexOf(l) === i && w.entry[l],
            );
            return (
              <View key={w.id} style={[styles.card, { backgroundColor: c.card, borderColor: c.outline }]}>
                <View style={styles.cardHead}>
                  <Text style={[styles.word, { color: c.text }]}>{w.entry.base ?? w.word}</Text>
                  {w.entry.level && (
                    <View style={[styles.badge, { backgroundColor: c.sun, borderColor: c.onSun }]}>
                      <Text style={{ color: c.onSun, fontSize: 11, fontWeight: '800' }}>{w.entry.level}</Text>
                    </View>
                  )}
                  <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600' }}>{LANG_NAME[w.lang]}</Text>
                  <Pressable onPress={() => remove(w.id)} hitSlop={10} style={{ marginLeft: 'auto' }}>
                    <Text style={{ color: c.muted, fontSize: 14, fontWeight: '600' }}>{t.remove}</Text>
                  </Pressable>
                </View>
                {meaningLangs.length === 0 && <Text style={{ color: c.muted, fontSize: 14 }}>{t.noSavedMeaning}</Text>}
                {meaningLangs.map((l) => (
                  <View key={l} style={styles.meaningRow}>
                    <Text style={[styles.meaningLang, { color: c.muted }]}>{LANG_NAME[l]}</Text>
                    <Text style={[styles.meaning, { color: c.text }]}>{w.entry[l]}</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { alignItems: 'center', paddingBottom: 48 },
  column: { width: '100%', maxWidth: MaxWidth, paddingHorizontal: 20, paddingTop: 16, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1.2 },
  done: { paddingHorizontal: 16, height: 40, borderRadius: 20, borderWidth: Stroke, justifyContent: 'center' },
  doneText: { fontSize: 15, fontWeight: '700' },
  card: { borderRadius: 18, borderWidth: Stroke, padding: 16, gap: 8 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  word: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  badge: { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 7, borderWidth: 1.5 },
  meaningRow: { flexDirection: 'row', gap: 10 },
  meaningLang: { width: 64, fontSize: 12, fontWeight: '600', paddingTop: 2 },
  meaning: { flex: 1, fontSize: 15, lineHeight: 22 },
});
