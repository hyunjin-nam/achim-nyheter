// Builds today's news: 5 Korean + 5 Swedish + 5 global (English) stories.
//
//   node scripts/build-news.mjs --dry-run     pick articles and print them (no API key needed)
//   node scripts/build-news.mjs               pick, write with Claude, update docs/news.json
//
// Stories are written with Google Gemini (free tier). Needs GEMINI_API_KEY.
// Set NEWS_MODEL to pick another Gemini model. (NEWS_PROVIDER=anthropic switches to Claude, which is paid.)

import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { XMLParser } from 'fast-xml-parser';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, '..', 'docs', 'news.json');
const DRY = process.argv.includes('--dry-run');
const PER_COUNTRY = Number(process.env.NEWS_PER_COUNTRY ?? 5);
const KEEP_DAYS = 60;
// Always Gemini, unless NEWS_PROVIDER=anthropic is set on purpose.
const PROVIDER = process.env.NEWS_PROVIDER ?? 'gemini';
const MODEL = process.env.NEWS_MODEL ?? (PROVIDER === 'gemini' ? 'gemini-3.5-flash-lite' : 'claude-opus-5-5');

// Feeds are tried in turn, so each country's five stories come from different outlets.
// KR and SE use domestic sections only (no world news), so they are about life in Korea / Sweden.
// World news belongs to GL.
const FEEDS = {
  KR: [
    // Several outlets, so the same story does not come in three times from one agency.
    // (SBS, MBC and 조선일보 have feeds, but their article text can't be read without a browser.)
    { source: '연합뉴스', url: 'https://www.yna.co.kr/rss/society.xml' },
    { source: '경향신문', url: 'https://www.khan.co.kr/rss/rssdata/society_news.xml' },
    { source: '한겨레', url: 'https://www.hani.co.kr/rss/society/' },
    { source: '뉴시스', url: 'https://newsis.com/RSS/society.xml' },
    { source: '동아일보', url: 'https://rss.donga.com/national.xml' },
    { source: '연합뉴스 지역', url: 'https://www.yna.co.kr/rss/local.xml' },
  ],
  SE: [
    // Several outlets, so one big story (e.g. government talks) can't fill the whole day.
    // (GP has a feed, but only its paywall text can be read.)
    { source: 'SVT Nyheter', url: 'https://www.svt.se/nyheter/inrikes/rss.xml' },
    { source: 'Dagens Nyheter', url: 'https://www.dn.se/rss/nyheter/sverige/' },
    { source: 'Expressen', url: 'https://feeds.expressen.se/nyheter/' },
    { source: 'Svenska Dagbladet', url: 'https://www.svd.se/feed/articles.rss' },
    { source: 'SVT Stockholm', url: 'https://www.svt.se/nyheter/lokalt/stockholm/rss.xml' },
  ],
  GL: [
    { source: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml' },
    { source: 'The Guardian', url: 'https://www.theguardian.com/world/rss' },
    { source: 'NYT World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml' },
  ],
};

const UA = 'Mozilla/5.0 (compatible; AchimNyheter/1.0; personal language-learning app)';
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

const text = (v) => (typeof v === 'string' ? v : v?.['#text'] ?? '');
const clean = (s) =>
  String(s ?? '')
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

async function get(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: '*/*' }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function readFeed(feed) {
  const xml = parser.parse(await get(feed.url));
  const rawItems = xml?.rss?.channel?.item ?? xml?.feed?.entry ?? xml?.['rdf:RDF']?.item ?? [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];
  return items
    .map((it) => {
      const link = typeof it.link === 'string' ? it.link : it.link?.['@_href'] ?? text(it.guid);
      return { source: feed.source, title: clean(text(it.title)), description: clean(text(it.description ?? it.summary)), url: String(link ?? '').trim() };
    })
    .filter((i) => i.title && /^https?:\/\//.test(i.url));
}

/** The article page: paragraph text, and the og:image (the article's own photo). */
async function readArticle(url) {
  try {
    const html = await get(url);
    const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => clean(m[1]))
      .filter((p) => p.length > 60);
    // Some outlets set their logo as og:image. No photo is better than a logo.
    const image = og?.[1]?.replace(/&amp;/g, '&');
    const isLogo = !image || /logo|default|noimage|placeholder|sprite|og[-_]?image/i.test(image);
    return { image: isLogo ? undefined : image, body: paragraphs.join('\n').slice(0, 9000) };
  } catch {
    return { image: undefined, body: '' };
  }
}

/** Up to `max` new feed items for a country, taken from the feeds in turn (titles and descriptions only). */
async function candidates(country, already, max) {
  const lists = [];
  for (const feed of FEEDS[country]) {
    try {
      lists.push(await readFeed(feed));
    } catch (e) {
      console.warn(`  ! ${feed.source}: ${e.message}`);
    }
  }
  const out = [];
  for (let round = 0; out.length < max && round < 30; round++) {
    let any = false;
    for (const list of lists) {
      const item = list[round];
      if (!item) continue;
      any = true;
      if (out.length >= max || already.has(item.url) || out.some((p) => p.url === item.url)) continue;
      out.push({ country, ...item });
    }
    if (!any) break;
  }
  return out;
}

/** Reads the articles in the given order until `count` have enough text to write a story from. */
async function fill(ordered, count) {
  const picked = [];
  for (const item of ordered) {
    if (picked.length >= count) break;
    const art = await readArticle(item.url);
    const body = art.body.length > item.description.length ? art.body : item.description;
    if (body.length < 120) continue; // too little to write a story from
    picked.push({ ...item, body, image: art.image });
  }
  return picked;
}

const RANK_SYSTEM = `You choose the news for a language-learning app. Readers are adults learning Korean or Swedish.
You get numbered candidate headlines (with a short description) for three groups: KR = news in Korea, SE = news in Sweden, GL = world news.
For each group, order ALL its candidate ids from best to worst. Best means:
1. Important today for people living there (KR: Korea, SE: Sweden, GL: the world): news many people talk about and that affects daily life, society or politics.
2. Easy to understand for a learner: concrete, everyday topics beat technical, legal or financial detail.
Put celebrity gossip, sports results, minor crime details and advertorials last unless they are truly major news.
For every candidate also give "event": a short English label of the news event it reports (e.g. "Korea-Philippines summit", "Swedish government talks"). Candidates about the same event, even from different outlets or with different angles, MUST get exactly the same label.
Return each group's candidates under its key, every id exactly once, best first.`;
const RANK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['KR', 'SE', 'GL'],
  properties: Object.fromEntries(
    ['KR', 'SE', 'GL'].map((k) => [
      k,
      {
        type: 'array',
        items: { type: 'object', additionalProperties: false, required: ['id', 'event'], properties: { id: { type: 'string' }, event: { type: 'string' } } },
      },
    ]),
  ),
};

/** One request for all countries: candidates in order of importance and ease. Falls back to feed order. */
async function rank(client, byCountry) {
  const ids = new Map();
  const input = Object.entries(byCountry)
    .map(([country, list]) => `${country}\n` + list.map((c, i) => {
      const id = `${country}${i}`;
      ids.set(id, c);
      return `${id}. ${c.title}${c.description ? ' — ' + c.description.slice(0, 200) : ''}`;
    }).join('\n'))
    .join('\n\n');
  try {
    const res = await callJson(client, RANK_SYSTEM, input, RANK_SCHEMA);
    const out = {};
    for (const [country, list] of Object.entries(byCountry)) {
      // One story per event first; repeats of an event and anything the model left out go to the end.
      const events = new Set();
      const first = [];
      const later = [];
      for (const { id, event } of res[country] ?? []) {
        const c = ids.get(id);
        if (!c || c.country !== country) continue;
        const key = String(event).trim().toLowerCase();
        (key && events.has(key) ? later : first).push(c);
        if (key) events.add(key);
      }
      out[country] = [...new Set([...first, ...later, ...list])];
    }
    return out;
  } catch (e) {
    console.warn(`  ! ranking failed, using feed order: ${e.message}`);
    return byCountry;
  }
}

// ---------------------------------------------------------------- writing
//
// One story = 2 requests: one writes both levels (a1, b1) in ko/sv/en, then one does the word meanings,
// sentence translations and grammar notes for both levels in Korean and Swedish.
// The free tier limits requests per minute, so few big requests are much lighter than many small ones.

const CONCURRENCY = Number(process.env.NEWS_CONCURRENCY ?? 3);
const LANGS = ['ko', 'sv', 'en'];
const LANG_NAME = { ko: 'Korean', sv: 'Swedish', en: 'English' };
const langObj = { type: 'object', additionalProperties: false, required: LANGS, properties: Object.fromEntries(LANGS.map((l) => [l, { type: 'string' }])) };
const oneText = { type: 'object', additionalProperties: false, required: ['title', 'summary'], properties: { title: langObj, summary: langObj } };
const entry = {
  type: 'object',
  additionalProperties: false,
  required: ['word', 'base', 'en', 'level', 'grammar'],
  properties: {
    word: { type: 'string' },
    base: { type: 'string' },
    en: { type: 'string' },
    level: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
    grammar: { type: 'string' },
  },
};
// What the model returns for the sentences of one text: for each sentence its English translation
// and the meaning of every word as used in that sentence.
const GLOSS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['sentences'],
  properties: {
    sentences: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['n', 'en', 'words'],
        properties: { n: { type: 'integer' }, en: { type: 'string' }, words: { type: 'array', items: entry } },
      },
    },
  },
};

const LEVELS = {
  a1: 'very easy news for ADULT beginners, like the "easy language" news sites for immigrants (Nyheter på lätt svenska, 쉬운 한국어 뉴스). Short, concrete sentences of about 6-10 words, everyday words, simple tenses. About 8-10 sentences. Keep the real facts of the article. It must still read like adult news: never childish, no baby talk, no exclamations, no talking down to the reader.',
  b1: 'everyday news language that an intermediate learner can follow: clear sentences of at most about 18 words, no jargon or rare words (explain a needed term briefly). About 16-20 sentences.',
};
const LEVEL_KEYS = Object.keys(LEVELS);
// Both levels come back from one request.
const TEXT_SCHEMA = { type: 'object', additionalProperties: false, required: LEVEL_KEYS, properties: Object.fromEntries(LEVEL_KEYS.map((l) => [l, oneText])) };

const textSystem = () => `You write news items for two people learning each other's languages: one learns Swedish, one learns Korean. Everyone also reads English.

Write the article you are given twice, at two CEFR levels, and return each under its key:
${LEVEL_KEYS.map((l) => `- "${l}" = level ${l.toUpperCase()}: ${LEVELS[l]}`).join('\n')}
The two levels tell the same news; they differ only in how simple the language is and how much detail they include.
Give each level in Korean (ko), Swedish (sv) and English (en). Each language has a title and a summary, which is the full article text in 3-6 short paragraphs separated by a blank line. Cover the whole article, not only its opening. Titles are plain headlines, not clickbait.

Rules:
- Use only facts stated in the article text you are given. Never add details, numbers or quotes that are not in it. If the article is short, write fewer sentences rather than inventing.
- The ko, sv and en versions must say the same thing, each as natural text in that language.
- Plain text only: no markdown, no emoji.

Style, which matters a lot. Write the way a friendly person tells the news out loud, not like a printed newspaper or a translation:
- Korean (ko): natural spoken Korean in the polite 해요체 ("~했어요", "~이에요", "~대요", "~하고 있어요"). NEVER use the stiff newspaper style: no "~했다", "~이다", "~밝혔다", "~전망이다", "~것으로 알려졌다", "~에 따르면", no long chains of Sino-Korean nouns, no sentences that run on with many clauses. Prefer everyday words and short sentences. Titles are short and natural too, e.g. "경북 앞바다에 풍랑주의보가 내려졌어요".
- Swedish (sv): plain, natural everyday Swedish (klarspråk), not stiff or bureaucratic. Short sentences. ALWAYS spell Swedish with its real letters å, ä and ö (för, sjö, hälsa, när). Never replace them with a, o or ASCII, also not in the easiest levels or in titles.
- English (en): plain, natural English, short sentences.`;

const glossSystem = () => `You help learners read Korean and Swedish news. You get several numbered lists of sentences, each under a header such as "A1 KOREAN" or "B1 SWEDISH" (in each list number 0 is the title). Do the work below for every sentence of every list and return each list's results under its level and language, e.g. "A1 KOREAN" under "a1" → "ko", "B1 SWEDISH" under "b1" → "sv". Work through the sentences one by one:
1. Read the WHOLE sentence first and understand what it means in its context.
2. "en": translate the whole sentence into natural English.
3. "words": list every word of the sentence, in order. For each word:
   - "word": exactly as written in the sentence (for Korean the whole space-separated token including its particle or ending, e.g. 첫눈이), without punctuation, lower-cased.
   - "base": its dictionary form (Korean: 첫눈, 내리다; Swedish: snö, falla).
   - "en": what the word means IN THIS SENTENCE, in 1-6 English words. Pick the sense that fits the context, not the most common dictionary meaning if the sentence uses another one. If the word belongs to a phrase, idiom, particle verb or fixed expression, give the meaning it has in that phrase (e.g. "to give up" for "ge upp"). For a Korean token with a particle or ending, give the stem's meaning plus what the ending adds (e.g. "fell (past)", "in Seoul").
   - "level": the CEFR level (A1, A2, B1, B2, C1 or C2) of the word's dictionary form in the sense used here, as a learner would meet it. Everyday basics are A1/A2, news vocabulary is mostly B1/B2, rare or formal words are C1/C2.
   - "grammar": a grammar note IN ENGLISH about THIS word form only, as it is used in this sentence, in one short sentence (at most about 20 words). Say how the form is built from its base and what that does here, e.g. Korean "체결했어요 = 체결하다 + past -았/었- + polite -어요: 'signed'", "기관은 = 기관 + topic particle 은", Swedish "regeringen = regering + definite -en: 'the government'", "har överklagat = har + supine: perfect tense", or the role of a word in a particle verb or fixed phrase ("ge upp"). Do not explain other words of the sentence. Use "" when the word is just its plain base form with nothing to explain (e.g. a bare noun, "och", "i").
Use the sentence numbers n exactly as given in each list. Include every sentence of every list.`;
// All levels, Korean and Swedish, come back together in one request.
const BOTH_LANGS = { type: 'object', additionalProperties: false, required: ['ko', 'sv'], properties: { ko: GLOSS_SCHEMA, sv: GLOSS_SCHEMA } };
const ALL_GLOSS_SCHEMA = { type: 'object', additionalProperties: false, required: LEVEL_KEYS, properties: Object.fromEntries(LEVEL_KEYS.map((l) => [l, BOTH_LANGS])) };

const userTextOf = (story) => `Outlet: ${story.source}\nTitle: ${story.title}\n\nArticle text:\n${story.body}`;

let inTok = 0;
let outTok = 0;

/** Free tiers are rate limited, so wait and try again a few times. */
// Free tier: about 15 requests per minute. Start requests at an even pace instead of all at once.
const RPM = Number(process.env.NEWS_RPM ?? 12);
let nextSlot = 0;
async function pace() {
  const now = Date.now();
  const at = Math.max(now, nextSlot);
  nextSlot = at + 60000 / RPM;
  if (at > now) await new Promise((r) => setTimeout(r, at - now));
}

async function withRetry(fn, tries = 6) {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      const msg = String(e.message);
      // The daily quota only resets hours later: retrying now only wastes time.
      if (i >= tries || /per day/i.test(msg)) throw e;
      // On "429 ... Please retry in 56s" wait as long as the server asks; otherwise back off a little more each time.
      const asked = /\b429\b/.test(msg) ? Number(/retry in (\d+(?:\.\d+)?)/i.exec(msg)?.[1]) : NaN;
      const wait = Number.isFinite(asked) ? Math.ceil(asked + 2) * 1000 : 6000 * i;
      console.warn(`  retry ${i}/${tries - 1} in ${wait / 1000}s (${msg.slice(0, 120)})`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

/** One request that must answer with JSON matching `schema`. */
function callJsonRaw(client, system, input, schema) {
  if (PROVIDER === 'gemini') {
    return withRetry(async () => {
      await pace();
      const interaction = await client.interactions.create({
        model: MODEL,
        input: `${system}\n\n=====\n\n${input}`,
        response_format: { type: 'text', mime_type: 'application/json', schema },
        store: false,
      });
      return JSON.parse(interaction.output_text);
    });
  }
  return withRetry(async () => {
    const res = await client.beta.messages
      .stream({
        model: MODEL,
        max_tokens: 64000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system,
        output_config: { format: { type: 'json_schema', schema } },
        messages: [{ role: 'user', content: input }],
      })
      .finalMessage();
    if (res.stop_reason === 'refusal') throw new Error('refused: ' + JSON.stringify(res.stop_details));
    if (res.stop_reason === 'max_tokens') throw new Error('output cut off (max_tokens)');
    inTok += res.usage.input_tokens;
    outTok += res.usage.output_tokens;
    const block = res.content.find((b) => b.type === 'text');
    if (!block) throw new Error('no text in response');
    return JSON.parse(block.text);
  });
}

/** Splits a text into sentences; `br` marks a sentence that starts a new paragraph. */
function splitSentences(text) {
  const out = [];
  text.split(/\n+/).forEach((para, p) => {
    para
      .split(/(?<=[.!?。？！]["”'’)]*)\s+/u)
      .map((x) => x.trim())
      .filter(Boolean)
      .forEach((x, i) => out.push({ text: x, ...(p > 0 && i === 0 ? { br: true } : {}) }));
  });
  return out;
}

/** Same key the app uses to find a tapped word: lower-case, letters only. */
const wordKey = (w) => w.toLowerCase().replace(/[^\p{L}\p{M}'’-]/gu, '');

/** Joins the sentences with what the model said about them. Sentences it skipped stay without word meanings. */
function buildUnits(parts, sentences) {
  const byN = new Map(sentences.map((x) => [x.n, x]));
  const units = parts.map((p, i) => {
    const got = byN.get(i);
    const words = {};
    for (const w of got?.words ?? []) {
      const key = wordKey(w.word);
      const grammar = w.grammar?.trim();
      if (key && !words[key]) words[key] = { base: w.base, en: w.en, ...(w.level ? { level: w.level } : {}), ...(grammar ? { grammar } : {}) };
    }
    const grammar = got?.grammar?.trim();
    return { text: p.text, en: got?.en ?? '', ...(grammar ? { grammar } : {}), ...(p.br ? { br: true } : {}), words };
  });
  return { title: units[0], body: units.slice(1) };
}

// Free tiers dislike many requests at once, so only a few run at the same time.
function makeGate(max) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= max || queue.length === 0) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    fn().then(resolve, reject).finally(() => {
      active--;
      next();
    });
  };
  return (fn) => new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    next();
  });
}
const gate = makeGate(Number(process.env.NEWS_MAX_CALLS ?? 8));
const callJson = (...args) => gate(() => callJsonRaw(...args));

async function writeStory(client, story) {
  const article = userTextOf(story);
  // Request 1: the text at every level.
  const texts = await callJson(client, textSystem(), article, TEXT_SCHEMA);
  const byLevel = Object.fromEntries(LEVEL_KEYS.map((l) => [l, { ...texts[l], units: {} }]));

  // Request 2: word meanings, sentence translations and grammar for every level and language.
  const parts = {};
  const sections = [];
  for (const l of LEVEL_KEYS) {
    parts[l] = {};
    for (const [lang, name] of [['ko', 'KOREAN'], ['sv', 'SWEDISH']]) {
      const v = byLevel[l];
      parts[l][lang] = [{ text: v.title[lang] }, ...splitSentences(v.summary[lang])];
      sections.push(`${l.toUpperCase()} ${name}\n${parts[l][lang].map((p, i) => `${i}. ${p.text}`).join('\n')}`);
    }
  }
  const res = await callJson(client, glossSystem(), sections.join('\n\n'), ALL_GLOSS_SCHEMA);
  for (const l of LEVEL_KEYS) for (const lang of ['ko', 'sv']) byLevel[l].units[lang] = buildUnits(parts[l][lang], res[l][lang].sentences);
  return byLevel;
}

const asVersion = (v) => ({ title: v.title, summary: v.summary, units: v.units });

/** Runs worker over items, `size` at a time, keeping the order of the results. */
async function pool(items, size, worker) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await worker(items[i], i);
      }
    }),
  );
  return results;
}

// ---------------------------------------------------------------- main

function todayInStockholm() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm' }).format(new Date()); // YYYY-MM-DD
}

const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { days: [] };
const seen = new Set(existing.days.flatMap((d) => d.stories.map((s) => s.url)));

// The first run of the day writes PER_COUNTRY stories per country. Later runs the same day only write
// REFRESH_PER_COUNTRY new ones (or fill up if an earlier run fell short), which keeps Gemini use low.
const REFRESH_PER_COUNTRY = Number(process.env.NEWS_REFRESH_PER_COUNTRY ?? 2);
const date = todayInStockholm();
const earlierToday = existing.days.find((d) => d.date === date)?.stories ?? [];
// Candidates per country: the newest unseen items from its feeds. One request then orders them by
// importance and ease, and the best ones that have enough article text are written.
const CANDIDATES = Number(process.env.NEWS_CANDIDATES ?? 15);
console.log(`Picking articles (${PER_COUNTRY} per country on the first run of the day, then ${REFRESH_PER_COUNTRY} new per run)...`);
const want = {};
const byCountry = {};
for (const country of ['KR', 'SE', 'GL']) {
  const have = earlierToday.filter((s) => s.country === country).length;
  want[country] = Math.max(PER_COUNTRY - have, REFRESH_PER_COUNTRY);
  byCountry[country] = await candidates(country, seen, CANDIDATES);
}
const total = Object.values(byCountry).reduce((n, l) => n + l.length, 0);
if (total === 0) {
  // Normal when the feeds have nothing new since the last run: not an error, so the job stays green.
  console.log('No new articles, leaving news.json unchanged.');
  process.exit(0);
}

if (!DRY && PROVIDER === 'gemini' && !process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
  console.error('GEMINI_API_KEY is not set. Create a free key at https://aistudio.google.com and set it, e.g. in PowerShell:\n  $env:GEMINI_API_KEY = "your-key"');
  process.exit(1);
}
const client = DRY ? null : PROVIDER === 'gemini' ? new GoogleGenAI({}) : new Anthropic();

// --dry-run keeps the feed order and makes no model calls.
const ordered = DRY ? byCountry : await rank(client, byCountry);
const picks = [];
for (const country of ['KR', 'SE', 'GL']) {
  const got = await fill(ordered[country], want[country]);
  console.log(`${country}: ${got.length} (from ${byCountry[country].length} candidates)`);
  for (const g of got) console.log(`  - [${g.source}] ${g.title}\n    ${g.url}\n    text ${g.body.length} chars, image ${g.image ? 'yes' : 'no'}`);
  picks.push(...got);
}

if (DRY) {
  console.log('\n--dry-run: no model calls, nothing written.');
  process.exit(0);
}
if (picks.length === 0) {
  console.log('No new articles with enough text, leaving news.json unchanged.');
  process.exit(0);
}
console.log(`Writing with ${PROVIDER} / ${MODEL}, ${CONCURRENCY} stories at a time`);
const startedAll = Date.now();
const results = await pool(picks, CONCURRENCY, async (p, n) => {
  const started = Date.now();
  const tag = `[${n + 1}/${picks.length}]`;
  console.log(`${tag} writing: ${p.title}`);
  try {
    const out = await writeStory(client, p);
    console.log(`${tag} ok (${Math.round((Date.now() - started) / 1000)}s)`);
    return {
      country: p.country,
      source: p.source,
      url: p.url,
      ...(p.image ? { image: p.image } : {}),
      level: 'B1',
      ...asVersion(out.b1),
      versions: { A1: asVersion(out.a1) },
    };
  } catch (e) {
    console.warn(`${tag} FAIL: ${e.message}`);
    return null;
  }
});
const stories = results.filter(Boolean);
console.log(`Done in ${Math.round((Date.now() - startedAll) / 1000)}s: ${stories.length}/${picks.length} stories`);
if (inTok || outTok) console.log(`Tokens: ${inTok} in, ${outTok} out`);

if (stories.length === 0) {
  console.error('Nothing was written, leaving news.json unchanged.');
  process.exit(1);
}

// The job runs several times a day: new stories go first, earlier ones from the same day stay.
// Each country keeps at most MAX_PER_COUNTRY_PER_DAY (5 by default), the newest ones.
const MAX_PER_COUNTRY_PER_DAY = Number(process.env.NEWS_MAX_PER_COUNTRY_PER_DAY ?? PER_COUNTRY);
const perCountry = {};
const merged = [...stories, ...earlierToday].filter((s) => (perCountry[s.country] = (perCountry[s.country] ?? 0) + 1) <= MAX_PER_COUNTRY_PER_DAY);
const days = existing.days.filter((d) => d.date !== date);
days.unshift({ date, stories: merged });
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ days: days.slice(0, KEEP_DAYS) }) + '\n');
console.log(`Wrote ${stories.length} stories for ${date} -> ${OUT}`);

// --bundle: also put the result into the app itself, so a local run (browser or Expo Go) shows it right away.
if (process.argv.includes('--bundle')) {
  const bundled = path.join(here, '..', 'src', 'data', 'sample-news.json');
  fs.copyFileSync(OUT, bundled);
  console.log(`Copied into the app: ${bundled}`);
}
