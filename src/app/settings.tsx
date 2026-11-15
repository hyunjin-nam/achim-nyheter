import { router } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { Segmented } from '@/components/segmented';
import { Fonts, MaxWidth } from '@/constants/theme';
import { useSettings } from '@/lib/settings';
import { CHOOSABLE_LEVELS, LANG_NAME, LANGS, type Level } from '@/lib/types';
import { usePalette } from '@/lib/use-palette';

const HOURS = [7, 8, 9, 12, 18, 20, 21];
const LEVEL_HELP: Record<Level, string> = {
  A1: 'A1 · 매우 쉬움 — 아주 짧은 문장, 가장 기본적인 단어',
  A2: 'A2 · 쉬움 — 짧고 쉬운 문장, 자주 쓰는 단어',
  B1: 'B1 · 보통 — 자연스러운 뉴스 문장',
  B2: 'B2 · 중상급',
  C1: 'C1 · 어려움 — 풍부한 어휘와 긴 문장',
  C2: 'C2 · 최상급',
};

export default function Settings() {
  const c = usePalette();
  const { settings, update } = useSettings();

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={{ gap: 10 }}>
      <Text style={[styles.section, { color: c.muted }]}>{title}</Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.column}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.text, fontFamily: Fonts.serif }]}>설정</Text>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={[styles.done, { color: c.kr }]}>완료</Text>
            </Pressable>
          </View>

          <Section title="메인 언어 · MAIN LANGUAGE">
            <Segmented
              value={settings.learning}
              onChange={(learning) => update({ learning })}
              options={LANGS.map((l) => ({ value: l, label: LANG_NAME[l] }))}
            />
            <Text style={{ color: c.muted, fontSize: 13 }}>뉴스를 이 언어로만 보여줘요.</Text>
          </Section>

          <Section title="난이도 · DIFFICULTY">
            <Segmented
              value={settings.level}
              onChange={(level) => update({ level })}
              options={CHOOSABLE_LEVELS.map((l) => ({ value: l, label: l }))}
            />
            <Text style={{ color: c.text, fontSize: 16, lineHeight: 23 }}>{LEVEL_HELP[settings.level]}</Text>
            <Text style={{ color: c.muted, fontSize: 13 }}>
              기사마다 준비된 난이도가 달라서, 고른 난이도가 없으면 가장 가까운 버전을 보여줘요.
            </Text>
          </Section>

          <Section title="번역 · TRANSLATION">
            <View style={[styles.row, { backgroundColor: c.card, borderColor: c.line }]}>
              <Text style={[styles.rowText, { color: c.text }]}>번역도 함께 보기</Text>
              <Switch value={settings.showTranslation} onValueChange={(showTranslation) => update({ showTranslation })} />
            </View>
            {settings.showTranslation && (
              <Segmented
                value={settings.native}
                onChange={(native) => update({ native })}
                options={LANGS.map((l) => ({ value: l, label: LANG_NAME[l] }))}
              />
            )}
          </Section>

          <Section title="알림 · DAILY REMINDER">
            <View style={[styles.row, { backgroundColor: c.card, borderColor: c.line }]}>
              <Text style={[styles.rowText, { color: c.text }]}>매일 알림 받기</Text>
              <Switch value={settings.notify} onValueChange={(notify) => update({ notify })} />
            </View>
            {settings.notify && (
              <View style={styles.hours}>
                {HOURS.map((h) => {
                  const active = h === settings.hour;
                  return (
                    <Pressable
                      key={h}
                      onPress={() => update({ hour: h })}
                      style={[styles.hour, { backgroundColor: active ? c.text : c.chip }]}>
                      <Text style={{ color: active ? c.bg : c.text, fontWeight: '600' }}>
                        {String(h).padStart(2, '0')}:00
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {Platform.OS === 'web' && (
              <Text style={{ color: c.muted, fontSize: 13 }}>알림은 iPhone 앱에서만 동작해요.</Text>
            )}
          </Section>

          <Text style={{ color: c.muted, fontSize: 13, lineHeight: 19 }}>
            각자 폰에서 설정하면 돼요. 야곱은 메인 언어를 한국어로 바꿔 보세요.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { alignItems: 'center', paddingBottom: 48 },
  column: { width: '100%', maxWidth: MaxWidth, paddingHorizontal: 20, paddingTop: 16, gap: 28 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '700' },
  done: { fontSize: 17, fontWeight: '600' },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 1.4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowText: { fontSize: 16 },
  hours: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hour: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
});
