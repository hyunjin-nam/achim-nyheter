// Colours follow the "Sunny" logo: a yellow tile, a white sun, an orange wave and dark outlines.
export const Colors = {
  light: {
    bg: '#F4F4F6',
    card: '#FFFFFF',
    text: '#111113',
    muted: '#6B6B72',
    line: '#E6E6EA',
    chip: '#ECECF0',
    /** Dark outline around cards, buttons and badges, like the logo's strokes. */
    outline: '#111113',
    /** Logo yellow: primary buttons, the active choice, level badges. */
    sun: '#FFD60A',
    /** Logo orange: switches and small highlights. */
    wave: '#FF9F1C',
    /** Text on sun or wave. Always dark, also in dark mode. */
    onSun: '#111113',
    /** Pale yellow behind the word popup and a tapped word. */
    soft: '#FFF4C2',
    kr: '#1F4BFF',
    se: '#FFD60A',
    gl: '#FF9F1C',
    onAccent: '#FFFFFF',
  },
  dark: {
    bg: '#0D0D0F',
    card: '#1B1B1F',
    text: '#F4F2EE',
    muted: '#8E8B85',
    line: '#2A2A2F',
    chip: '#26262B',
    outline: '#3E3E45',
    sun: '#FFD60A',
    wave: '#FF9F1C',
    onSun: '#111113',
    soft: '#2E2914',
    kr: '#6F93FF',
    se: '#FFD60A',
    gl: '#FF9F1C',
    onAccent: '#101012',
  },
} as const;

export type Palette = Record<keyof (typeof Colors)["light"], string>;

// The app font (Pretendard, a Korean companion to the logo's Inter) is applied by components/text.tsx,
// which picks the file by font weight. Titles use 800 with tight letter spacing, like the "achim" wordmark.
export const Fonts = { serif: undefined as string | undefined, sans: undefined as string | undefined };

/** Outline width for cards and buttons. */
export const Stroke = 2;

// Phone-sized column; on a wide browser the app stays a centered phone-width column.
export const MaxWidth = 480;
