import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { Fonts, MaxWidth } from '@/constants/theme';
import { LANG_NAME, LANGS, type Lang } from '@/lib/types';
import { usePalette } from '@/lib/use-palette';
import { useVocab } from '@/lib/vocab';

export default function Vocab() {
  const c = usePalette();
  const { words, remove } = useVocab();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.column}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.text, fontFamily: Fonts.serif }]}>단어장</Text>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={[styles.done, { color: c.kr }]}>완료</Text>
            </Pressable>
          </View>

          {words.length === 0 && (
            <Text style={{ color: c.muted, fontSize: 15, lineHeight: 22 }}>
              아직 저장한 단어가 없어요. 뉴스에서 단어를 누르고 "단어장에 추가"를 눌러 보세요.
            </Text>
          )}

          {words.map((w) => {
            const meaningLangs = (["en", ...LANGS] as Lang[]).filter(
              (l, i, a) => l !== w.lang && a.indexOf(l) === i && w.entry[l],
            );
            return (
              <View key={w.id} style={[styles.card, { backgroundColor: c.card, borderColor: c.line }]}>
                <View style={styles.cardHead}>
                  <Text style={[styles.word, { color: c.text }]}>{w.entry.base ?? w.word}</Text>
                  <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600' }}>{LANG_NAME[w.lang]}</Text>
                  <Pressable onPress={() => remove(w.id)} hitSlop={10} style={{ marginLeft: 'auto' }}>
                    <Text style={{ color: c.muted, fontSize: 14 }}>삭제</Text>
                  </Pressable>
                </View>
                {meaningLangs.length === 0 && <Text style={{ color: c.muted, fontSize: 14 }}>뜻 정보가 없어요.</Text>}
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
  title: { fontSize: 32, fontWeight: '700' },
  done: { fontSize: 17, fontWeight: '600' },
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 8 },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  word: { fontSize: 20, fontWeight: '700' },
  meaningRow: { flexDirection: 'row', gap: 10 },
  meaningLang: { width: 64, fontSize: 12, fontWeight: '600', paddingTop: 2 },
  meaning: { flex: 1, fontSize: 15, lineHeight: 22 },
});
