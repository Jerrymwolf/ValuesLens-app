import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Netlify timeout config
export const maxDuration = 26;

const client = new Anthropic();

// ============ CONFIGURATION ============

const CONFIG = {
  model: 'claude-sonnet-4-5-20250929' as const,
  max_tokens: 1500,
  temperature: 0.7,
};

// ============ TYPES ============

interface ValueInput {
  id: string;
  name: string;
}

interface WOOPRequest {
  values: ValueInput[];
  story: string;
}

interface WOOPItem {
  value_id: string;
  outcomes: string[];
  obstacles: string[];
  obstacle_categories: ('AVOIDANCE' | 'EXCESS' | 'TIMING' | 'SELF-PROTECTION' | 'IDENTITY')[];
  reframes: string[];
}

interface WOOPResponse {
  language_to_echo: string[];
  woop: WOOPItem[];
  fallback?: boolean;
  error?: string;
}

// ============ SYSTEM PROMPT ============

const SYSTEM_PROMPT = `Generate WOOP statements that make people wince AND nod.

For each value, generate exactly 3 OPTIONS for each field.

**OUTCOMES** (3 options, each 10-20 words)
- Speaks to their desire, vivid, emotional
- Starts with "I", present tense

**OBSTACLES** (3 options, each 8-15 words)
- MUST start with "my [feeling]..."
- Names a deeper feeling, not surface emotion
- Each uses a DIFFERENT category

**OBSTACLE_CATEGORIES**:
AVOIDANCE | EXCESS | TIMING | SELF-PROTECTION | IDENTITY

**REFRAMES** (3 options, each 3-8 words)
- Sticky, memorable phrases
- Has rhythm and tension

**LANGUAGE_TO_ECHO**: Extract 3-5 exact phrases from the story.

If story is sparse, infer patterns from the chosen values.`;

// ============ TOOL SCHEMA ============

const tools: Anthropic.Tool[] = [
  {
    name: 'generate_woop',
    description: 'Generate WOOP statements for values',
    input_schema: {
      type: 'object' as const,
      properties: {
        language_to_echo: {
          type: 'array',
          items: { type: 'string' },
        },
        woop: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value_id: { type: 'string' },
              outcomes: { type: 'array', items: { type: 'string' } },
              obstacles: { type: 'array', items: { type: 'string' } },
              obstacle_categories: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['AVOIDANCE', 'EXCESS', 'TIMING', 'SELF-PROTECTION', 'IDENTITY'],
                },
              },
              reframes: { type: 'array', items: { type: 'string' } },
            },
            required: ['value_id', 'outcomes', 'obstacles', 'obstacle_categories', 'reframes'],
          },
        },
      },
      required: ['language_to_echo', 'woop'],
    },
  },
];

// ============ USER PROMPT BUILDER ============

function buildUserPrompt(values: ValueInput[], story: string): string {
  const valueList = values.map((v) => `${v.name} (id: ${v.id})`).join(', ');
  return `Generate WOOP statements for these values:

VALUES: ${valueList}

STORY: "${story || 'No story provided. Infer patterns from the chosen values.'}"

Use the generate_woop tool.`;
}

// ============ VALIDATION HELPER ============

function validateResult(
  result: { language_to_echo: string[]; woop: WOOPItem[] } | null,
  values: ValueInput[]
): boolean {
  if (!result) return false;
  if (!result.language_to_echo?.length) return false;
  if (result.woop?.length !== values.length) return false;

  return result.woop.every(
    (w) =>
      w.outcomes?.length >= 1 &&
      w.obstacles?.length >= 1 &&
      w.obstacle_categories?.length >= 1 &&
      w.reframes?.length >= 1
  );
}

function extractToolUse<T>(response: Anthropic.Message, toolName: string): T | null {
  const toolUseBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use' && block.name === toolName
  );
  return toolUseBlock ? (toolUseBlock.input as T) : null;
}

// ============ FALLBACK FUNCTION ============

function generateFallbackWoop(values: ValueInput[]): WOOPItem[] {
  const categories: WOOPItem['obstacle_categories'][0][] = [
    'AVOIDANCE',
    'TIMING',
    'SELF-PROTECTION',
    'EXCESS',
    'IDENTITY',
  ];

  return values.map((v, i) => ({
    value_id: v.id,
    outcomes: [
      `I live ${v.name.toLowerCase()} fully and feel aligned`,
      `I experience ${v.name.toLowerCase()} in my daily choices`,
      `I feel proud of how ${v.name.toLowerCase()} shows up in my life`,
    ],
    obstacles: [
      `my fear of not being good enough`,
      `my tendency to stay comfortable when challenged`,
      `my belief that conditions must be perfect first`,
    ],
    obstacle_categories: [
      categories[i % 5],
      categories[(i + 1) % 5],
      categories[(i + 2) % 5],
    ],
    reframes: [
      'The obstacle is the way',
      'Small steps, big shifts',
      'Progress over perfection',
    ],
  }));
}

function generateFallbackLanguage(story: string): string[] {
  const words = story.split(/\s+/).filter((w) => w.length > 4);
  return words.length > 0 ? words.slice(0, 5) : ['growth', 'change', 'alignment'];
}

// ============ MAIN HANDLER ============

export async function POST(request: Request) {
  let requestValues: ValueInput[] = [];
  let requestStory = '';

  try {
    const body = (await request.json()) as WOOPRequest;
    requestValues = body.values || [];
    requestStory = body.story || '';

    if (requestValues.length === 0) {
      return NextResponse.json({ error: 'Values are required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('[WOOP] No API key, using fallback');
      return NextResponse.json({
        language_to_echo: generateFallbackLanguage(requestStory),
        woop: generateFallbackWoop(requestValues),
        fallback: true,
      });
    }

    console.log('[WOOP] Generating WOOP with Sonnet 4.5...');

    const stream = await client.messages.stream({
      ...CONFIG,
      tools,
      tool_choice: { type: 'tool', name: 'generate_woop' },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(requestValues, requestStory) }],
    });

    const response = await stream.finalMessage();
    const result = extractToolUse<{
      language_to_echo: string[];
      woop: WOOPItem[];
    }>(response, 'generate_woop');

    // Validate and fallback if needed
    if (!result || !validateResult(result, requestValues)) {
      console.warn('[WOOP] Validation failed, using fallback');
      return NextResponse.json({
        language_to_echo: generateFallbackLanguage(requestStory),
        woop: generateFallbackWoop(requestValues),
        fallback: true,
      });
    }

    console.log('[WOOP] Complete. Categories:', result.woop.map((w) => w.obstacle_categories));

    return NextResponse.json({
      language_to_echo: result.language_to_echo,
      woop: result.woop,
    } as WOOPResponse);

  } catch (error) {
    console.error('[WOOP] Error:', error);

    if (requestValues.length > 0) {
      return NextResponse.json({
        language_to_echo: generateFallbackLanguage(requestStory),
        woop: generateFallbackWoop(requestValues),
        fallback: true,
        error: 'Pipeline failed, using fallback',
      });
    }

    return NextResponse.json({ error: 'Failed to generate WOOP' }, { status: 500 });
  }
}
