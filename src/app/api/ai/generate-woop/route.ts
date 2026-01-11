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
  outcome: string;
  obstacle: string;
  obstacle_category: 'AVOIDANCE' | 'EXCESS' | 'TIMING' | 'SELF-PROTECTION' | 'IDENTITY';
  reframe: string;
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
2. Then, generate WOOP statements based on your analysis
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

**OUTCOME** (10-20 words)
- Speaks to their DESIRE
- Vivid, emotional, relational
- Starts with "I", present tense

**OBSTACLE** (8-15 words)
- MUST start with "my [feeling-word]..."
- Names deeper AFFECT, not surface
- Format: "my [feeling] that/of [pattern]"

**OBSTACLE_CATEGORY** - Assign DIFFERENT categories across values:
- AVOIDANCE: Dodging discomfort/vulnerability
- EXCESS: Overdoing, perfectionism
- TIMING: Waiting, rushing, delaying
- SELF-PROTECTION: Hiding, minimizing
- IDENTITY: Role constraints

**REFRAME** (3-8 words)
- Flips protective behavior into fuel
- Has rhythm, tension, surprise
- Sticky enough for a post-it note

## THIN STORY HANDLING

If story is sparse (<30 words):
1. Use chosen VALUES as signals
2. Infer patterns from common human experiences
3. Note that thin stories often indicate AVOIDANCE patterns

## QUALITY GATE

Before returning, verify:
□ Each OUTCOME speaks to specific desire
□ Each OBSTACLE names a feeling (not just behavior)
□ Each OBSTACLE passes wince-and-nod test
□ Each REFRAME has rhythm + tension + surprise
□ At least 2 different obstacle categories used
□ Language from story echoed in outputs`;

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
              outcome: { type: 'string' },
              obstacle: { type: 'string' },
              obstacle_category: {
                type: 'string',
                enum: ['AVOIDANCE', 'EXCESS', 'TIMING', 'SELF-PROTECTION', 'IDENTITY'],
              },
              reframe: { type: 'string' },
            },
            required: ['value_id', 'outcome', 'obstacle', 'obstacle_category', 'reframe'],
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
    (w) => w.outcome && w.obstacle && w.obstacle_category && w.reframe
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
  const categories: WOOPItem['obstacle_category'][] = [
    'AVOIDANCE',
    'TIMING',
    'SELF-PROTECTION',
    'EXCESS',
    'IDENTITY',
  ];

  return analysis.values_analysis.map((a, i) => ({
    value_id: a.value_id,
    outcome:
      a.desire.relief_sought || `I live ${a.value_name.toLowerCase()} fully and feel aligned`,
    obstacle: `my ${a.affect.deeper || 'fear'} that keeps me from ${a.behavior.aspirational || 'moving forward'}`,
    obstacle_category: categories[i % categories.length],
    reframe: 'The obstacle is the way',
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

    console.log('[WOOP] Complete. Categories:', result.woop.map((w) => w.obstacle_category));

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
