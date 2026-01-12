import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Netlify timeout config
export const maxDuration = 26;

const client = new Anthropic();

// ============ CONFIGURATION ============

const CONFIG = {
  model: 'claude-sonnet-4-5-20250929' as const,
  max_tokens: 3000,
  temperature: 0.6,
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

interface AffectAnalysis {
  surface: string;
  deeper: string;
}

interface BehaviorAnalysis {
  protective: string;
  aspirational: string;
  tell: string;
}

interface CognitionAnalysis {
  belief: string;
  lie: string;
}

interface DesireAnalysis {
  hungry_for: string;
  protecting: string;
  relief_sought: string;
}

interface ValueAnalysis {
  value_id: string;
  value_name: string;
  affect: AffectAnalysis;
  behavior: BehaviorAnalysis;
  cognition: CognitionAnalysis;
  desire: DesireAnalysis;
  wound: string;
  wince_moment: string;
  nod_moment: string;
}

interface StoryAnalysis {
  language_to_echo: string[];
  values_analysis: ValueAnalysis[];
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
  analysis: ValueAnalysis[];
  woop: WOOPItem[];
  fallback?: boolean;
  error?: string;
}

// ============ SYSTEM PROMPT ============

const SYSTEM_PROMPT = `You analyze stories and generate WOOP statements that make people wince AND nod.

## YOUR TASK
1. First, internally analyze the story using the ABCD framework
2. Then, generate **3 OPTIONS** for each WOOP field per value
3. Return everything via the tool

## ABCD FRAMEWORK (Internal Analysis)

For each value, extract:

**AFFECT** - Surface emotions (frustration, guilt) and deeper feelings (fear, longing)
**BEHAVIOR** - Protective patterns, aspirational behaviors, tells
**COGNITION** - Beliefs, narratives, lies they tell themselves
**DESIRE** - What they're hungry for, protecting, seeking relief from

Also identify:
- **WOUND**: Core emotional injury
- **WINCE_MOMENT**: What would be uncomfortable to read
- **NOD_MOMENT**: What they'd immediately recognize as true
- **LANGUAGE_TO_ECHO**: Their exact phrases (minimum 3)

## WOOP GENERATION RULES

**IMPORTANT: Generate exactly 3 different options for each field (outcomes, obstacles, reframes)**

**OUTCOMES** (3 options, each 10-20 words)
- Each speaks to their DESIRE differently
- Vivid, emotional, relational
- Each starts with "I", present tense
- Vary the angle: one aspirational, one relational, one relief-focused

**OBSTACLES** (3 options, each 8-15 words)
- Each MUST start with "my [feeling-word]..."
- Names deeper AFFECT, not surface
- Format: "my [feeling] that/of [pattern]"
- Each should explore a DIFFERENT category

**OBSTACLE_CATEGORIES** - Provide category for each obstacle:
- AVOIDANCE: Dodging discomfort/vulnerability
- EXCESS: Overdoing, perfectionism
- TIMING: Waiting, rushing, delaying
- SELF-PROTECTION: Hiding, minimizing
- IDENTITY: Role constraints

**REFRAMES** (3 options, each 3-8 words)
- Each flips protective behavior into fuel
- Has rhythm, tension, surprise
- Sticky enough for a post-it note
- Vary style: one punchy, one poetic, one actionable

## THIN STORY HANDLING

If story is sparse (<30 words):
1. Use chosen VALUES as signals
2. Infer patterns from common human experiences
3. Note that thin stories often indicate AVOIDANCE patterns

## QUALITY GATE

Before returning, verify for EACH value:
□ Exactly 3 outcomes, 3 obstacles, 3 obstacle_categories, 3 reframes
□ Each outcome speaks to specific desire
□ Each obstacle names a feeling and starts with "my..."
□ Each reframe has rhythm + tension + surprise
□ Options feel distinct, not repetitive`;

// ============ TOOL SCHEMA ============

const tools: Anthropic.Tool[] = [
  {
    name: 'analyze_and_generate_woop',
    description: 'Analyze story and generate WOOP statements',
    input_schema: {
      type: 'object' as const,
      properties: {
        language_to_echo: {
          type: 'array',
          items: { type: 'string' },
          description: 'Exact phrases from story (minimum 3)',
        },
        analysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value_id: { type: 'string' },
              value_name: { type: 'string' },
              affect: {
                type: 'object',
                properties: {
                  surface: { type: 'string' },
                  deeper: { type: 'string' },
                },
                required: ['surface', 'deeper'],
              },
              behavior: {
                type: 'object',
                properties: {
                  protective: { type: 'string' },
                  aspirational: { type: 'string' },
                  tell: { type: 'string' },
                },
                required: ['protective', 'aspirational', 'tell'],
              },
              cognition: {
                type: 'object',
                properties: {
                  belief: { type: 'string' },
                  lie: { type: 'string' },
                },
                required: ['belief', 'lie'],
              },
              desire: {
                type: 'object',
                properties: {
                  hungry_for: { type: 'string' },
                  protecting: { type: 'string' },
                  relief_sought: { type: 'string' },
                },
                required: ['hungry_for', 'protecting', 'relief_sought'],
              },
              wound: { type: 'string' },
              wince_moment: { type: 'string' },
              nod_moment: { type: 'string' },
            },
            required: [
              'value_id',
              'value_name',
              'affect',
              'behavior',
              'cognition',
              'desire',
              'wound',
              'wince_moment',
              'nod_moment',
            ],
          },
        },
        woop: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value_id: { type: 'string' },
              outcomes: {
                type: 'array',
                items: { type: 'string' },
                description: '3 different outcome options',
              },
              obstacles: {
                type: 'array',
                items: { type: 'string' },
                description: '3 different obstacle options, each starting with "my..."',
              },
              obstacle_categories: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['AVOIDANCE', 'EXCESS', 'TIMING', 'SELF-PROTECTION', 'IDENTITY'],
                },
                description: 'Category for each obstacle (3 total)',
              },
              reframes: {
                type: 'array',
                items: { type: 'string' },
                description: '3 different reframe options',
              },
            },
            required: ['value_id', 'outcomes', 'obstacles', 'obstacle_categories', 'reframes'],
          },
        },
      },
      required: ['language_to_echo', 'analysis', 'woop'],
    },
  },
];

// ============ USER PROMPT BUILDER ============

function buildUserPrompt(values: ValueInput[], story: string): string {
  const valueList = values.map((v) => `${v.name} (id: ${v.id})`).join(', ');
  return `Analyze this story and generate WOOP statements.

VALUES: ${valueList}

STORY: "${story || 'No story provided. Infer patterns from the chosen values.'}"

Use the analyze_and_generate_woop tool.`;
}

// ============ VALIDATION HELPER ============

function validateResult(
  result: { language_to_echo: string[]; analysis: ValueAnalysis[]; woop: WOOPItem[] } | null,
  values: ValueInput[]
): boolean {
  if (!result) return false;
  if (!result.language_to_echo?.length) return false;
  if (result.analysis?.length !== values.length) return false;
  if (result.woop?.length !== values.length) return false;

  const analysisValid = result.analysis.every(
    (a) => a.affect?.deeper && a.behavior?.protective && a.desire?.hungry_for
  );
  const woopValid = result.woop.every(
    (w) =>
      w.outcomes?.length >= 1 &&
      w.obstacles?.length >= 1 &&
      w.obstacle_categories?.length >= 1 &&
      w.reframes?.length >= 1
  );

  return analysisValid && woopValid;
}

function extractToolUse<T>(response: Anthropic.Message, toolName: string): T | null {
  const toolUseBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use' && block.name === toolName
  );
  return toolUseBlock ? (toolUseBlock.input as T) : null;
}

// ============ FALLBACK FUNCTIONS ============

function generateFallbackAnalysis(values: ValueInput[], story: string): StoryAnalysis {
  const words = story.split(/\s+/).filter((w) => w.length > 4);
  const language = words.slice(0, 5);

  return {
    language_to_echo: language.length > 0 ? language : ['growth', 'change'],
    values_analysis: values.map((v) => ({
      value_id: v.id,
      value_name: v.name,
      affect: {
        surface: 'frustration with current patterns',
        deeper: `fear of not living ${v.name.toLowerCase()} fully`,
      },
      behavior: {
        protective: 'staying in comfortable routines',
        aspirational: `embodying ${v.name.toLowerCase()} daily`,
        tell: 'moments of hesitation before acting',
      },
      cognition: {
        belief: 'change is hard',
        lie: "I'll start when conditions are right",
      },
      desire: {
        hungry_for: `living ${v.name.toLowerCase()} without compromise`,
        protecting: 'sense of safety and predictability',
        relief_sought: 'alignment between values and actions',
      },
      wound: 'gap between who I am and who I want to be',
      wince_moment: 'knowing I could do more but choosing comfort',
      nod_moment: 'I chose this value because I feel the gap',
    })),
  };
}

function generateFallbackWoop(analysis: StoryAnalysis): WOOPItem[] {
  const allCategories: WOOPItem['obstacle_categories'][0][] = [
    'AVOIDANCE',
    'TIMING',
    'SELF-PROTECTION',
    'EXCESS',
    'IDENTITY',
  ];

  return analysis.values_analysis.map((a, i) => ({
    value_id: a.value_id,
    outcomes: [
      a.desire.relief_sought || `I live ${a.value_name.toLowerCase()} fully and feel aligned`,
      `I experience ${a.value_name.toLowerCase()} in my daily choices and relationships`,
      `I feel proud of how ${a.value_name.toLowerCase()} shows up in my life`,
    ],
    obstacles: [
      `my ${a.affect.deeper || 'fear'} that keeps me from ${a.behavior.aspirational || 'moving forward'}`,
      `my tendency to ${a.behavior.protective || 'stay comfortable'} when challenged`,
      `my belief that ${a.cognition.lie || 'conditions must be perfect first'}`,
    ],
    obstacle_categories: [
      allCategories[i % allCategories.length],
      allCategories[(i + 1) % allCategories.length],
      allCategories[(i + 2) % allCategories.length],
    ],
    reframes: [
      'The obstacle is the way',
      'Small steps, big shifts',
      'Progress over perfection',
    ],
  }));
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
      const fallbackAnalysis = generateFallbackAnalysis(requestValues, requestStory);
      return NextResponse.json({
        language_to_echo: fallbackAnalysis.language_to_echo,
        analysis: fallbackAnalysis.values_analysis,
        woop: generateFallbackWoop(fallbackAnalysis),
        fallback: true,
      });
    }

    console.log('[WOOP] Generating analysis and WOOP...');

    const stream = await client.messages.stream({
      ...CONFIG,
      tools,
      tool_choice: { type: 'tool', name: 'analyze_and_generate_woop' },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(requestValues, requestStory) }],
    });

    const response = await stream.finalMessage();
    const result = extractToolUse<{
      language_to_echo: string[];
      analysis: ValueAnalysis[];
      woop: WOOPItem[];
    }>(response, 'analyze_and_generate_woop');

    // Validate and fallback if needed
    if (!result || !validateResult(result, requestValues)) {
      console.warn('[WOOP] Validation failed, using fallback');
      const fallbackAnalysis = generateFallbackAnalysis(requestValues, requestStory);
      return NextResponse.json({
        language_to_echo: fallbackAnalysis.language_to_echo,
        analysis: fallbackAnalysis.values_analysis,
        woop: generateFallbackWoop(fallbackAnalysis),
        fallback: true,
      });
    }

    console.log('[WOOP] Complete. Categories:', result.woop.map((w) => w.obstacle_categories));

    return NextResponse.json({
      language_to_echo: result.language_to_echo,
      analysis: result.analysis,
      woop: result.woop,
    } as WOOPResponse);

  } catch (error) {
    console.error('[WOOP] Error:', error);

    if (requestValues.length > 0) {
      const fallbackAnalysis = generateFallbackAnalysis(requestValues, requestStory);
      return NextResponse.json({
        language_to_echo: fallbackAnalysis.language_to_echo,
        analysis: fallbackAnalysis.values_analysis,
        woop: generateFallbackWoop(fallbackAnalysis),
        fallback: true,
        error: 'Pipeline failed, using fallback',
      });
    }

    return NextResponse.json({ error: 'Failed to generate WOOP' }, { status: 500 });
  }
}
