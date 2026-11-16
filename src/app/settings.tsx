import { router } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { Segmented } from '@/components/segmented';
import { MaxWidth, Stroke } from '@/constants/theme';
import { useSettings } from '@/lib/settings';
import { STR } from '@/lib/strings';
import { CHOOSABLE_LEVELS, LANG_NAME, LANGS } from '@/lib/types';
import { usePalette } from '@/lib/use-palette';

const HOURS = [7, 8, 9, 12, 18, 20, 21];

export default function Settings() {
  const c = usePalette();
  const { settings, update } = useSettings();
  // The settings screen is always in English, whatever the main language is.
  const t = STR.en;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={{ gap: 10 }}>
      <Text style={[styles.section, { color: c.muted }]}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );

  /** One on/off row, outlined like the logo, with a switch in the logo's orange. */
  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <View style={[styles.row, { backgroundColor: c.card, borderColor: c.outline }]}>
      <Text style={[styles.rowText, { color: c.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: c.wave, false: c.chip }}
        thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
        ios_backgroundColor={c.chip}
        // react-native-web paints the "on" knob green unless told otherwise (not in RN's types).
        {...(Platform.OS === 'web' ? ({ activeThumbColor: '#FFFFFF' } as object) : {})}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.column}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.text }]}>{t.settings}</Text>
            <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.done, { backgroundColor: c.sun, borderColor: c.onSun }]}>
              <Text style={[styles.doneText, { color: c.onSun }]}>{t.close}</Text>
            </Pressable>
          </View>

          <Section title={t.mainLanguage}>
            <Segmented
              value={settings.learning}
              onChange={(learning) => update({ learning })}
              options={LANGS.map((l) => ({ value: l, label: LANG_NAME[l] }))}
            />
            <Text style={[styles.help, { color: c.muted }]}>{t.mainLanguageHelp}</Text>
          </Section>

          <Section title={t.difficulty}>
            <Segmented
              value={settings.level}
              onChange={(level) => update({ level })}
              options={CHOOSABLE_LEVELS.map((l) => ({ value: l, label: l }))}
            />
            <Text style={{ color: c.text, fontSize: 16, lineHeight: 23 }}>{t.levelHelp[settings.level]}</Text>
            <Text style={[styles.help, { color: c.muted }]}>{t.levelNote}</Text>
          </Section>

          <Section title={t.translation}>
            <Toggle label={t.showTranslation} value={settings.showTranslation} onChange={(showTranslation) => update({ showTranslation })} />
            {settings.showTranslation && (
              <Segmented
                value={settings.native}
                onChange={(native) => update({ native })}
                options={LANGS.map((l) => ({ value: l, label: LANG_NAME[l] }))}
              />
            )}
          </Section>

          <Section title={t.whenTapping}>
            <Toggle label={t.showSentence} value={settings.showSentence} onChange={(showSentence) => update({ showSentence })} />
            <Toggle label={t.showGrammar} value={settings.showGrammar} onChange={(showGrammar) => update({ showGrammar })} />
            <Text style={[styles.help, { color: c.muted }]}>{t.grammarNote}</Text>
          </Section>

          <Section title={t.reminder}>
            <Toggle label={t.dailyReminder} value={settings.notify} onChange={(notify) => update({ notify })} />
            {settings.notify && (
              <View style={styles.hours}>
                {HOURS.map((h) => {
                  const active = h === settings.hour;
                  return (
                    <Pressable
                      key={h}
                      onPress={() => update({ hour: h })}
                      style={[
                        styles.hour,
                        active ? { backgroundColor: c.sun, borderColor: c.onSun } : { backgroundColor: c.card, borderColor: c.outline },
                      ]}>
                      <Text style={{ color: active ? c.onSun : c.text, fontWeight: '700' }}>{String(h).padStart(2, '0')}:00</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {Platform.OS === 'web' && <Text style={[styles.help, { color: c.muted }]}>{t.reminderWebOnly}</Text>}
          </Section>

          <Text style={[styles.help, { color: c.muted, lineHeight: 19 }]}>{t.perPhone}</Text>
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
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1.2 },
  done: { paddingHorizontal: 16, height: 40, borderRadius: 20, borderWidth: Stroke, justifyContent: 'center' },
  doneText: { fontSize: 15, fontWeight: '700' },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 1.4 },
  help: { fontSize: 13 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: Stroke,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowText: { fontSize: 16, fontWeight: '600', flexShrink: 1, paddingRight: 12 },
  hours: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hour: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: Stroke },
});
