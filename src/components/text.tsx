import { StyleSheet, Text as RNText, type TextProps } from 'react-native';

/** Pretendard has one font file per weight, so the weight in a style picks the file. */
function familyFor(weight: string | number | undefined) {
  const w = weight === 'bold' ? 700 : weight === 'normal' || weight == null ? 400 : Number(weight);
  if (w >= 700) return 'Pretendard-Bold';
  if (w >= 600) return 'Pretendard-SemiBold';
  if (w >= 500) return 'Pretendard-Medium';
  return 'Pretendard-Regular';
}

/** Drop-in replacement for react-native's Text that uses the app font. */
export function Text({ style, ...rest }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  if (flat.fontFamily) return <RNText style={style} {...rest} />;
  return <RNText style={[style, { fontFamily: familyFor(flat.fontWeight), fontWeight: 'normal' }]} {...rest} />;
}
