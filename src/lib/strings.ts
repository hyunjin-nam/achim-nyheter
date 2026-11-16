import type { Lang, Level } from './types';

type Strings = {
  locale: string;
  today: string;
  archive: string;
  prev: string;
  next: string;
  vocab: string;
  KR: string;
  SE: string;
  GL: string;
  read: string;
  save: string;
  saved: string;
  others: string;
  fold: string;
  noMeaning: string;
  grammar: string;
  sentenceGrammar: string;
  archiveTitle: string;
  archiveBtn: string;
  readEmpty: string;
  done: string;
  again: string;
  olderDay: string;
  level: Record<Level, string>;
  // Settings screen
  settings: string;
  close: string;
  mainLanguage: string;
  mainLanguageHelp: string;
  difficulty: string;
  levelHelp: Record<Level, string>;
  levelNote: string;
  translation: string;
  showTranslation: string;
  whenTapping: string;
  showSentence: string;
  showGrammar: string;
  grammarNote: string;
  listen: string;
  voice: string;
  female: string;
  male: string;
  voiceHelp: string;
  reminder: string;
  dailyReminder: string;
  reminderWebOnly: string;
  perPhone: string;
  // Word list
  vocabEmpty: string;
  remove: string;
  noSavedMeaning: string;
};

/** Interface text, shown only in the main language. */
export const STR: Record<Lang, Strings> = {
  ko: {
    locale: 'ko-KR',
    today: '오늘',
    archive: '지난 뉴스',
    prev: '← 이전',
    next: '다음 →',
    vocab: '단어장',
    KR: '한국',
    SE: '스웨덴',
    GL: '글로벌',
    read: '원문 보기',
    save: '+ 단어장에 추가',
    saved: '✓ 저장됨',
    others: '다른 언어 보기',
    fold: '접기',
    noMeaning: '뜻을 찾지 못했어요.',
    grammar: '문법',
    sentenceGrammar: '문장 문법',
    archiveTitle: '지난 기사',
    archiveBtn: '지난 기사',
    readEmpty: '아직 읽은 기사가 없어요. 카드를 밀어서 넘긴 기사가 여기에 모여요.',
    done: '오늘 기사를 다 읽었어요',
    again: '처음부터 다시',
    olderDay: '이전 날 기사',
    level: { A1: '입문', A2: '초급', B1: '중급', B2: '중상급', C1: '고급', C2: '최상급' },
    settings: '설정',
    close: '완료',
    mainLanguage: '메인 언어',
    mainLanguageHelp: '뉴스와 앱 화면을 이 언어로 보여줘요.',
    difficulty: '난이도',
    levelHelp: { A1: 'A1 · 쉬움: 짧은 문장, 가장 기본적인 단어', A2: 'A2 · 초급', B1: 'B1 · 보통: 자연스러운 뉴스 문장', B2: 'B2 · 중상급', C1: 'C1 · 고급', C2: 'C2 · 최상급' },
    levelNote: '고른 난이도가 없는 기사는 가장 가까운 버전을 보여줘요.',
    translation: '번역',
    showTranslation: '번역도 함께 보기',
    whenTapping: '단어를 눌렀을 때',
    showSentence: '문장 번역 보기',
    showGrammar: '문법 설명 보기',
    grammarNote: '문법 설명은 영어로 나오고, 새로 만들어진 기사부터 볼 수 있어요.',
    listen: '듣기',
    voice: '목소리',
    female: '여성',
    male: '남성',
    voiceHelp: '휴대폰에 있는 가장 자연스러운 목소리로 읽어요. 그 성별의 목소리가 없으면 다른 목소리로 읽어요.',
    reminder: '알림',
    dailyReminder: '매일 알림 받기',
    reminderWebOnly: '알림은 휴대폰 앱에서만 동작해요.',
    perPhone: '설정은 휴대폰마다 따로 저장돼요.',
    vocabEmpty: '아직 저장한 단어가 없어요. 뉴스에서 단어를 누르고 "단어장에 추가"를 눌러 보세요.',
    remove: '삭제',
    noSavedMeaning: '뜻 정보가 없어요.',
  },
  sv: {
    locale: 'sv-SE',
    today: 'IDAG',
    archive: 'ARKIV',
    prev: '← Föregående',
    next: 'Nästa →',
    vocab: 'Ordlista',
    KR: 'Korea',
    SE: 'Sverige',
    GL: 'Världen',
    read: 'Läs originalet',
    save: '+ Spara i ordlistan',
    saved: '✓ Sparad',
    others: 'Visa andra språk',
    fold: 'Dölj',
    noMeaning: 'Hittade ingen betydelse.',
    grammar: 'GRAMMATIK',
    sentenceGrammar: 'MENINGENS GRAMMATIK',
    archiveTitle: 'Tidigare nyheter',
    archiveBtn: 'Tidigare',
    readEmpty: 'Inga lästa nyheter ännu. Nyheter du svept förbi samlas här.',
    done: 'Du har läst alla dagens nyheter',
    again: 'Börja om',
    olderDay: 'Föregående dag',
    level: { A1: 'Nybörjare', A2: 'Grundläggande', B1: 'Mellannivå', B2: 'Övre mellannivå', C1: 'Avancerad', C2: 'Flytande' },
    settings: 'Inställningar',
    close: 'Klar',
    mainLanguage: 'Huvudspråk',
    mainLanguageHelp: 'Nyheterna och appen visas på det här språket.',
    difficulty: 'Svårighetsgrad',
    levelHelp: { A1: 'A1 · Lätt: korta meningar, de vanligaste orden', A2: 'A2 · Grundläggande', B1: 'B1 · Mellan: vanligt nyhetsspråk', B2: 'B2 · Övre mellannivå', C1: 'C1 · Avancerad', C2: 'C2 · Flytande' },
    levelNote: 'Finns inte den nivån för en nyhet visas den närmaste.',
    translation: 'Översättning',
    showTranslation: 'Visa även översättning',
    whenTapping: 'När du trycker på ett ord',
    showSentence: 'Visa meningen översatt',
    showGrammar: 'Visa grammatik',
    grammarNote: 'Grammatiken förklaras på engelska och finns i nyheter som skapats från och med nu.',
    listen: 'Lyssna',
    voice: 'Röst',
    female: 'Kvinna',
    male: 'Man',
    voiceHelp: 'Den mest naturliga rösten på telefonen används. Saknas en röst av det könet används en annan.',
    reminder: 'Påminnelse',
    dailyReminder: 'Daglig påminnelse',
    reminderWebOnly: 'Påminnelser fungerar bara i mobilappen.',
    perPhone: 'Inställningarna sparas separat på varje telefon.',
    vocabEmpty: 'Inga sparade ord ännu. Tryck på ett ord i en nyhet och välj "Spara i ordlistan".',
    remove: 'Ta bort',
    noSavedMeaning: 'Ingen betydelse sparad.',
  },
  en: {
    locale: 'en-GB',
    today: 'TODAY',
    archive: 'ARCHIVE',
    prev: '← Previous',
    next: 'Next →',
    vocab: 'Words',
    KR: 'Korea',
    SE: 'Sweden',
    GL: 'Global',
    read: 'Read the original',
    save: '+ Save word',
    saved: '✓ Saved',
    others: 'Other languages',
    fold: 'Hide',
    noMeaning: "Couldn't find a meaning.",
    grammar: 'GRAMMAR',
    sentenceGrammar: 'SENTENCE GRAMMAR',
    archiveTitle: 'Past stories',
    archiveBtn: 'Past',
    readEmpty: 'Nothing read yet. Stories you swipe past are collected here.',
    done: "You've read all of today's stories",
    again: 'Start over',
    olderDay: 'Previous day',
    level: { A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate', B2: 'Upper-intermediate', C1: 'Advanced', C2: 'Proficient' },
    settings: 'Settings',
    close: 'Done',
    mainLanguage: 'Main language',
    mainLanguageHelp: 'News and the app are shown in this language.',
    difficulty: 'Difficulty',
    levelHelp: { A1: 'A1 · Easy: short sentences, the most basic words', A2: 'A2 · Elementary', B1: 'B1 · Intermediate: everyday news language', B2: 'B2 · Upper-intermediate', C1: 'C1 · Advanced', C2: 'C2 · Proficient' },
    levelNote: 'If a story is not available at your level, the closest one is shown.',
    translation: 'Translation',
    showTranslation: 'Also show a translation',
    whenTapping: 'When you tap a word',
    showSentence: 'Show the sentence translated',
    showGrammar: 'Show grammar',
    grammarNote: 'Grammar is explained in English, in stories made from now on.',
    listen: 'Listen',
    voice: 'Voice',
    female: 'Female',
    male: 'Male',
    voiceHelp:
      "Words are read by the most natural voice on your phone. If it has no voice of that kind for a language, another voice reads instead. On iPhone you can download better voices in Settings › Accessibility › Spoken Content › Voices. Turn off silent mode to hear them.",
    reminder: 'Reminder',
    dailyReminder: 'Daily reminder',
    reminderWebOnly: 'Reminders only work in the phone app.',
    perPhone: 'Settings are saved separately on each phone.',
    vocabEmpty: 'No saved words yet. Tap a word in a story and choose "Save word".',
    remove: 'Remove',
    noSavedMeaning: 'No meaning saved.',
  },
};
