export const Colors = {
  light: {
    bg: '#F4F4F6',
    card: '#FFFFFF',
    text: '#111113',
    muted: '#8A8A91',
    line: '#E6E6EA',
    chip: '#ECECF0',
    kr: '#3B6EF5',
    se: '#E0A100',
    gl: '#1F9D7A',
    onAccent: '#FFFFFF',
  },
  dark: {
    bg: '#0D0D0F',
    card: '#1B1B1F',
    text: '#F4F2EE',
    muted: '#8E8B85',
    line: '#2A2A2F',
    chip: '#26262B',
    kr: '#6F93FF',
    se: '#F2BC2B',
    gl: '#4CC9A0',
    onAccent: '#101012',
  },
} as const;

export type Palette = Record<keyof (typeof Colors)["light"], string>;

// The app font (Pretendard) is applied by components/text.tsx, which picks the file by font weight.
export const Fonts = { serif: undefined as string | undefined, sans: undefined as string | undefined };

// Phone-sized column; on a wide browser the app stays a centered phone-width column.
export const MaxWidth = 480;
