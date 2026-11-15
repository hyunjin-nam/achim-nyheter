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
  archiveTitle: string;
  archiveBtn: string;
  readEmpty: string;
  done: string;
  again: string;
  olderDay: string;
  level: Record<Level, string>;
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
    archiveTitle: '지난 기사',
    archiveBtn: '지난 기사',
    readEmpty: '아직 읽은 기사가 없어요. 카드를 밀어서 넘긴 기사가 여기에 모여요.',
    done: '오늘 기사를 다 읽었어요',
    again: '처음부터 다시',
    olderDay: '이전 날 기사',
    level: { A1: '입문', A2: '초급', B1: '중급', B2: '중상급', C1: '고급', C2: '최상급' },
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
    archiveTitle: 'Tidigare nyheter',
    archiveBtn: 'Tidigare',
    readEmpty: 'Inga lästa nyheter ännu. Nyheter du svept förbi samlas här.',
    done: 'Du har läst alla dagens nyheter',
    again: 'Börja om',
    olderDay: 'Föregående dag',
    level: { A1: 'Nybörjare', A2: 'Grundläggande', B1: 'Mellannivå', B2: 'Övre mellannivå', C1: 'Avancerad', C2: 'Flytande' },
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
    archiveTitle: 'Past stories',
    archiveBtn: 'Past',
    readEmpty: 'Nothing read yet. Stories you swipe past are collected here.',
    done: "You've read all of today's stories",
    again: 'Start over',
    olderDay: 'Previous day',
    level: { A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate', B2: 'Upper-intermediate', C1: 'Advanced', C2: 'Proficient' },
  },
};
