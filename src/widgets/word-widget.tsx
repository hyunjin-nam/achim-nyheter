import { HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  padding,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

/** One word on the widget. Props cross into the widget's own runtime as JSON, so only plain values. */
export type WordWidgetProps = {
  /** The word as written in the article (or the saved word). */
  word: string;
  /** Dictionary form, if it differs. */
  base?: string;
  /** Meaning in English. */
  meaning: string;
  /** CEFR level of the word, e.g. "B1". */
  level?: string;
  /** "Korean", "Swedish" or "English". */
  language: string;
};

// A word card in the "Sunny" logo colours, for the home screen and the lock screen.
// Everything the widget uses must live inside this function: the 'widget' directive moves only its
// body into the widget's separate JavaScript runtime (no outside constants, hooks or async code).
const WordWidget = (props: WordWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  const SUN = '#FFD60A';
  const INK = '#111113';
  const MUTED = '#5C4A00';
  const OPEN_APP = 'achimnyheter://';
  const head = props.base || props.word;
  const family = environment.widgetFamily;

  // Lock screen, one line above the clock.
  if (family === 'accessoryInline') {
    return (
      <Text modifiers={[widgetURL(OPEN_APP)]}>
        {head} · {props.meaning}
      </Text>
    );
  }

  // Lock screen rectangle: word, level and meaning. iOS draws it in the lock screen's own tint.
  if (family === 'accessoryRectangular') {
    return (
      <VStack
        alignment="leading"
        spacing={1}
        modifiers={[
          containerBackground('#00000000', 'widget'),
          frame({ maxWidth: Infinity, alignment: 'leading' }),
          widgetURL(OPEN_APP),
        ]}>
        <HStack spacing={6}>
          <Text modifiers={[font({ size: 16, weight: 'heavy' }), lineLimit(1), minimumScaleFactor(0.6)]}>{head}</Text>
          {props.level ? <Text modifiers={[font({ size: 12, weight: 'bold' }), foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}>{props.level}</Text> : null}
        </HStack>
        <Text modifiers={[font({ size: 14, weight: 'medium' }), lineLimit(2)]}>{props.meaning}</Text>
      </VStack>
    );
  }

  // Home screen: a yellow card like the app icon.
  const medium = family === 'systemMedium';
  return (
    <VStack
      alignment="leading"
      spacing={4}
      modifiers={[
        containerBackground(SUN, 'widget'),
        frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' }),
        padding({ all: medium ? 4 : 0 }),
        widgetURL(OPEN_APP),
      ]}>
      <HStack spacing={6}>
        <Text modifiers={[font({ size: 11, weight: 'bold' }), foregroundStyle(MUTED)]}>{props.language.toUpperCase()}</Text>
        <Spacer />
        {props.level ? <Text modifiers={[font({ size: 12, weight: 'heavy' }), foregroundStyle(INK)]}>{props.level}</Text> : null}
      </HStack>
      <Spacer />
      <Text modifiers={[font({ size: medium ? 34 : 26, weight: 'heavy' }), foregroundStyle(INK), lineLimit(1), minimumScaleFactor(0.5)]}>
        {head}
      </Text>
      {props.base && props.base !== props.word ? (
        <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(MUTED), lineLimit(1)]}>{props.word}</Text>
      ) : null}
      <Text modifiers={[font({ size: medium ? 17 : 14, weight: 'semibold' }), foregroundStyle(INK), lineLimit(medium ? 2 : 3)]}>
        {props.meaning}
      </Text>
    </VStack>
  );
};

export default createWidget('WordWidget', WordWidget);
