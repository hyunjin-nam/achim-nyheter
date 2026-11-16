import * as Speech from 'expo-speech';

import type { Lang } from './types';

export type VoiceGender = 'female' | 'male';

const LOCALE: Record<Lang, string> = { sv: 'sv-SE', ko: 'ko-KR', en: 'en-US' };

// Voices carry no gender, so it comes from their names: iOS (Apple), web (Microsoft and Google) and
// Android (Google's voice codes). An unknown name is never picked for a gender, only as a last resort.
const NAMES: Record<VoiceGender, string[]> = {
  female: [
    // Swedish
    'alva', 'klara', 'sofie', 'hillevi', 'heami', 'sv-se-x-lfs', 'sv-se-x-cfg', 'sv-se-x-afp',
    // Korean
    'yuna', 'suhyun', 'sora', 'sunhi', 'jimin', 'seoyeon', 'yujin', 'ko-kr-x-ism', 'ko-kr-x-kob',
    // English
    'samantha', 'ava', 'allison', 'susan', 'zoe', 'nicky', 'karen', 'moira', 'tessa', 'serena', 'martha',
    'kate', 'catherine', 'aria', 'jenny', 'michelle', 'emma', 'sonia', 'libby', 'female',
    'en-us-x-sfg', 'en-us-x-iob', 'en-us-x-tpc', 'en-gb-x-gba',
  ],
  male: [
    'oskar', 'mattias', 'bengt', 'sv-se-x-dmc', 'sv-se-x-cmh',
    'minsu', 'jian', 'injoon', 'hyunsu', 'bongjin', 'gookmin', 'ko-kr-x-koc', 'ko-kr-x-kod',
    'daniel', 'alex', 'aaron', 'fred', 'tom', 'evan', 'nathan', 'oliver', 'arthur', 'gordon', 'rishi',
    'guy', 'davis', 'eric', 'andrew', 'brian', 'christopher', 'ryan', 'thomas', 'male',
    'en-us-x-iom', 'en-us-x-tpd', 'en-gb-x-rjs',
  ],
};

const genderOf = (v: Speech.Voice): VoiceGender | null => {
  const id = `${v.name} ${v.identifier}`.toLowerCase();
  // "female" contains "male", so it is checked first, and names must match as whole words.
  for (const g of ['female', 'male'] as const) {
    if (NAMES[g].some((n) => (n.includes('-') ? id.includes(n) : new RegExp(`(^|[^a-z])${n}([^a-z]|$)`).test(id)))) return g;
  }
  return null;
};

/** Higher is more natural: downloaded "enhanced"/"premium" voices and online "natural"/"neural" ones. */
const naturalness = (v: Speech.Voice) => {
  const id = `${v.name} ${v.identifier}`.toLowerCase();
  let score = 0;
  if (/premium/.test(id)) score += 3;
  if (v.quality === Speech.VoiceQuality.Enhanced || /enhanced/.test(id)) score += 2;
  if (/natural|neural|online/.test(id)) score += 2;
  // Novelty voices on Apple devices that are not meant for reading.
  if (/eloquence|bahh|bells|boing|bubbles|cellos|wobble|whisper|zarvox|trinoids|organ|jester|superstar|bad news|good news|albert|junior|ralph|kathy|grandma|grandpa|rocko|shelley|flo|reed|sandy/.test(id)) score -= 10;
  return score;
};

let voices: Promise<Speech.Voice[]> | null = null;
const allVoices = () => {
  voices ??= Speech.getAvailableVoicesAsync()
    .then((list) => {
      // Web loads its voices a moment after start and gives an empty list until then; try again next time.
      if (!list.length) voices = null;
      return list;
    })
    .catch(() => {
      voices = null;
      return [];
    });
  return voices;
};

/** The most natural voice for the language, of the chosen gender when the phone has one. */
async function pickVoice(lang: Lang, gender: VoiceGender): Promise<string | undefined> {
  const prefix = lang.toLowerCase();
  const forLang = (await allVoices()).filter((v) => v.language.toLowerCase().replace('_', '-').startsWith(prefix));
  const best = (list: Speech.Voice[]) => [...list].sort((a, b) => naturalness(b) - naturalness(a))[0];
  return (best(forLang.filter((v) => genderOf(v) === gender)) ?? best(forLang.filter((v) => genderOf(v) === null)) ?? best(forLang))
    ?.identifier;
}

/** Reads a word or sentence out loud. Anything already being read is stopped first. */
export async function speak(text: string, lang: Lang, gender: VoiceGender, callbacks?: { onDone?: () => void }) {
  await Speech.stop();
  const voice = await pickVoice(lang, gender);
  Speech.speak(text, {
    language: LOCALE[lang],
    voice,
    rate: 0.9, // a little slower than normal, for learners
    onDone: callbacks?.onDone,
    onStopped: callbacks?.onDone,
    onError: callbacks?.onDone,
  });
}

export const stopSpeaking = () => Speech.stop();
