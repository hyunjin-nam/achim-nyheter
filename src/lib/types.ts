export type Lang = 'ko' | 'sv' | 'en';
export const LANGS: Lang[] = ['ko', 'sv', 'en'];
export const LANG_NAME: Record<Lang, string> = { ko: '한국어', sv: 'Svenska', en: 'English' };

/** One word's dictionary entry: its base form and its meaning in each language. */
export type WordEntry = { base?: string; /** CEFR level of the word itself (A1 easiest to C2). */ level?: Level; /** Grammar of this word form in its sentence, in English. */ grammar?: string; /** The sentence the word was saved from. */ example?: string } & Partial<Record<Lang, string>>;

/** One sentence of a story with its translation and the meaning of each word *in that sentence*. */
export type Unit = {
  text: string;
  /** English translation of the whole sentence. */
  en: string;
  /** Grammar note for the whole sentence, in English. Only in data from before word-level grammar. */
  grammar?: string;
  /** True when this sentence starts a new paragraph. */
  br?: boolean;
  /** Keyed by the lower-cased word without punctuation. */
  words: Record<string, WordEntry>;
};
/** The title and the body of one language, split into sentences. */
export type Units = { title: Unit; body: Unit[] };
export type UnitsByLang = Partial<Record<Lang, Units>>;
/** Keyed by the lower-cased word exactly as it appears in the text of that language. */
export type Glossary = Partial<Record<Lang, Record<string, WordEntry>>>;

/** CEFR difficulty of the text. */
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

/** The difficulties a user can choose in settings. */
export const CHOOSABLE_LEVELS: Level[] = ['A1', 'B1'];

/** The same story rewritten for another difficulty. */
export type StoryVersion = {
  units?: UnitsByLang;
  title: Record<Lang, string>;
  summary: Record<Lang, string>;
  glossary?: Glossary;
};

/** KR = Korea, SE = Sweden, GL = global (English-language) news. */
export type Country = 'KR' | 'SE' | 'GL';
export const COUNTRIES: Country[] = ['KR', 'SE', 'GL'];

export type Story = {
  /** Sentence by sentence word meanings (new data). Older data only has `glossary`. */
  units?: UnitsByLang;
  level?: Level;
  /** Alternative rewrites keyed by difficulty. The top-level title/summary are the story's own `level`. */
  versions?: Partial<Record<Level, StoryVersion>>;
  glossary?: Glossary;
  country: Country;
  source: string;
  url: string;
  /** Optional photo URL taken from the article's own feed entry. */
  image?: string;
  title: Record<Lang, string>;
  summary: Record<Lang, string>;
};

export type Day = { date: string; stories: Story[] };

export type Settings = {
  /** Main language: the only one shown unless translation is on. */
  learning: Lang;
  /** Language of the optional translation shown below. */
  native: Lang;
  showTranslation: boolean;
  /** Show the whole sentence in English under the meaning of a tapped word. */
  showSentence: boolean;
  /** Show a grammar note for the sentence of a tapped word. */
  showGrammar: boolean;
  /** Preferred difficulty. */
  level: Level;
  /** Voice that reads words out loud. */
  voice: 'female' | 'male';
  notify: boolean;
  hour: number;
};

export const DEFAULT_SETTINGS: Settings = {
  learning: 'sv',
  native: 'ko',
  showTranslation: false,
  showSentence: true,
  showGrammar: false,
  level: 'B1',
  voice: 'female',
  notify: true,
  hour: 8,
};
