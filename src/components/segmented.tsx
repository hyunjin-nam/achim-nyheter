import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { Stroke } from '@/constants/theme';
import { usePalette } from '@/lib/use-palette';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
};

export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  const c = usePalette();
  return (
    <View style={[styles.wrap, { backgroundColor: c.card, borderColor: c.outline }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.item, active && { backgroundColor: c.sun, borderColor: c.onSun }]}>
            <Text style={[styles.label, { color: active ? c.onSun : c.muted }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: 16, padding: 4, borderWidth: Stroke, gap: 4 },
  item: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 11, borderWidth: Stroke, borderColor: 'transparent' },
  label: { fontSize: 15, fontWeight: '700' },
});
