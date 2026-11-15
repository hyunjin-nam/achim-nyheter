import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { usePalette } from '@/lib/use-palette';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
};

export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  const c = usePalette();
  return (
    <View style={[styles.wrap, { backgroundColor: c.chip }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.item, active && { backgroundColor: c.card }]}>
            <Text style={[styles.label, { color: active ? c.text : c.muted }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: 14, padding: 3 },
  item: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 11 },
  label: { fontSize: 14, fontWeight: '600' },
});
