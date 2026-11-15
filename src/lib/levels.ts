import type { Level, Story } from './types';

const ORDER: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/** The story at the difficulty closest to `want` (its own level counts as one of the options). */
export function resolveStory(story: Story, want: Level): Story {
  const versions = story.versions;
  if (!versions) return story;

  const options = [
    ...(story.level ? [story.level] : []),
    ...(Object.keys(versions) as Level[]),
  ];
  const target = ORDER.indexOf(want);
  const best = options.reduce((a, b) =>
    Math.abs(ORDER.indexOf(b) - target) < Math.abs(ORDER.indexOf(a) - target) ? b : a,
  );

  const v = versions[best];
  if (best === story.level || !v) return story;
  // units must come from the chosen version only, never from the story's own level.
  return { ...story, ...v, units: v.units, level: best };
}
